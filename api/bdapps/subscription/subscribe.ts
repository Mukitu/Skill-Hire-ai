import { Request, Response } from 'express';
import db from '../../../src/server/db';
import { normalizePhone } from '../../../src/server/otpStore';
import { bdappsFetch } from '../../../src/server/bdappsHelper';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';

/**
 * Vercel Serverless entry point for /api/bdapps/subscription/subscribe
 */
export default async function subscribeHandler(req: Request, res: Response) {
  const { phone, userId } = req.body;
  
  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);

  // Ensure credentials exist
  if (!APP_ID || !PASSWORD) {
    console.error('[BDApps] Missing credentials in environment');
    return res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server Configuration Error: BDApps credentials are missing.' 
    });
  }

  try {
    const payload = {
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`,
      action: 1 // 1: Subscribe
    };

    const { ok, data, error } = await bdappsFetch('subscription/send', payload);

    if (ok) {
      const isSubscribed = data.statusCode === 'S1000' || data.statusCode === 'E1351' || data.status === 'SUCCESS';
      
      if (isSubscribed) {
        db.updateSubscription(cleanPhone, 'subscribed', 'subscribe', '3.00 BDT', {
          subscriberId: `tel:${cleanPhone}`,
          status: 'REGISTERED'
        });
        
        if (userId) {
          db.updateUser(userId, { subscribed: true });
        }
      }
      return res.json(data);
    }

    throw error || new Error('BDApps subscription request failed');
  } catch (error) {
    console.error('[BDApps] Subscription Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Subscription gateway unreachable',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
