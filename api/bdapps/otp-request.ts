import { Request, Response } from 'express';
import { normalizePhone, otpStore } from '../../src/server/otpStore';
import { bdappsFetch } from '../../src/server/bdappsHelper';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';
const APP_HASH = process.env.BDAPPS_APP_HASH || 'abcdefgh';

/**
 * BDApps OTP Request Handler
 * Strictly follows BDApps documentation to avoid network errors.
 */
export default async function otpRequestHandler(req: Request, res: Response) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ status: 'ERROR', message: 'Phone number is required' });
  }

  const cleanPhone = normalizePhone(phone);
  const isReal = APP_ID && PASSWORD && !APP_ID.startsWith('DEMO');

  try {
    if (!isReal) {
      // Simulation mode
      const mockReference = 'REF' + Math.random().toString(36).substring(7).toUpperCase();
      const mockOtp = '123456';
      
      otpStore.set(cleanPhone, {
        referenceNo: mockReference,
        timestamp: Date.now(),
        phone: cleanPhone
      });

      console.log(`[BDApps Simulation] OTP Sent to ${cleanPhone}: ${mockOtp} (Ref: ${mockReference})`);
      
      return res.json({
        status: 'success',
        message: 'Simulation OTP dispatched',
        code: mockOtp,
        isSimulated: true,
        referenceNo: mockReference,
        statusCode: 'S1000'
      });
    }

    // Real API call - Strictly following BDApps OTP Documentation
    const payload = {
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`, // Enforcing tel: prefix
      applicationHash: APP_HASH,
      applicationMetaData: {
        client: 'MOBILEAPP',
        device: 'Samsung S10',
        os: 'android 8',
        appCode: 'https://skillhireai.vercel.app/' 
      }
    };

    const { ok, data, error } = await bdappsFetch('otp/request', payload);

    if (ok && data.statusCode === 'S1000') {
      otpStore.set(cleanPhone, {
        referenceNo: data.referenceNo,
        timestamp: Date.now(),
        phone: cleanPhone
      });

      return res.json({
        status: 'success',
        message: 'OTP verification code dispatched via BDApps',
        referenceNo: data.referenceNo,
        statusCode: 'S1000'
      });
    }

    if (data && data.statusCode) {
      return res.status(400).json({
        status: 'ERROR',
        message: data.statusDetail || 'BDApps failed to send OTP',
        statusCode: data.statusCode
      });
    }

    throw error || new Error('All BDApps endpoints failed');
  } catch (error) {
    console.error('[BDApps] OTP Request Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Network error sending OTP',
      error: error instanceof Error ? error.message : 'Unknown connection failure'
    });
  }
}
