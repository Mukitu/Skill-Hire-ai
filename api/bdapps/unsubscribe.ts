import { Request, Response } from 'express';
import handler from './subscription/unsubscribe';

/**
 * Vercel Serverless entry point for /api/bdapps/unsubscribe
 */
export default async function unsubscribeAliasHandler(req: Request, res: Response) {
  return handler(req, res);
}
