import { Router, Request, Response } from 'express';
import db from './db';
import { normalizePhone, otpStore } from './otpStore';
import otpRequestHandler from '../../api/bdapps/otp-request';
import otpVerifyHandler from '../../api/bdapps/otp-verify';
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
  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      db.updateSubscription(cleanPhone, action === '1' ? 'subscribed' : 'unsubscribed', action === '1' ? 'subscribe' : 'unsubscribe');
      return res.json({
        status: 'SUCCESS',
        message: action === '1' ? 'Subscribed successfully (Simulated)' : 'Unsubscribed successfully (Simulated)',
        isSimulated: true,
        statusCode: 'S1000'
      });
    }

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

/**
 * 4. Get Subscriber Status
 * POST /subscription/getStatus
 */
export const handleSubscriptionStatus = async (req: Request, res: Response) => {
  const { phone } = req.params;

  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      return res.json({
        phone: cleanPhone,
        status: 'subscribed',
        isSimulated: true
      });
    }

    const payload = {
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`
    };

    const { ok, data, error } = await bdappsFetch('subscription/getStatus', payload);

    if (ok) {
      // Transform BDApps response to our frontend format
      return res.json({
        phone: cleanPhone,
        status: data.status === 'SUBSCRIBED' ? 'subscribed' : 'unsubscribed',
        raw: data
      });
    }

    throw error || new Error('Failed to query status');
  } catch (error) {
    return res.status(500).json({ status: 'ERROR', message: 'Failed to query status' });
  }
};

// Router Definition
bdappsRouter.post('/auth/otp-send', handleOtpSend);
bdappsRouter.post('/auth/otp-verify', handleOtpVerify);
bdappsRouter.post('/subscription/subscribe', (req, res) => handleSubscriptionAction(req, res, '1'));
bdappsRouter.post('/subscription/unsubscribe', (req, res) => handleSubscriptionAction(req, res, '0'));
bdappsRouter.get('/subscription/status/:phone', handleSubscriptionStatus);

// Backward compatibility routes
bdappsRouter.post('/otp/request', handleOtpSend);
bdappsRouter.post('/otp/verify', handleOtpVerify);

// Direct documentation-specific routes
bdappsRouter.post('/otp-request', handleOtpSend);
bdappsRouter.post('/otp-verify', handleOtpVerify);

export { bdappsRouter };
