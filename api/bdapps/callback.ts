import { Request, Response } from 'express';
import db from '../../src/server/db';
import { supabaseServer } from '../../src/server/supabase';

/**
 * BDApps Notification Callback (Webhook)
 * Handles subscription/unsubscription events from the platform
 */
export default async function handler(req: Request, res: Response) {
  const payload = req.body;
  
  console.log('[BDApps Callback] Received notification:', JSON.stringify(payload, null, 2));

  // Log to database
  try {
    // 0. Log to webhook_logs if Supabase is connected
    if (supabaseServer) {
        await supabaseServer.from('webhook_logs').insert({
            source: 'BDApps Callback',
            payload: payload
        });
    }

    // 1. Identify the subscriber
    const subscriberId = payload.subscriberId; // Format: tel:8801812345678
    const status = payload.status; // REGISTERED, UNREGISTERED
    const frequency = payload.frequency;
    const timeStamp = payload.timeStamp;

    if (subscriberId) {
      const phone = subscriberId.replace('tel:', '');
      
      // Update our database
      const mappedStatus = status === 'REGISTERED' ? 'subscribed' : 'unsubscribed';
      const action = status === 'REGISTERED' ? 'subscribe' : 'unsubscribe';
      
      db.updateSubscription(phone, mappedStatus, action, 'Carrier Notification');
      
      console.log(`[BDApps Callback] Successfully updated ${phone} to ${mappedStatus}`);
    }

    // Always respond with success back to BDApps
    return res.status(200).json({
      statusCode: 'S1000',
      statusDetail: 'Success'
    });
  } catch (error) {
    console.error('[BDApps Callback] Processing Error:', error);
    // Even on error, we usually want to return 200 to acknowledge receipt 
    // unless we want BDApps to retry
    return res.status(200).json({
      statusCode: 'E1601',
      statusDetail: 'System experienced an unexpected error'
    });
  }
}
