import { Request, Response } from 'express';
import { normalizePhone, otpStore } from '../../../src/server/otpStore';
import db from '../../../src/server/db';
import { bdappsFetch } from '../../../src/server/bdappsHelper';
import { supabaseServer } from '../../../src/server/supabase';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';

/**
 * Vercel Serverless entry point for /api/bdapps/auth/otp-verify
 * Inline handler to avoid relative import issues inside Vercel api directory.
 */
export default async function otpVerifyHandler(req: Request, res: Response) {
  const { phone, code } = req.body || {};

  if (!phone || !code) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone and OTP code are required' });
  }

  const cleanPhone = normalizePhone(phone);
  const stored = otpStore.get(cleanPhone);

  if (!stored) {
    return res.status(400).json({ status: 'ERROR', message: 'No pending OTP request found for this number' });
  }

  // Ensure credentials exist
  if (!APP_ID || !PASSWORD) {
    console.error('[BDApps] Missing credentials in environment');
    return res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server Configuration Error: BDApps credentials are missing.' 
    });
  }

  try {
    // Real API call
    const payload = {
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      referenceNo: stored.referenceNo,
      otp: code
    };

    const { ok, data, error } = await bdappsFetch('otp/verify', payload);

    if (supabaseServer) {
        await supabaseServer.from('otp_logs').insert({
            phone: cleanPhone,
            reference_no: stored.referenceNo,
            status: ok ? 'VERIFIED' : 'FAILED',
            otp_code: code
        });
    }

    if (ok && data.statusCode === 'S1000') {
      otpStore.delete(cleanPhone);
      
      // Step 2: Trigger Subscription Activation as per PDF (action 1 = subscribe)
      const subPayload = {
        version: '1.0',
        applicationId: APP_ID,
        password: PASSWORD,
        subscriberId: `tel:${cleanPhone}`,
        action: 1 
      };
      
      const subResult = await bdappsFetch('subscription/send', subPayload);
      const isSubscribed = subResult.ok && (subResult.data.statusCode === 'S1000' || subResult.data.statusCode === 'E1351'); // E1351 = already subscribed

      const userId = req.body.userId || `bd_${cleanPhone}`;
      let user = db.getUser(userId);
      
      if (!user) {
        user = db.createUser(userId, {
          id: userId,
          phone: cleanPhone,
          email: `${cleanPhone}@bdapps.user`,
          name: 'BDApps User',
          role: 'candidate',
          subscribed: isSubscribed,
          reputationScore: 300,
          verifiedSkills: {},
          skills: []
        });
      } else {
          db.updateUser(user.id, { subscribed: isSubscribed });
      }

      // Update subscription record with official metadata
      db.updateSubscription(cleanPhone, isSubscribed ? 'subscribed' : 'unsubscribed', 'otp_verify', '3.00 BDT', {
          subscriberId: `tel:${cleanPhone}`,
          status: isSubscribed ? 'REGISTERED' : 'PENDING'
      });

      return res.json({
        status: 'success',
        message: 'OTP verified and subscription requested',
        user,
        subscriptionStatus: isSubscribed ? 'REGISTERED' : 'UNREGISTERED'
      });
    }

    if (data && data.statusCode) {
      return res.status(401).json({
        status: 'ERROR',
        message: data.statusDetail || 'Invalid or expired verification code',
        statusCode: data.statusCode
      });
    }

    throw error || new Error('All BDApps verification endpoints failed');
  } catch (error) {
    console.error('[BDApps] OTP Verify Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Network error verifying OTP',
      error: error instanceof Error ? error.message : 'Unknown'
    });
  }
}

