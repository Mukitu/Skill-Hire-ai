import React from 'react';
import { Sparkles, Award, FileText, Send, User, ChevronRight, TrendingUp, Cpu, Bell } from 'lucide-react';
import { UserProfile } from '../../types';

interface OverviewProps {
  user: UserProfile;
  applications: any[];
  certificates: any[];
  notifications: any[];
  onNavigateTab: (tab: string) => void;
  onMarkRead: (id: string) => void;
}

export default function Overview({ user, applications, certificates, notifications, onNavigateTab, onMarkRead }: OverviewProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const passedSkillsCount = Object.keys(user.verifiedSkills || {}).length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#111622] to-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-extrabold text-teal-400 uppercase tracking-wider font-mono">
            <Cpu className="w-3 h-3 text-teal-400 animate-pulse" />
            AI Career Intelligence active
          </div>
          <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight font-display">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">{user.name}</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
            Your AI reputation score is tracking <span className="text-teal-400 font-bold font-mono">above average</span> for {user.title || 'Software Specialists'}. Complete dynamic mock interviews and solve coding challenges to unlock top-tier verified badges and job matches.
          </p>
        </div>
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* AI Reputation */}
        <div 
          onClick={() => onNavigateTab('reputation')}
          className="bg-[#0D1117] border border-slate-800/80 hover:border-indigo-500/30 p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-0.5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">Active</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Reputation Index</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white font-mono">{user.reputationScore}</span>
            <span className="text-[10px] text-slate-400 font-mono">/ 1000</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            View breakdown and logs <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Passport Status */}
        <div 
          onClick={() => onNavigateTab('passport')}
          className="bg-[#0D1117] border border-slate-800/80 hover:border-teal-500/30 p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-0.5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full font-semibold">Verified</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Skill Passport</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white font-mono">{passedSkillsCount}</span>
            <span className="text-[10px] text-slate-400">Skill Badges</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            Open cryptographic passport <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Certificates */}
        <div 
          onClick={() => onNavigateTab('certificates')}
          className="bg-[#0D1117] border border-slate-800/80 hover:border-emerald-500/30 p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-0.5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">Official</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Certifications</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white font-mono">{certificates.length}</span>
            <span className="text-[10px] text-slate-400">Earned</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            View or download plaques <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Job Applications */}
        <div 
          onClick={() => onNavigateTab('applications')}
          className="bg-[#0D1117] border border-slate-800/80 hover:border-cyan-500/30 p-5 rounded-xl transition-all cursor-pointer group hover:-translate-y-0.5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-semibold">Matches</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Job Applications</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white font-mono">{applications.length}</span>
            <span className="text-[10px] text-slate-400">Submitted</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            Check matching scores <ChevronRight className="w-3 h-3" />
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2 bg-[#0D1117] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">Recent Security & Activity Alerts</h3>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-400/10 border border-teal-400/20 text-teal-400 font-bold rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs italic">
              No recent notifications or status reports.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="relative p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between items-start gap-4">
                  {!n.read && (
                    <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  )}
                  <div className="pl-2 space-y-1">
                    <p className="text-xs font-bold text-white leading-relaxed">{n.title}</p>
                    <p className="text-[11px] text-slate-400 leading-normal">{n.message}</p>
                    <p className="text-[9px] text-slate-600 font-mono">{new Date(n.created_at || n.date || Date.now()).toLocaleDateString()} at {new Date(n.created_at || n.date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  {!n.read && (
                    <button 
                      onClick={() => onMarkRead(n.id)}
                      className="text-[10px] font-bold font-mono text-teal-400 hover:text-white bg-teal-400/10 border border-teal-400/20 hover:bg-teal-500 rounded px-2.5 py-1 cursor-pointer transition-colors shrink-0"
                    >
                      Read
                    </button>
                  )}
                </div>
              ))}
              <button 
                onClick={() => onNavigateTab('notifications')}
                className="w-full text-center py-2 border border-slate-800 bg-slate-950/30 hover:bg-slate-900/40 text-xs text-slate-400 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                View All Notifications ({notifications.length})
              </button>
            </div>
          )}
        </div>

        {/* Credentials / Quick Profile Summary card */}
        <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wide pb-2.5 border-b border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Verified Credentials
            </h3>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Account Tier</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-bold ${user.subscribed ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {user.subscribed ? 'SkillHire AI Premium' : 'Free Career Account'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Target Title</p>
                <p className="text-xs font-bold text-white mt-1">{user.title || 'Not specified'}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Assigned Skills</p>
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.skills.map(s => (
                      <span key={s} className="text-[9px] font-mono font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic mt-1">No core skills assigned. Edit profile to add.</p>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigateTab('profile')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center mt-4"
          >
            Edit Profile Details
          </button>
        </div>

      </div>

    </div>
  );
}
