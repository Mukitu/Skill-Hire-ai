import { Request, Response } from 'express';
import { normalizePhone, otpStore } from '../../src/server/otpStore';
import db from '../../src/server/db';
import { bdappsFetch } from '../../src/server/bdappsHelper';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';

/**
 * BDApps OTP Verify Handler
 * Handles referenceNo validation and returns user data on success.
 */
export default async function otpVerifyHandler(req: Request, res: Response) {
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
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      referenceNo: stored.referenceNo,
      otp: code
    };

    const { ok, data, error } = await bdappsFetch('otp/verify', payload);

    if (ok && data.statusCode === 'S1000') {
      otpStore.delete(cleanPhone);
      
      const userId = `bd_${cleanPhone}`;
      let user = db.getUser(userId);
      
      if (!user) {
        user = db.createUser(userId, {
          id: userId,
          phone: cleanPhone,
          email: `${cleanPhone}@bdapps.user`,
          name: 'BDApps User',
          role: 'candidate',
          subscribed: data.subscriptionStatus === 'REGISTERED',
          reputationScore: 300,
          verifiedSkills: {},
          skills: []
        });
      } else {
          // Update subscription status if returned
          if (data.subscriptionStatus) {
              db.updateUser(user.id, { subscribed: data.subscriptionStatus === 'REGISTERED' });
          }
      }

      return res.json({
        status: 'success',
        message: 'Authentication successful',
        user,
        subscriptionStatus: data.subscriptionStatus
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
