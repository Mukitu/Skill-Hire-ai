import { Request, Response } from 'express';
import handler from '../otp-request';

/**
 * Vercel Serverless entry point for /api/bdapps/auth/otp-send
 */
export default async function otpSendHandler(req: Request, res: Response) {
  return handler(req, res);
}
