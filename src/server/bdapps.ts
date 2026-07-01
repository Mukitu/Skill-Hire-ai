import { Router, Request, Response } from 'express';
import db from './db';

/**
 * BDApps Integration Controller
 * Strictly follows official BDApps API documentation for:
 * - OTP (Request/Verify)
 * - Subscription (Send/Status/Query/Notify)
 */

const bdappsRouter = Router();

// Environment configuration
const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';
const BASE_URL = process.env.BDAPPS_BASE_URL || 'https://developer.bdapps.com';

// Local storage for OTP reference mapping (In production, use Redis or DB)
const otpStore = new Map<string, { referenceNo: string; timestamp: number; phone: string }>();

/**
 * Utility: Normalize phone number to 8801XXXXXXXXX format
 */
const normalizePhone = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10 && clean.startsWith('1')) {
    clean = '880' + clean;
  } else if (clean.length === 11 && clean.startsWith('01')) {
    clean = '88' + clean;
  }
  return clean;
};

/**
 * 1. OTP Request
 * POST /otp/request
 */
export const handleOtpSend = async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      // Simulation mode
      const mockReference = 'REF' + Math.random().toString(36).substring(7).toUpperCase();
      const mockOtp = '123456';
      
      otpStore.set(cleanPhone, {
        referenceNo: mockReference,
        timestamp: Date.now(),
        phone: cleanPhone
      });

      console.log(`[BDApps Simulation] OTP Sent to ${cleanPhone}: ${mockOtp} (Ref: ${mockReference})`);
      
      return res.json({
        status: 'success',
        message: 'Simulation OTP dispatched',
        code: mockOtp, // Return code only in simulation
        isSimulated: true,
        referenceNo: mockReference,
        statusCode: 'S1000'
      });
    }

    // Real API call
    const payload = {
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`,
      applicationHash: process.env.BDAPPS_APP_HASH || 'abcdefgh', // Optional but recommended
      applicationMetaData: {
        CLIENT_IP: req.ip || '127.0.0.1',
        USER_AGENT: req.get('user-agent') || 'SkillHire-Server'
      }
    };

    console.log(`[BDApps] Requesting OTP for ${cleanPhone}...`);
    const response = await fetch(`${BASE_URL}/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`[BDApps] OTP Request Response:`, data);

    if (data.statusCode === 'S1000') {
      otpStore.set(cleanPhone, {
        referenceNo: data.referenceNo,
        timestamp: Date.now(),
        phone: cleanPhone
      });

      return res.json({
        status: 'success',
        message: 'OTP verification code dispatched via BDApps',
        referenceNo: data.referenceNo,
        statusCode: 'S1000'
      });
    } else {
      return res.status(400).json({
        status: 'ERROR',
        message: data.statusDetail || 'BDApps failed to send OTP',
        statusCode: data.statusCode
      });
    }
  } catch (error) {
    console.error('[BDApps] OTP Request Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Network error sending OTP',
      error: error instanceof Error ? error.message : 'Unknown connection failure'
    });
  }
};

/**
 * 2. OTP Verify
 * POST /otp/verify
 */
export const handleOtpVerify = async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone and OTP code are required' });
  }

  const cleanPhone = normalizePhone(phone);
  const stored = otpStore.get(cleanPhone);

  if (!stored) {
    return res.status(400).json({ status: 'ERROR', message: 'No pending OTP request found for this number' });
  }

  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      // Simulation mode
      if (code === '123456') {
        otpStore.delete(cleanPhone);
        
        // Check if user exists, create if not
        const userId = `bd_${cleanPhone}`;
        let user = db.getUser(userId);
        
        if (!user) {
          user = db.createUser(userId, {
            id: userId,
            phone: cleanPhone,
            email: `${cleanPhone}@bdapps.user`,
            name: 'BDApps User',
            role: 'candidate',
            subscribed: true,
            reputationScore: 300,
            verifiedSkills: {},
            skills: []
          });
        }

        return res.json({
          status: 'success',
          message: 'OTP verified successfully (Simulated)',
          user
        });
      } else {
        return res.status(401).json({ status: 'ERROR', message: 'Invalid simulation OTP' });
      }
    }

    // Real API call
    const payload = {
      applicationId: APP_ID,
      password: PASSWORD,
      referenceNo: stored.referenceNo,
      otp: code
    };

    console.log(`[BDApps] Verifying OTP for Ref: ${stored.referenceNo}...`);
    const response = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`[BDApps] OTP Verify Response:`, data);

    if (data.statusCode === 'S1000') {
      otpStore.delete(cleanPhone);
      
      // Check if user exists, create if not
      const userId = `bd_${cleanPhone}`;
      let user = db.getUser(userId);
      
      if (!user) {
        user = db.createUser(userId, {
          id: userId,
          phone: cleanPhone,
          email: `${cleanPhone}@bdapps.user`,
          name: 'BDApps User',
          role: 'candidate',
          subscribed: false,
          reputationScore: 300,
          verifiedSkills: {},
          skills: []
        });
      }

      return res.json({
        status: 'success',
        message: 'Authentication successful',
        user
      });
    } else {
      return res.status(401).json({
        status: 'ERROR',
        message: data.statusDetail || 'Invalid or expired verification code',
        statusCode: data.statusCode
      });
    }
  } catch (error) {
    console.error('[BDApps] OTP Verify Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Network error verifying OTP',
      error: error instanceof Error ? error.message : 'Unknown'
    });
  }
};

/**
 * 3. Subscription Send (Subscribe/Unsubscribe)
 * POST /subscription/send
 */
const handleSubscriptionAction = async (req: Request, res: Response, action: '1' | '0') => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      db.updateSubscription(cleanPhone, action === '1' ? 'subscribed' : 'unsubscribed', action === '1' ? 'subscribe' : 'unsubscribe');
      return res.json({
        status: 'SUCCESS',
        message: action === '1' ? 'Subscribed successfully (Simulated)' : 'Unsubscribed successfully (Simulated)',
        isSimulated: true,
        statusCode: 'S1000'
      });
    }

    const payload = {
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`,
      action: action // 1: Subscribe, 0: Unsubscribe
    };

    console.log(`[BDApps] Subscription Send (Action: ${action}) for ${cleanPhone}...`);
    const response = await fetch(`${BASE_URL}/subscription/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`[BDApps] Subscription Response:`, data);

    if (data.statusCode === 'S1000' || data.status === 'SUCCESS') {
      db.updateSubscription(cleanPhone, action === '1' ? 'subscribed' : 'unsubscribed', action === '1' ? 'subscribe' : 'unsubscribe');
    }

    return res.json(data);
  } catch (error) {
    console.error('[BDApps] Subscription Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Subscription gateway unreachable'
    });
  }
};

/**
 * 4. Get Subscriber Status
 * POST /subscription/getStatus
 */
export const handleSubscriptionStatus = async (req: Request, res: Response) => {
  const { phone } = req.params;

  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      return res.json({
        phone: cleanPhone,
        status: 'subscribed',
        isSimulated: true
      });
    }

    const payload = {
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`
    };

    const response = await fetch(`${BASE_URL}/subscription/getStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // Transform BDApps response to our frontend format
    return res.json({
      phone: cleanPhone,
      status: data.status === 'SUBSCRIBED' ? 'subscribed' : 'unsubscribed',
      raw: data
    });
  } catch (error) {
    return res.status(500).json({ status: 'ERROR', message: 'Failed to query status' });
  }
};

// Router Definition
bdappsRouter.post('/auth/otp-send', handleOtpSend);
bdappsRouter.post('/auth/otp-verify', handleOtpVerify);
bdappsRouter.post('/subscription/subscribe', (req, res) => handleSubscriptionAction(req, res, '1'));
bdappsRouter.post('/subscription/unsubscribe', (req, res) => handleSubscriptionAction(req, res, '0'));
bdappsRouter.get('/subscription/status/:phone', handleSubscriptionStatus);

// Backward compatibility routes
bdappsRouter.post('/otp/request', handleOtpSend);
bdappsRouter.post('/otp/verify', handleOtpVerify);

export { bdappsRouter };
