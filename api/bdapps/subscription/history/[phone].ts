import { Request, Response } from 'express';
import db from '../../../../src/server/db';
import { normalizePhone } from '../../../../src/server/otpStore';

/**
 * Vercel Serverless entry point for /api/bdapps/subscription/history/[phone]
 */
export default async function historyHandler(req: Request, res: Response) {
  const phone = req.params.phone || (req.query.phone as string);
  
  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);

  try {
    const history = db.getSubscriptionHistory(cleanPhone);
    return res.json({ status: 'SUCCESS', history });
  } catch (error) {
    console.error('[BDApps History] Error:', error);
    return res.status(500).json({ status: 'ERROR', message: 'Could not fetch history' });
  }
}
