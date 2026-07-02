import { Request, Response } from 'express';
import db from '../../../src/server/db';
import { normalizePhone } from '../../../src/server/otpStore';
import { bdappsFetch } from '../../../src/server/bdappsHelper';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';

/**
 * Vercel Serverless entry point for /api/bdapps/subscription/unsubscribe
 */
export default async function unsubscribeHandler(req: Request, res: Response) {
  const { phone, userId } = req.body;
  
  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  
  // Ensure credentials exist
  if (!APP_ID || !PASSWORD) {
    console.error('[BDApps Unsubscribe] Missing credentials');
    return res.status(500).json({ status: 'ERROR', message: 'BDApps credentials missing' });
  }

  try {
    const payload = {
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`,
      action: 0 // 0 = Unsubscribe
    };
    
    const { ok, data, error } = await bdappsFetch('subscription/send', payload);
    
    if (ok && (data.statusCode === 'S1000' || data.statusCode === 'E1350' || data.status === 'SUCCESS')) { // E1350 = already unsubscribed
      db.updateSubscription(cleanPhone, 'unsubscribed', 'unsubscribe', '0 BDT', {
        status: 'UNREGISTERED'
      });
      
      if (userId) {
        db.updateUser(userId, { subscribed: false });
      }
      
      return res.json({ status: 'SUCCESS', message: 'Successfully unsubscribed' });
    }
    
    return res.status(400).json({ 
      status: 'ERROR', 
      message: data?.statusDetail || 'Unsubscribe failed',
      statusCode: data?.statusCode
    });
  } catch (error) {
    console.error('[BDApps Unsubscribe] Error:', error);
    return res.status(500).json({ status: 'ERROR', message: 'Unsubscribe gateway error' });
  }
}
