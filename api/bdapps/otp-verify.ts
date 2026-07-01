import { Request, Response } from 'express';
import { normalizePhone, otpStore } from '../../src/server/otpStore';
import db from '../../src/server/db';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';
const BASE_URL = process.env.BDAPPS_BASE_URL || 'https://developer.bdapps.com';

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
      applicationId: APP_ID,
      password: PASSWORD,
      referenceNo: stored.referenceNo,
      otp: code
    };

    console.log(`[BDApps] Verifying OTP for Ref: ${stored.referenceNo}...`);
    const response = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BDApps] OTP Verify HTTP Error ${response.status}:`, errorText);
      throw new Error(`BDApps Gateway returned HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[BDApps] OTP Verify Response:`, data);

    if (data.statusCode === 'S1000') {
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
}
