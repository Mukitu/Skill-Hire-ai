import { Request, Response } from 'express';
import { normalizePhone, otpStore } from '../../src/server/otpStore';
import { bdappsFetch } from '../../src/server/bdappsHelper';
import { supabaseServer } from '../../src/server/supabase';

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

  // Ensure credentials exist
  if (!APP_ID || !PASSWORD) {
    console.error('[BDApps] Missing credentials in environment');
    return res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server Configuration Error: BDApps credentials are missing. Please configure BDAPPS_APPLICATION_ID and BDAPPS_PASSWORD.' 
    });
  }

  const cleanPhone = normalizePhone(phone);

  try {
    // Real API call - Strictly following BDApps OTP Documentation
    const payload = {
      version: '1.0',
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`, // Enforcing tel: prefix (cleanPhone is normalized to 880...)
      applicationHash: APP_HASH,
      applicationMetaData: {
        client: 'MOBILEAPP',
        device: 'Samsung S10',
        os: 'android 8',
        appCode: 'https://skillhireai.vercel.app/' 
      }
    };

    const { ok, data, error } = await bdappsFetch('otp/request', payload);

    // Log to Supabase
    if (supabaseServer) {
        await supabaseServer.from('otp_logs').insert({
            phone: cleanPhone,
            reference_no: data?.referenceNo || null,
            status: ok ? 'SUCCESS' : 'FAILED'
        });
    }

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
