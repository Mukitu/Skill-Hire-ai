import React, { useState } from 'react';
import { Shield, Eye, HelpCircle, Star, Phone, Activity, Bell, Trash2, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface SettingsProps {
  user: UserProfile;
  onOpenSubscribe: () => void;
  onResetData: () => void;
}

export default function Settings({ user, onOpenSubscribe, onResetData }: SettingsProps) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(user.subscribed);
  const [discoveryStatus, setDiscoveryStatus] = useState('Actively Looking');
  const [success, setSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-lg font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Candidate Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure security, manage carrier subscriptions, and toggle career discovery visibility options.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Your account configurations and toggles have been updated successfully.
          </div>
        )}

        {/* Subscription block */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/10" />
            Carrier Billing & Premium Tier
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Your career candidate account is currently running on the <span className="text-teal-400 font-bold">{user.subscribed ? 'Premium Tier' : 'Standard Free Tier'}</span>. Unlocked features include unlimited ATS resumes scanning, expert quizzes, and priority mock interviews.
          </p>

          <div className="pt-2">
            {user.subscribed ? (
              <div className="inline-flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Subscription Active (Airtel/Robi 3 BDT/day)
                </span>
                {user.phone && (
                  <span className="text-xs text-slate-500 font-mono">
                    Linked carrier MSISDN: {user.phone}
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500">Subscribe now to activate all tools immediately.</p>
                <button 
                  type="button"
                  onClick={onOpenSubscribe}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                >
                  Subscribe for 3 BDT/day
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Career Discovery Visibility</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {['Actively Looking', 'Open to Offers', 'Not Available'].map(opt => {
              const selected = discoveryStatus === opt;
              return (
                <div 
                  key={opt}
                  onClick={() => setDiscoveryStatus(opt)}
                  className={`p-3 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                    selected 
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' 
                      : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-800/60 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" />
            Alert Channels
          </h3>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-850">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">Email Career Reports</p>
              <p className="text-[10px] text-slate-500">Receive weekly digests on matching scores and job openings.</p>
            </div>
            <input 
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
              className="accent-teal-400 h-4 w-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-850">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">SMS OTP & Security Alerts</p>
              <p className="text-[10px] text-slate-500">Verify authorization checks and billing transactions via mobile SMS.</p>
            </div>
            <input 
              type="checkbox"
              checked={smsAlerts}
              onChange={e => setSmsAlerts(e.target.checked)}
              className="accent-teal-400 h-4 w-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Diagnostics Info */}
        <div className="pt-4 border-t border-slate-800/60 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">System Information Diagnostics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-850 text-left font-mono text-[9px] text-slate-500 leading-normal">
            <div>
              <p className="font-bold text-slate-400">USER ID</p>
              <p className="mt-0.5 text-slate-300 truncate" title={user.id}>{user.id}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">DB STATUS</p>
              <p className="mt-0.5 text-slate-300">{isSupabaseConfigured ? 'Supabase SQL Server' : 'Local File JSON Engine'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">ENGINE</p>
              <p className="mt-0.5 text-slate-300">VITE-TS-STABLE</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">AUTH PROVIDER</p>
              <p className="mt-0.5 text-slate-300">SECURE LOCAL/GOOGLE</p>
            </div>
          </div>
        </div>

        {/* Reset / Destructive */}
        <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">Diagnostic Flush</p>
            <p className="text-[10px] text-slate-500">Restore factory settings and purge mock logs.</p>
          </div>
          <button 
            type="button"
            onClick={onResetData}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Account Data
          </button>
        </div>

      </form>

    </div>
  );
}
