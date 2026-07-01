import { Request, Response } from 'express';
import { normalizePhone, otpStore } from '../../src/server/otpStore';

const APP_ID = process.env.BDAPPS_APPLICATION_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';
const BASE_URL = process.env.BDAPPS_BASE_URL || 'https://developer.bdapps.com';
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
      applicationId: APP_ID,
      password: PASSWORD,
      subscriberId: `tel:${cleanPhone}`, // Enforcing tel: prefix
      applicationHash: APP_HASH,
      applicationMetaData: {
        client: 'WEBBROWSER',
        device: 'PC/Mobile Browser',
        os: 'Web-Client',
        appCode: 'https://skillhireai.vercel.app/' // Correct website URL
      }
    };

    console.log(`[BDApps] Requesting OTP for ${cleanPhone}...`);
    
    const response = await fetch(`${BASE_URL}/otp/request`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BDApps] OTP Request HTTP Error ${response.status}:`, errorText);
      throw new Error(`BDApps Gateway returned HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[BDApps] OTP Request Response:`, data);

    if (data.statusCode === 'S1000') {
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
    } else {
      return res.status(400).json({
        status: 'ERROR',
        message: data.statusDetail || 'BDApps failed to send OTP',
        statusCode: data.statusCode
      });
    }
  } catch (error) {
    console.error('[BDApps] OTP Request Exception:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Network error sending OTP',
      error: error instanceof Error ? error.message : 'Unknown connection failure'
    });
  }
}
