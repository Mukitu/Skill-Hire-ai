import { Request, Response } from 'express';
import db from '../../../../src/server/db';
import { normalizePhone } from '../../../../src/server/otpStore';
import { bdappsFetch } from '../../../../src/server/bdappsHelper';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';

/**
 * Vercel Serverless entry point for /api/bdapps/subscription/status/[phone]
 */
export default async function statusHandler(req: Request, res: Response) {
  const phone = req.params.phone || (req.query.phone as string);
  
  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  
  // Ensure credentials exist
  if (!APP_ID || !PASSWORD) {
    console.error('[BDApps Status] Missing credentials');
    
    // Fallback to local DB if credentials are not configured
    const localSub = db.getSubscription(cleanPhone);
    return res.json({
      status: localSub?.status || 'unsubscribed',
      phone: cleanPhone,
      date: localSub?.date || new Date().toISOString().split('T')[0]
    });
  }

  try {
    const payload = {
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`
    };
    
    const { ok, data, error } = await bdappsFetch('subscription/getStatus', payload);
    
    if (ok) {
      const isActive = data.status === 'REGISTERED';
      
      db.updateSubscription(cleanPhone, isActive ? 'subscribed' : 'unsubscribed', 'status_query', '0 BDT', {
        subscriberId: `tel:${cleanPhone}`,
        status: data.status,
        operator: data.operator || 'ROBI'
      });
      
      return res.json({
        status: isActive ? 'subscribed' : 'unsubscribed',
        phone: cleanPhone,
        date: new Date().toISOString().split('T')[0],
        details: data
      });
    }
    
    throw error || new Error('Status query failed');
  } catch (error) {
    console.error('[BDApps Status] Error:', error);
    
    const localSub = db.getSubscription(cleanPhone);
    return res.json({
      status: localSub?.status || 'unsubscribed',
      phone: cleanPhone,
      date: localSub?.date || new Date().toISOString().split('T')[0]
    });
  }
}
