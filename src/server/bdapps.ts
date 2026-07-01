import { Router, Request, Response } from 'express';
import { db } from './db';
import { 
  getSubscriptionHistoryFromSupabase,
  saveProfileToSupabase,
  saveSubscriptionToSupabase,
  saveSubscriptionHistoryToSupabase,
  isSupabaseServerConfigured,
  supabaseServer
} from './supabase';

const router = Router();

// Store temporary OTP states: phone -> { code: string, expires: number }
const otpStore: Record<string, { code: string; expires: number }> = {};

// Store temporary Auth OTP states: phone -> { code: string, expires: number, referenceNo: string }
const authOtpStore: Record<string, { code: string; expires: number; referenceNo: string }> = {};

// Helper to normalize phone number to standard 88018XXXXXXXX format
function normalizePhone(phone: string): string {
  let cleanPhone = phone.trim().replace(/^\+/, '').replace(/\s/g, '');
  if (!cleanPhone.startsWith('880')) {
    cleanPhone = '880' + cleanPhone.replace(/^0/, '');
  }
  return cleanPhone;
}

// Helper to get bdapps credentials
function getBdappsCredentials() {
  const appId = process.env.BDAPPS_APPLICATION_ID || process.env.BDAPPS_APP_ID;
  const password = process.env.BDAPPS_PASSWORD;
  const baseUrl = (process.env.BDAPPS_BASE_URL || 'https://api.bdapps.com').replace(/\/$/, '');
  const isReal = !!(appId && password);
  return { appId, password, baseUrl, isReal };
}

// 1. Request Auth OTP
const handleOtpSend = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ status: 'error', message: 'Valid phone number is required.' });
  }

  const cleanPhone = normalizePhone(phone);
  const { appId, password, baseUrl, isReal } = getBdappsCredentials();

  if (isReal) {
    try {
      console.log(`[bdapps Real API] Sending OTP request for ${cleanPhone} to ${baseUrl}...`);
      const response = await fetch(`${baseUrl}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          password: password,
          subscriberId: `tel:${cleanPhone}`
        })
      });
      const data = await response.json() as any;
      console.log('[bdapps Real API] OTP Response:', data);

      if (data && (data.statusCode === 'S1000' || data.statusCode === '200' || data.statusDetail === 'Success')) {
        const referenceNo = data.referenceNo || ('REF-' + Math.random().toString(36).substring(2, 10).toUpperCase());
        authOtpStore[cleanPhone] = {
          code: 'REAL_VIA_SMS',
          referenceNo,
          expires: Date.now() + 5 * 60 * 1000
        };

        return res.json({
          status: 'success',
          isSimulated: false,
          referenceNo,
          message: 'OTP sent successfully to your phone via bdapps.'
        });
      } else {
        return res.status(500).json({
          status: 'error',
          message: `bdapps API returned error: ${data?.statusDetail || 'Unknown error'} (${data?.statusCode || 'No code'})`
        });
      }
    } catch (err: any) {
      console.error('[bdapps Real API] Exception during OTP request:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to request OTP via real bdapps gateway. ' + (err.message || '')
      });
    }
  }

  // Simulator Fallback Mode
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const referenceNo = 'MOCK-REF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  authOtpStore[cleanPhone] = {
    code,
    referenceNo,
    expires: Date.now() + 5 * 60 * 1000
  };

  console.log(`[bdapps Simulated OTP] Generated Auth OTP ${code} for phone ${cleanPhone}`);

  return res.json({
    status: 'success',
    isSimulated: true,
    code,
    referenceNo,
    message: 'Simulated OTP code dispatched successfully.'
  });
};

router.post('/send-otp', handleOtpSend);
router.post('/auth/otp-send', handleOtpSend);

// 2. Verify Auth OTP & Log In / Register
const handleOtpVerify = async (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ status: 'error', message: 'Phone and OTP code are required.' });
  }

  const cleanPhone = normalizePhone(phone);
  const stored = authOtpStore[cleanPhone];
  if (!stored) {
    return res.status(404).json({ status: 'error', message: 'No OTP request found for this phone.' });
  }

  if (stored.expires < Date.now()) {
    delete authOtpStore[cleanPhone];
    return res.status(400).json({ status: 'error', message: 'OTP code has expired.' });
  }

  const { appId, password, baseUrl, isReal } = getBdappsCredentials();
  let subscriberId = `tel:${cleanPhone}`;

  if (isReal && stored.code === 'REAL_VIA_SMS') {
    try {
      console.log(`[bdapps Real API] Verifying OTP for ${cleanPhone}...`);
      const response = await fetch(`${baseUrl}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          password: password,
          referenceNo: stored.referenceNo,
          otp: code
        })
      });
      const data = await response.json() as any;
      console.log('[bdapps Real API] OTP Verification Response:', data);

      if (data && (data.statusCode === 'S1000' || data.statusCode === '200' || data.statusDetail === 'Success')) {
        subscriberId = data.subscriberId || `tel:${cleanPhone}`;
      } else {
        return res.status(400).json({
          status: 'error',
          message: `Incorrect OTP or bdapps verification failed: ${data?.statusDetail || 'Unknown error'}`
        });
      }
    } catch (err: any) {
      console.error('[bdapps Real API] Exception during OTP verification:', err);
      return res.status(500).json({ status: 'error', message: 'Internal error communicating with bdapps Gateway.' });
    }
  } else {
    // Simulator check
    if (stored.code !== code) {
      return res.status(400).json({ status: 'error', message: 'Incorrect OTP code entered.' });
    }
    subscriberId = `tel:${cleanPhone}`;
  }

  // Authentication succeeded!
  delete authOtpStore[cleanPhone];

  // Try to find user in local DB
  let user = Object.values(db.getUsers()).find(u => u.phone === cleanPhone || u.subscriberId === subscriberId);

  // If Supabase is configured, also search in Supabase
  if (!user && isSupabaseServerConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('profiles')
        .select('*')
        .or(`phone.eq.${cleanPhone},subscriber_id.eq.${subscriberId}`)
        .maybeSingle();
      if (data) {
        user = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as any,
          title: data.title,
          bio: data.bio || '',
          skills: data.skills || [],
          reputationScore: data.reputation_score || 500,
          verifiedSkills: data.verified_skills || {},
          subscribed: true,
          phone: cleanPhone,
          subscriberId: subscriberId,
          githubUrl: data.github_url || undefined,
          portfolioUrl: data.portfolio_url || undefined,
        };
        db.createUser(user.id, user);
      }
    } catch (e) {
      console.error('[Supabase OTP verify] lookup error:', e);
    }
  }

  // Assign correct roles and names based on testing/demo numbers
  let userRole: 'candidate' | 'company' | 'admin' = 'candidate';
  let userName = `Robi/Airtel Candidate (${cleanPhone.substring(cleanPhone.length - 4)})`;
  let userTitle = 'Cloud Architect / Developer';
  let companyName = undefined;

  if (cleanPhone === '8801833445566' || cleanPhone === '01833445566') {
    userRole = 'company';
    userName = 'TechCorp Recruiter';
    userTitle = 'Senior Talent Acquisition';
    companyName = 'TechCorp Solutions';
  } else if (cleanPhone === '8801844556677' || cleanPhone === '01844556677') {
    userRole = 'admin';
    userName = 'SkillHire Platform Admin';
    userTitle = 'Super Administrator';
  }

  if (!user) {
    const id = 'user-' + Math.random().toString(36).substring(2, 10);
    user = {
      id,
      email: `bdapps-${cleanPhone}@skillhire.ai`,
      name: userName,
      role: userRole,
      title: userTitle,
      bio: 'Verified subscriber account registered securely via bdapps OTP Gateway.',
      skills: ['TypeScript', 'Node.js', 'React', 'Cloud Services'],
      reputationScore: 500,
      verifiedSkills: {},
      subscribed: true,
      phone: cleanPhone,
      subscriberId: subscriberId
    };
    db.createUser(id, user);
  } else {
    // Keep original role/name unless it's a demo number overriding them
    user = db.updateUser(user.id, { 
      phone: cleanPhone, 
      subscriberId, 
      subscribed: true,
      role: (cleanPhone === '8801833445566' || cleanPhone === '01833445566' || cleanPhone === '8801844556677' || cleanPhone === '01844556677') ? userRole : user.role,
      name: (cleanPhone === '8801833445566' || cleanPhone === '01833445566' || cleanPhone === '8801844556677' || cleanPhone === '01844556677') ? userName : user.name,
      title: (cleanPhone === '8801833445566' || cleanPhone === '01833445566' || cleanPhone === '8801844556677' || cleanPhone === '01844556677') ? userTitle : user.title
    }) || user;
  }

  // Save/Upsert profile to Supabase database
  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      await saveProfileToSupabase(user);
    } catch (e) {
      console.error('[Supabase OTP verify] saveProfile error:', e);
    }
  }

  // Sync subscription tables
  db.updateSubscription(cleanPhone, 'subscribed');
  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      await saveSubscriptionToSupabase(cleanPhone, 'subscribed', user.id);
      await saveSubscriptionHistoryToSupabase({
        id: 'sublog-' + Math.random().toString(36).substring(2, 10),
        phone: cleanPhone,
        action: 'subscribe',
        amount: '3.00 BDT',
        status: 'subscribed',
        date: new Date().toISOString().split('T')[0],
        user_id: user.id
      });
    } catch (e) {
      console.error('[Supabase OTP verify] saveSubscription error:', e);
    }
  }

  const loginSession = {
    userId: user.id,
    phone: cleanPhone,
    subscriberId,
    subscriptionStatus: 'subscribed',
    loggedInAt: new Date().toISOString()
  };

  return res.json({
    status: 'success',
    user,
    subscriberId,
    subscriptionStatus: 'subscribed',
    phone: cleanPhone,
    loginSession,
    message: 'Authenticated successfully via bdapps OTP!'
  });
};

router.post('/verify-otp', handleOtpVerify);
router.post('/auth/otp-verify', handleOtpVerify);

/**
 * bdapps Subscription API - Daily Plan (3 BDT/day)
 */

// 1. Subscribe (Direct API subscription / OTP Flow)
router.post('/subscription/subscribe', async (req: Request, res: Response) => {
  const { phone, userId } = req.body;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone number is required.' });
  }

  const cleanPhone = normalizePhone(phone);
  const { appId, password, baseUrl, isReal } = getBdappsCredentials();

  if (isReal) {
    try {
      console.log(`[bdapps Real API] Initiating Subscription for ${cleanPhone} via ${baseUrl}...`);
      const response = await fetch(`${baseUrl}/subscription/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          password: password,
          subscriberId: `tel:${cleanPhone}`,
          action: '1',
          version: '1.0'
        })
      });
      const data = await response.json() as any;
      console.log('[bdapps Real API] Subscription Response:', data);

      if (data && (data.statusCode === 'S1000' || data.statusCode === '200' || data.statusDetail === 'Success')) {
        db.updateSubscription(cleanPhone, 'subscribed', 'subscribe', '3.00 BDT');
        if (userId) {
          db.updateUser(userId, { subscribed: true, phone: cleanPhone });
        }

        // Sync with Supabase
        if (isSupabaseServerConfigured && supabaseServer) {
          try {
            await saveSubscriptionToSupabase(cleanPhone, 'subscribed', userId);
            await saveSubscriptionHistoryToSupabase({
              id: 'sublog-' + Math.random().toString(36).substring(2, 10),
              phone: cleanPhone,
              action: 'subscribe',
              amount: '3.00 BDT',
              status: 'subscribed',
              date: new Date().toISOString().split('T')[0],
              user_id: userId || null
            });
            if (userId) {
              const u = db.getUser(userId);
              if (u) {
                await saveProfileToSupabase({ ...u, subscribed: true, phone: cleanPhone });
              }
            }
          } catch (e) {
            console.error('[Supabase Subscribe Real] Sync error:', e);
          }
        }

        return res.json({
          status: 'SUCCESS',
          statusCode: 'S1000',
          message: 'Subscription successfully activated via real bdapps billing gateway! Charged 3 BDT/day.',
          details: data
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: `bdapps subscription failed: ${data?.statusDetail || 'Unknown error'} (${data?.statusCode || 'No code'})`
        });
      }
    } catch (err: any) {
      console.error('[bdapps Real API] Exception during subscription:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to complete subscription via real bdapps API: ' + (err.message || '')
      });
    }
  }

  // Simulated subscription flow - direct activation
  db.updateSubscription(cleanPhone, 'subscribed', 'subscribe', '3.00 BDT');
  if (userId) {
    db.updateUser(userId, { subscribed: true, phone: cleanPhone });
  }

  // Sync with Supabase
  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      await saveSubscriptionToSupabase(cleanPhone, 'subscribed', userId);
      await saveSubscriptionHistoryToSupabase({
        id: 'sublog-' + Math.random().toString(36).substring(2, 10),
        phone: cleanPhone,
        action: 'subscribe',
        amount: '3.00 BDT',
        status: 'subscribed',
        date: new Date().toISOString().split('T')[0],
        user_id: userId || null
      });
      if (userId) {
        const u = db.getUser(userId);
        if (u) {
          await saveProfileToSupabase({ ...u, subscribed: true, phone: cleanPhone });
        }
      }
    } catch (e) {
      console.error('[Supabase Subscribe Simulated] Sync error:', e);
    }
  }

  return res.json({
    status: 'SUCCESS',
    statusCode: 'S1000',
    isSimulated: true,
    message: 'Simulated subscription activated successfully! Daily rate: 3 BDT/day.',
    subscriptionId: 'SUB-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    chargeAmount: '3.00 BDT',
    billingFrequency: 'Daily'
  });
});

// 2. Unsubscribe
const handleUnsubscribe = async (req: Request, res: Response) => {
  const { phone, userId } = req.body;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone number is required.' });
  }

  const cleanPhone = normalizePhone(phone);
  const { appId, password, baseUrl, isReal } = getBdappsCredentials();

  if (isReal) {
    try {
      console.log(`[bdapps Real API] Initiating Unsubscription for ${cleanPhone}...`);
      const response = await fetch(`${baseUrl}/subscription/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          password: password,
          subscriberId: `tel:${cleanPhone}`,
          action: '0',
          version: '1.0'
        })
      });
      const data = await response.json() as any;
      console.log('[bdapps Real API] Unsubscription Response:', data);

      if (data && (data.statusCode === 'S1000' || data.statusCode === '200' || data.statusDetail === 'Success')) {
        db.updateSubscription(cleanPhone, 'unsubscribed', 'unsubscribe', '0.00 BDT');
        if (userId) {
          db.updateUser(userId, { subscribed: false });
        }

        // Sync with Supabase
        if (isSupabaseServerConfigured && supabaseServer) {
          try {
            await saveSubscriptionToSupabase(cleanPhone, 'unsubscribed', userId);
            await saveSubscriptionHistoryToSupabase({
              id: 'unsublog-' + Math.random().toString(36).substring(2, 10),
              phone: cleanPhone,
              action: 'unsubscribe',
              amount: '0.00 BDT',
              status: 'unsubscribed',
              date: new Date().toISOString().split('T')[0],
              user_id: userId || null
            });
            if (userId) {
              const u = db.getUser(userId);
              if (u) {
                await saveProfileToSupabase({ ...u, subscribed: false });
              }
            }
          } catch (e) {
            console.error('[Supabase Unsubscribe] Sync error:', e);
          }
        }

        return res.json({
          status: 'SUCCESS',
          statusCode: 'S1000',
          message: 'Successfully unsubscribed from SkillHire AI Daily Plan.',
          details: data
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: `bdapps unsubscription failed: ${data?.statusDetail || 'Unknown error'}`
        });
      }
    } catch (err: any) {
      console.error('[bdapps Real API] Exception during unsubscribe:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to communicate with bdapps gateway.' });
    }
  }

  // Simulated unsubscription
  db.updateSubscription(cleanPhone, 'unsubscribed', 'unsubscribe', '0.00 BDT');
  if (userId) {
    db.updateUser(userId, { subscribed: false });
  }

  // Sync with Supabase for simulated flow
  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      await saveSubscriptionToSupabase(cleanPhone, 'unsubscribed', userId);
      await saveSubscriptionHistoryToSupabase({
        id: 'unsublog-' + Math.random().toString(36).substring(2, 10),
        phone: cleanPhone,
        action: 'unsubscribe',
        amount: '0.00 BDT',
        status: 'unsubscribed',
        date: new Date().toISOString().split('T')[0],
        user_id: userId || null
      });
      if (userId) {
        const u = db.getUser(userId);
        if (u) {
          await saveProfileToSupabase({ ...u, subscribed: false });
        }
      }
    } catch (e) {
      console.error('[Supabase Unsubscribe Simulated] Sync error:', e);
    }
  }

  return res.json({
    status: 'SUCCESS',
    statusCode: 'S1000',
    isSimulated: true,
    message: 'Successfully unsubscribed from simulated daily plan.',
    phone: cleanPhone
  });
};

router.post('/unsubscribe', handleUnsubscribe);
router.post('/subscription/unsubscribe', handleUnsubscribe);

// 3. Check Subscription Status
router.get('/subscription/status/:phone', async (req: Request, res: Response) => {
  const { phone } = req.params;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone is required.' });
  }

  const cleanPhone = normalizePhone(phone);
  const { appId, password, baseUrl, isReal } = getBdappsCredentials();

  if (isReal) {
    try {
      console.log(`[bdapps Real API] Querying Status for ${cleanPhone}...`);
      const response = await fetch(`${baseUrl}/subscription/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          password: password,
          subscriberId: `tel:${cleanPhone}`
        })
      });
      const data = await response.json() as any;
      console.log('[bdapps Real API] Query Response:', data);

      if (data && (data.statusCode === 'S1000' || data.statusCode === '200')) {
        const subStatus = data.subscriptionStatus || '';
        const isActive = subStatus.toUpperCase().includes('REG') || subStatus.toUpperCase() === 'ACTIVE' || subStatus.toUpperCase() === 'REGISTERED';
        const finalStatus = isActive ? 'subscribed' : 'unsubscribed';

        // Update DB
        db.updateSubscription(cleanPhone, finalStatus, 'check', isActive ? '3.00 BDT' : '0.00 BDT');
        
        return res.json({
          phone: cleanPhone,
          status: finalStatus,
          apiStatus: subStatus,
          isSimulated: false,
          details: data
        });
      }
    } catch (err: any) {
      console.error('[bdapps Real API] Exception querying status:', err);
    }
  }

  // Simulator/Cached Check
  const sub = db.getSubscription(cleanPhone);
  return res.json({
    phone: cleanPhone,
    status: sub.status,
    date: sub.date,
    isSimulated: !isReal
  });
});

// 4. Renew Subscription
router.post('/subscription/renew', async (req: Request, res: Response) => {
  const { phone, userId } = req.body;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone is required.' });
  }

  const cleanPhone = normalizePhone(phone);
  db.updateSubscription(cleanPhone, 'subscribed', 'renew', '3.00 BDT');
  if (userId) {
    db.updateUser(userId, { subscribed: true, phone: cleanPhone });
  }

  return res.json({
    status: 'SUCCESS',
    statusCode: 'S1000',
    message: 'Daily subscription renewal logged successfully. Account access extended.',
    phone: cleanPhone,
    chargeAmount: '3.00 BDT',
    date: new Date().toISOString().split('T')[0]
  });
});

// 5. Subscription History
router.get('/subscription/history/:phone', async (req: Request, res: Response) => {
  const { phone } = req.params;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone is required.' });
  }

  const cleanPhone = normalizePhone(phone);
  
  // Try fetching from Supabase first
  let logs = await getSubscriptionHistoryFromSupabase(cleanPhone);
  
  if (!logs || logs.length === 0) {
    // Fallback to local db log
    logs = db.getSubscriptionHistory(cleanPhone);
  }

  return res.json({
    phone: cleanPhone,
    history: logs || []
  });
});

// 6. Carrier Callback (Webhook URL for renewal, suspension, or manual cancellation events)
router.post('/callback', (req: Request, res: Response) => {
  const { phone, status, eventType } = req.body;
  console.log(`[bdapps Carrier Callback] Webhook: ${eventType} for ${phone} - status: ${status}`);

  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'phone parameter missing.' });
  }

  const cleanPhone = normalizePhone(phone);

  if (status === 'active' || status === 'renewed' || status === 'registered') {
    db.updateSubscription(cleanPhone, 'subscribed', 'callback-renew', '3.00 BDT');
  } else if (status === 'suspended' || status === 'expired' || status === 'unsubscribed') {
    db.updateSubscription(cleanPhone, 'unsubscribed', 'callback-expire', '0.00 BDT');
  }

  return res.json({
    status: 'SUCCESS',
    message: 'Callback event handled successfully.'
  });
});

// Backward compatible routes for old front-ends
router.post('/otp/request', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ status: 'error', message: 'Phone is required.' });
  const cleanPhone = normalizePhone(phone);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[cleanPhone] = { code, expires: Date.now() + 5 * 60 * 1000 };
  return res.json({
    status: 'SUCCESS',
    statusCode: 'S1000',
    message: 'OTP initiated.',
    demoOtp: code,
    phone: cleanPhone
  });
});

router.post('/otp/verify', (req: Request, res: Response) => {
  const { phone, code, userId } = req.body;
  const cleanPhone = normalizePhone(phone || '');
  const stored = otpStore[cleanPhone];
  if (!stored || stored.code !== code) {
    return res.status(400).json({ status: 'error', message: 'Invalid OTP.' });
  }
  delete otpStore[cleanPhone];
  db.updateSubscription(cleanPhone, 'subscribed', 'subscribe', '3.00 BDT');
  if (userId) db.updateUser(userId, { subscribed: true, phone: cleanPhone });
  return res.json({ status: 'SUCCESS', message: 'Verified.' });
});

export const bdappsRouter = router;
export default bdappsRouter;
