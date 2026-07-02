import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ShieldCheck, CreditCard, ArrowRight, Loader2, CheckCircle2, AlertCircle, Phone, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { currentUser, syncProfile } = useAppStore();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referenceNo, setReferenceNo] = useState('');

  // If already subscribed, move to dashboard
  useEffect(() => {
    if (currentUser?.subscribed) {
      navigate('/candidate/assessments');
    }
  }, [currentUser, navigate]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bdapps/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.status === 'success' || data.statusCode === 'S1000') {
        setReferenceNo(data.referenceNo || '');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP. Please check your number.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bdapps/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          otp, 
          referenceNo,
          userId: currentUser?.id 
        }),
      });
      const data = await res.json();

      if (data.status === 'success' || data.statusCode === 'S1000') {
        setSuccess(true);
        // Sync profile to update subscription status in store
        await syncProfile();
        setTimeout(() => {
          navigate('/candidate/assessments');
        }, 2000);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-teal-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-8 h-8 text-slate-950" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2 font-display">Premium Access</h2>
          <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
            Activate your Robi/Airtel daily subscription (3 BDT + VAT/day) to unlock full access to SkillHire AI terminals.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white">Subscription Active!</h3>
              <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
              <div className="flex justify-center pt-4">
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
              </div>
            </div>
          ) : step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Mobile Number (Robi/Airtel)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 font-mono text-sm group-focus-within:text-teal-400 transition-colors">
                    +880
                  </div>
                  <input
                    type="tel"
                    placeholder="1XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-16 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-600 italic">Example: 018XXXXXXXX or 1XXXXXXXXX</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Request Activation OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  placeholder="XXXXXX"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 text-center">Sent to +880 {phone}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Activate
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                Change Phone Number
              </button>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-slate-800/50 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mt-0.5 shrink-0">
                <CreditCard className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider">Carrier Billing</span>
                Charges will be deducted automatically from your Robi or Airtel mobile balance at 3 BDT (+ Taxes)/day.
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 mt-0.5 shrink-0">
                <Sparkles className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider">Instant Access</span>
                Unlock AI Interviewer, Verified Badges, Career Passport, and premium job boards instantly after activation.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-center text-[10px] text-slate-600 font-medium">
        Powered by <span className="text-red-500/60 font-bold uppercase tracking-tighter">bdapps</span> official gateway.
      </p>
    </div>
  );
}
