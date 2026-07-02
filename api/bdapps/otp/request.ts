import { Request, Response } from 'express';
import handler from '../otp-request';

/**
 * Vercel Serverless entry point for /api/bdapps/otp/request
 */
export default async function otpRequestAliasHandler(req: Request, res: Response) {
  return handler(req, res);
}
