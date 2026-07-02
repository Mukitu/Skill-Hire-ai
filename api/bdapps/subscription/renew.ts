import { Request, Response } from 'express';
import db from '../../../src/server/db';
import { normalizePhone } from '../../../src/server/otpStore';

/**
 * Vercel Serverless entry point for /api/bdapps/subscription/renew
 */
export default async function renewHandler(req: Request, res: Response) {
  const { phone, userId } = req.body;
  
  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);

  try {
    // Simulate renew in database
    db.updateSubscription(cleanPhone, 'subscribed', 'renew', '3.00 BDT', {
      status: 'REGISTERED'
    });
    
    if (userId) {
      db.updateUser(userId, { subscribed: true });
    }

    return res.json({
      status: 'SUCCESS',
      statusCode: 'S1000',
      message: 'Subscription successfully renewed'
    });
  } catch (error) {
    console.error('[BDApps Renew] Error:', error);
    return res.status(500).json({ status: 'ERROR', message: 'Renew failed' });
  }
}
