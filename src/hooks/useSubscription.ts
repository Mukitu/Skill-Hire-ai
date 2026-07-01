import { useState, useEffect } from 'react';

export interface SubscriptionStatus {
  phone: string;
  status: 'subscribed' | 'unsubscribed';
  date?: string;
  isSimulated?: boolean;
}

export interface SubscriptionHistoryItem {
  id: string;
  phone: string;
  action: 'subscribe' | 'unsubscribe' | 'renew' | 'check' | string;
  amount: string;
  status: string;
  date: string;
  user_id?: string;
  created_at: string;
}

export function useSubscription(phone: string, userId?: string) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bdapps/subscription/status/${phone}`);
      const data = await res.json();
      if (res.ok) {
        setSubscription({
          phone: data.phone,
          status: data.status,
          date: data.date,
          isSimulated: data.isSimulated
        });
      } else {
        setError(data.message || 'Failed to fetch subscription status');
      }
    } catch (err) {
      setError('Connection failure checking subscription status.');
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bdapps/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, userId })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        setSubscription({
          phone: phoneNumber,
          status: 'subscribed',
          date: new Date().toISOString().split('T')[0],
          isSimulated: data.isSimulated
        });
        await fetchHistory(phoneNumber);
        return true;
      } else {
        setError(data.message || 'Subscription failed');
        return false;
      }
    } catch (err) {
      setError('Connection failure subscribing.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bdapps/subscription/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, userId })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        setSubscription({
          phone: phoneNumber,
          status: 'unsubscribed',
          date: new Date().toISOString().split('T')[0],
          isSimulated: data.isSimulated
        });
        await fetchHistory(phoneNumber);
        return true;
      } else {
        setError(data.message || 'Unsubscribe failed');
        return false;
      }
    } catch (err) {
      setError('Connection failure unsubscribing.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const renew = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bdapps/subscription/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, userId })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        setSubscription({
          phone: phoneNumber,
          status: 'subscribed',
          date: new Date().toISOString().split('T')[0]
        });
        await fetchHistory(phoneNumber);
        return true;
      } else {
        setError(data.message || 'Renewal simulation failed');
        return false;
      }
    } catch (err) {
      setError('Connection failure renewing.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    try {
      const res = await fetch(`/api/bdapps/subscription/history/${phoneNumber}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load subscription history:', err);
    }
  };

  useEffect(() => {
    if (phone) {
      fetchStatus();
      fetchHistory(phone);
    }
  }, [phone]);

  return {
    subscription,
    history,
    loading,
    error,
    subscribe,
    unsubscribe,
    checkStatus: fetchStatus,
    renew,
    fetchHistory,
    isLocked: subscription ? subscription.status !== 'subscribed' : true
  };
}
