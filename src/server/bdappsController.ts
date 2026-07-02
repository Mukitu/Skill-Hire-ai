import { Request, Response } from 'express';
import db from './db';
import { normalizePhone } from './otpStore';
import { bdappsFetch } from './bdappsHelper';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';

/**
 * PRODUCTION-READY BDAPPS CONTROLLER
 * Strictly following PDF documentation for:
 * - Status Query
 * - Unsubscribe Flow
 * - Subscription Sync
 */

export const getSubscriptionStatus = async (req: Request, res: Response) => {
  const { phone } = req.params;
  const cleanPhone = normalizePhone(phone);
  
  // Ensure credentials exist
  if (!APP_ID || !PASSWORD) {
    console.error('[BDApps Status] Missing credentials');
    return res.status(500).json({ status: 'ERROR', message: 'BDApps credentials missing' });
  }

  try {
    const payload = {
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`
    };
    
    const { ok, data, error } = await bdappsFetch('subscription/getStatus', payload);
    
    if (ok) {
      // PDF says status is 'REGISTERED' or 'UNREGISTERED'
      const isActive = data.status === 'REGISTERED';
      
      // Sync local DB
      db.updateSubscription(cleanPhone, isActive ? 'subscribed' : 'unsubscribed', 'status_query', '0 BDT', {
        subscriberId: `tel:${cleanPhone}`,
        status: data.status,
        operator: data.operator || 'ROBI'
      });
      
      return res.json({
        status: 'SUCCESS',
        subscribed: isActive,
        details: data
      });
    }
    
    throw error || new Error('Status query failed');
  } catch (error) {
    console.error('[BDApps Status] Error:', error);
    return res.status(500).json({ status: 'ERROR', message: 'Could not fetch status' });
  }
};

export const unsubscribe = async (req: Request, res: Response) => {
  const { phone, userId } = req.body;
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
    
    if (ok && (data.statusCode === 'S1000' || data.statusCode === 'E1350')) { // E1350 = already unsubscribed
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
};
