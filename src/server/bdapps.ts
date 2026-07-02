import { Router, Request, Response } from 'express';
import db from './db';
import { normalizePhone, otpStore } from './otpStore';
import otpRequestHandler from '../../api/bdapps/otp-request';
import otpVerifyHandler from '../../api/bdapps/otp-verify';
import callbackHandler from '../../api/bdapps/callback';
import { getSubscriptionStatus, unsubscribe } from './bdappsController';
import { bdappsFetch } from './bdappsHelper';

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

/**
 * 1. OTP Request (Linked to standalone handler)
 */
export const handleOtpSend = otpRequestHandler;

/**
 * 2. OTP Verify (Linked to standalone handler)
 */
export const handleOtpVerify = otpVerifyHandler;

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
      action: parseInt(action, 10) // 1: Subscribe, 0: Unsubscribe (Must be integer)
    };

    const { ok, data, error } = await bdappsFetch('subscription/send', payload);

    if (ok) {
      if (data.statusCode === 'S1000' || data.status === 'SUCCESS') {
        db.updateSubscription(cleanPhone, action === '1' ? 'subscribed' : 'unsubscribed', action === '1' ? 'subscribe' : 'unsubscribe');
      }
      return res.json(data);
    }

    throw error || new Error('BDApps subscription request failed');
  } catch (error) {
    console.error('[BDApps] Subscription Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Subscription gateway unreachable'
    });
  }
};

// Router Definition
bdappsRouter.post('/auth/otp-send', handleOtpSend);
bdappsRouter.post('/auth/otp-verify', handleOtpVerify);
bdappsRouter.post('/subscription/subscribe', (req, res) => handleSubscriptionAction(req, res, '1'));
bdappsRouter.post('/subscription/unsubscribe', unsubscribe);
bdappsRouter.get('/subscription/status/:phone', getSubscriptionStatus);
bdappsRouter.post('/callback', callbackHandler);
bdappsRouter.post('/notify', callbackHandler); // Alias for notification

// Backward compatibility routes
bdappsRouter.post('/otp/request', handleOtpSend);
bdappsRouter.post('/otp/verify', handleOtpVerify);

// Direct documentation-specific routes
bdappsRouter.post('/otp-request', handleOtpSend);
bdappsRouter.post('/otp-verify', handleOtpVerify);

export { bdappsRouter };
