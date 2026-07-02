import { Request, Response } from 'express';
import handler from '../otp-verify';

/**
 * Vercel Serverless entry point for /api/bdapps/auth/otp-verify
 */
export default async function otpVerifyHandler(req: Request, res: Response) {
  return handler(req, res);
}
