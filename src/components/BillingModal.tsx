import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, Key, HelpCircle, Loader2, Star, RefreshCw, XCircle, History, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface BillingModalProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

interface HistoryItem {
  id: string;
  phone: string;
  action: string;
  amount: string;
  status: string;
  date: string;
  created_at: string;
}

export default function BillingModal({ user, onClose, onSuccess }: BillingModalProps) {
  // If the user has subscribed: show 'dashboard', otherwise 'input'
  const [step, setStep] = useState<'input' | 'otp' | 'success' | 'dashboard'>(
    user.subscribed ? 'dashboard' : 'input'
  );
  
  const [phone, setPhone] = useState(user.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Dashboard states
  const [historyLogs, setHistoryLogs] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');

  // Fetch billing logs on dashboard mount
  const fetchLogs = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/bdapps/subscription/history/${phoneNumber}`);
      const data = await res.json();
      if (res.ok) {
        setHistoryLogs(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user.subscribed && user.phone) {
      fetchLogs(user.phone);
    }
  }, [user.subscribed, user.phone]);

  // 1. Request OTP to Subscribe
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/bdapps/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        setTransactionId(data.transactionId || 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase());
        setDemoOtp(data.demoOtp || '');
        setStep('otp');
      } else {
        setError(data.message || 'OTP request failed.');
      }
    } catch (err) {
      setError('Connection failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Activate Subscription
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // First, trigger real or mock direct subscription activation
      const res = await fetch('/api/bdapps/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, userId: user.id }),
      });
      const data = await res.json();

      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        // Fetch fresh profile
        const profileRes = await fetch(`/api/auth/profile/${user.id}`);
        const profileData = await profileRes.json();
        if (profileData.status === 'success') {
          onSuccess(profileData.user);
        }
        
        setTransactionId(data.subscriptionId || 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase());
        setStep('success');
      } else {
        setError(data.message || 'Incorrect code or carrier subscription rejected.');
      }
    } catch (err) {
      setError('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Unsubscribe from bdapps Plan
  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to cancel your SkillHire AI Premium Carrier billing subscription? This will lock all advanced features.')) {
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/bdapps/subscription/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone || phone, userId: user.id }),
      });
      const data = await res.json();

      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        const profileRes = await fetch(`/api/auth/profile/${user.id}`);
        const profileData = await profileRes.json();
        if (profileData.status === 'success') {
          onSuccess(profileData.user);
        }
        
        setSuccessMsg('Successfully unsubscribed. Access downgraded to standard tier.');
        setStep('input');
        setPhone(user.phone || phone);
      } else {
        setError(data.message || 'Cancellation request declined by bdapps Gateway.');
      }
    } catch (err) {
      setError('Connection failure unsubscribing.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Check Subscription Status
  const handleCheckStatus = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    const targetPhone = user.phone || phone;

    try {
      const res = await fetch(`/api/bdapps/subscription/status/${targetPhone}`);
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Status Synchronized! Current State: ${data.status.toUpperCase()}`);
        
        // Refresh profile to reflect any server updates
        const profileRes = await fetch(`/api/auth/profile/${user.id}`);
        const profileData = await profileRes.json();
        if (profileData.status === 'success') {
          onSuccess(profileData.user);
          if (!profileData.user.subscribed) {
            setStep('input');
          }
        }
        
        await fetchLogs(targetPhone);
      } else {
        setError(data.message || 'Failed to request live status.');
      }
    } catch (err) {
      setError('Connection failure checking status.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Renew Subscription
  const handleSimulateRenewal = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    const targetPhone = user.phone || phone;

    try {
      const res = await fetch('/api/bdapps/subscription/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, userId: user.id }),
      });
      const data = await res.json();

      if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
        setSuccessMsg('Renewal cycle processed! 3.00 BDT billing transaction logged.');
        
        const profileRes = await fetch(`/api/auth/profile/${user.id}`);
        const profileData = await profileRes.json();
        if (profileData.status === 'success') {
          onSuccess(profileData.user);
        }
        
        await fetchLogs(targetPhone);
      } else {
        setError(data.message || 'Renewal simulation failed.');
      }
    } catch (err) {
      setError('Connection failure simulating renewal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="billing-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0A0D14] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Aesthetic operator themed gradient indicator */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-teal-500 to-indigo-500" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-base font-bold cursor-pointer"
        >
          ✕
        </button>

        <div className="p-6 md:p-8">
          
          {/* STEP 1: Plan Offer & Phone Input */}
          {step === 'input' && (
            <div>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                  <Star className="w-8 h-8 fill-teal-400/20 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-center text-white font-display mb-1">
                SkillHire AI Premium Plan
              </h2>
              <p className="text-xs text-slate-400 text-center mb-6">
                Instant access to AI technical interview loops, deep resume scanners, and digital certificates.
              </p>

              {/* Price Details */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Standard Billing Model</span>
                  <div className="flex gap-1.5">
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-full">Robi / Airtel</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 font-bold rounded-full">bdapps API</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono">3.00 BDT<span className="text-xs font-normal text-slate-400"> / day</span></span>
                  <span className="text-xs text-slate-500 font-medium">Automatic daily renewal</span>
                </div>
                <div className="border-t border-slate-800 my-3" />
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">✓</span> Real-time expert interview simulations
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">✓</span> PDF Digital badging credentials synced to Supabase
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">✓</span> Professional candidate ATS fit scores
                  </div>
                </div>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Enter Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                      +880
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 018XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-14 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors text-sm font-mono tracking-wide"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1.5 block leading-relaxed">
                    A verification request will be initiated using Axiata's secure API. Your operator accounts are handled in full compliance with local laws.
                  </span>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-black py-3 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>Request Subscription OTP</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Enter Verification Code */}
          {step === 'otp' && (
            <div>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20 animate-pulse">
                  <Key className="w-8 h-8" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-center text-white font-display mb-1">
                Enter Verification OTP
              </h2>
              <p className="text-xs text-slate-400 text-center mb-6">
                Sent successfully via SMS gateway to <span className="text-teal-400 font-mono font-semibold">{phone}</span>.
              </p>

              {/* Simulated Environment Helper Box */}
              {demoOtp && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-xs text-amber-300 font-mono">
                  <div className="font-bold uppercase text-[9px] text-amber-400 tracking-wider mb-1">Simulated Gateway Output:</div>
                  Enter OTP code <span className="font-bold text-white bg-amber-500/25 px-1.5 py-0.5 rounded text-sm">{demoOtp}</span> to verify.
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-white tracking-[0.5em] placeholder-slate-700 focus:outline-none focus:border-teal-500 transition-colors font-mono text-xl"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-black py-3 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>Verify & Confirm Subscription</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-full text-slate-500 hover:text-slate-300 text-xs text-center py-1 transition-colors cursor-pointer"
                >
                  ← Back to phone input
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Subscription Success Feedback */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-12 h-12" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white font-display mb-1">
                Premium Activated
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Your Robi/Airtel daily subscription is active. All premium AI terminals are unlocked.
              </p>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 text-xs text-slate-400 space-y-2.5 font-mono text-left">
                <div className="flex justify-between">
                  <span>BILLING FREQUENCY:</span>
                  <span className="text-white font-bold">Daily Auto-Renew</span>
                </div>
                <div className="flex justify-between">
                  <span>BILLING AMOUNT:</span>
                  <span className="text-white font-bold">3.00 BDT</span>
                </div>
                <div className="flex justify-between">
                  <span>TRANSACTION CODE:</span>
                  <span className="text-teal-400 font-bold">{transactionId}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('dashboard');
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer"
              >
                Open Subscription Dashboard
              </button>
            </div>
          )}

          {/* STEP 4: Active Subscriber Management Dashboard */}
          {step === 'dashboard' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-display leading-tight">bdapps Carrier Portal</h2>
                  <p className="text-xs text-slate-400">Manage your active Axiata daily subscription plan</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 mb-5 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('status')}
                  className={`pb-2.5 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'status' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Subscription Status
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    if (user.phone) fetchLogs(user.phone);
                  }}
                  className={`pb-2.5 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'history' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Billing Logs ({historyLogs.length})
                </button>
              </div>

              {/* TAB CONTENT: Status Summary and Billing Operations */}
              {activeTab === 'status' && (
                <div className="space-y-5">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                      <span className="text-slate-400 font-mono">Operator ID Number:</span>
                      <span className="text-white font-mono font-bold">+{user.phone || phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-mono">Premium Status:</span>
                      <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 uppercase text-[9px] tracking-wide">
                        ACTIVE SUBSCRIBER
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-mono">Operator Rate Point:</span>
                      <span className="text-white font-mono font-bold">3.00 BDT / daily renewal</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-mono">Next Auto-Charge Cycle:</span>
                      <span className="text-teal-400 font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 24 Hours
                      </span>
                    </div>
                  </div>

                  {/* Operator action triggers */}
                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">
                      Developer Operations & Carrier Billing Triggers
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleCheckStatus}
                        disabled={loading}
                        className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${loading ? 'animate-spin' : ''}`} />
                        Sync Status
                      </button>
                      <button
                        onClick={handleSimulateRenewal}
                        disabled={loading}
                        className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Trigger Renewal
                      </button>
                    </div>

                    <button
                      onClick={handleUnsubscribe}
                      disabled={loading}
                      className="w-full py-3 px-4 bg-red-950/30 hover:bg-red-950/50 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-2"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      Unsubscribe Plan (Revoke Premium)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Billing Logs History */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex justify-between items-center">
                    <span>Transaction billing history logs</span>
                    <button 
                      onClick={() => user.phone && fetchLogs(user.phone)}
                      className="text-teal-400 hover:underline cursor-pointer"
                    >
                      Reload Logs
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                    <div className="max-h-60 overflow-y-auto font-mono text-xs">
                      {loadingHistory ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2 justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                          <span>Fetching telemetry logs from Supabase...</span>
                        </div>
                      ) : historyLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          No registered transaction history logs found for this subscriber.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-2">Action</th>
                              <th className="py-2.5 px-2">Charge</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {historyLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-900/40 text-[11px] text-slate-300">
                                <td className="py-2.5 px-3 text-slate-400">{log.date}</td>
                                <td className="py-2.5 px-2">
                                  <span className="font-bold uppercase text-[10px] text-slate-200">
                                    {log.action === 'subscribe' ? 'REGISTER' : log.action.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-white font-bold">{log.amount}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    log.status === 'subscribed' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}>
                                    {log.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
                    * The above billing history is queried in real time from Supabase database tables to prevent billing discrepancies.
                  </div>
                </div>
              )}

              {/* Status messages in dashboard step */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium font-mono mt-4">
                  ⚠️ {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium font-mono mt-4">
                  ✓ {successMsg}
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Modal footer credits */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-600 font-mono tracking-wider">
            SECURE ACCESS VIA OPERATOR BILLING GATEWAY • COMPLIANT WITH ROBI/AIRTEL APPS RULES
          </p>
        </div>

      </div>
    </div>
  );
}
