import React, { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle2, Cpu, TrendingUp, HelpCircle, Code, Globe, Github, Activity, Loader2, FileText, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';

interface AIReputationScoreProps {
  user: UserProfile;
}

interface ReputationBreakdown {
  reputationScore: number;
  baseScore: number;
  assessmentScore: number;
  certificatesScore: number;
  projectsScore: number;
  portfolioScore: number;
  applicationsScore: number;
  activityScore: number;
  verifiedCount: number;
  avgQuizScore: number;
  certCount: number;
  submissionCount: number;
  avgProjScore: number;
  githubConnected: boolean;
  portfolioConnected: boolean;
  appCount: number;
  activityCount: number;
}

export default function AIReputationScore({ user }: AIReputationScoreProps) {
  const [breakdown, setBreakdown] = useState<ReputationBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReputationBreakdown = async () => {
    try {
      const res = await fetch(`/api/candidates/${user.id}/reputation`);
      const data = await res.json();
      if (data.status === 'success') {
        setBreakdown(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reputation breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReputationBreakdown();
  }, [user.id, user.reputationScore, user.githubUrl, user.portfolioUrl]);

  if (loading) {
    return (
      <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Analyzing career activities and calculating reputation weights...</p>
      </div>
    );
  }

  const data = breakdown || {
    reputationScore: user.reputationScore || 500,
    baseScore: 300,
    assessmentScore: 0,
    certificatesScore: 0,
    projectsScore: 0,
    portfolioScore: 0,
    applicationsScore: 0,
    activityScore: 0,
    verifiedCount: 0,
    avgQuizScore: 0,
    certCount: 0,
    submissionCount: 0,
    avgProjScore: 0,
    githubConnected: !!user.githubUrl,
    portfolioConnected: !!user.portfolioUrl,
    appCount: 0,
    activityCount: 0
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Header Dial */}
      <div className="bg-[#0D1117] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Radial Dial */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              stroke="#1e293b" 
              strokeWidth="8" 
              fill="transparent" 
            />
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              stroke="url(#neonGradient)" 
              strokeWidth="8" 
              strokeDasharray="251.2" 
              strokeDashoffset={251.2 - (251.2 * data.reputationScore) / 1000} 
              strokeLinecap="round"
              fill="transparent" 
            />
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute text-center space-y-0.5">
            <span className="text-3xl font-black text-white font-mono tracking-tight">{data.reputationScore}</span>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CAREER INDEX</p>
          </div>
        </div>

        {/* Dial Explainer */}
        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 font-mono">
            <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            LIVE VERIFIABLE CREDENTIAL METRIC
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">AI Reputation Score Analysis</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            The AI Reputation Score is an aggregated career score dynamically calculated from theoretical assessments, verified certifications, practical sandbox submissions, portfolio profiles, and application activities. Maintain a high score to stand out to employers.
          </p>
        </div>
      </div>

      {/* Credit Allocation Weights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Score Weights Breakdown */}
        <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Score Contribution Breakdown
          </h3>

          <div className="space-y-4">
            
            {/* 1. Base Score */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Base Account Creation Credentials</span>
                <span className="font-mono text-slate-400">+{data.baseScore} / 300 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600" style={{ width: `${(data.baseScore / 300) * 100}%` }} />
              </div>
            </div>

            {/* 2. Assessments */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Theoretical Assessments</span>
                  <span className="text-[10px] text-slate-500 font-normal">({data.verifiedCount} badged, avg {data.avgQuizScore}%)</span>
                </div>
                <span className="font-mono text-teal-400">+{data.assessmentScore} / 180 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400" style={{ width: `${(data.assessmentScore / 180) * 100}%` }} />
              </div>
            </div>

            {/* 3. Certificates */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Verified Certificates</span>
                  <span className="text-[10px] text-slate-500 font-normal">({data.certCount} active)</span>
                </div>
                <span className="font-mono text-indigo-400">+{data.certificatesScore} / 120 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(data.certificatesScore / 120) * 100}%` }} />
              </div>
            </div>

            {/* 4. Projects */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Projects & Challenge Submissions</span>
                  <span className="text-[10px] text-slate-500 font-normal">({data.submissionCount} submitted)</span>
                </div>
                <span className="font-mono text-cyan-400">+{data.projectsScore} / 200 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${(data.projectsScore / 200) * 100}%` }} />
              </div>
            </div>

            {/* 5. Portfolio */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Portfolio & Profile Integration</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({data.githubConnected ? 'GitHub ✅' : 'GitHub ❌'}, {data.portfolioConnected ? 'Portfolio ✅' : 'Portfolio ❌'})
                  </span>
                </div>
                <span className="font-mono text-fuchsia-400">+{data.portfolioScore} / 100 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-fuchsia-500" style={{ width: `${(data.portfolioScore / 100) * 100}%` }} />
              </div>
            </div>

            {/* 6. Applications */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Job Applications Engagement</span>
                  <span className="text-[10px] text-slate-500 font-normal">({data.appCount} applied)</span>
                </div>
                <span className="font-mono text-emerald-400">+{data.applicationsScore} / 50 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(data.applicationsScore / 50) * 100}%` }} />
              </div>
            </div>

            {/* 7. Activity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Interactive Activity Index</span>
                  <span className="text-[10px] text-slate-500 font-normal">({data.activityCount} recorded logs)</span>
                </div>
                <span className="font-mono text-pink-400">+{data.activityScore} / 50 pts</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500" style={{ width: `${(data.activityScore / 50) * 100}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Reputation Suggestions & Action Points */}
        <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <Award className="w-4 h-4 text-indigo-400" />
            AI Reputation Checklist
          </h3>

          <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
            
            {/* Base score */}
            <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Basic Account Credentials Setup (+300)</p>
                <p className="text-[10px] text-slate-500">Your profile is safely stored on SkillHire AI database.</p>
              </div>
            </div>

            {/* GitHub connect */}
            <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40">
              {data.githubConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 bg-amber-500/10 border border-amber-500/20 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-amber-400 text-[8px] font-black font-mono">!</div>
              )}
              <div>
                <p className="text-xs font-bold text-white">
                  {data.githubConnected ? 'GitHub Profile Configured (+50)' : 'Configure your GitHub link (+50)'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {data.githubConnected ? 'Your profile has GitHub sync active.' : 'Navigate to Professional Profile and save your GitHub URL.'}
                </p>
              </div>
            </div>

            {/* Portfolio connect */}
            <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40">
              {data.portfolioConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 bg-amber-500/10 border border-amber-500/20 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-amber-400 text-[8px] font-black font-mono">!</div>
              )}
              <div>
                <p className="text-xs font-bold text-white">
                  {data.portfolioConnected ? 'Portfolio URL Configured (+50)' : 'Configure your Portfolio URL (+50)'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {data.portfolioConnected ? 'Your professional portfolio URL has been successfully indexed.' : 'Navigate to Professional Profile and save your portfolio URL.'}
                </p>
              </div>
            </div>

            {/* Assessments */}
            <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40">
              {data.verifiedCount > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-indigo-400 text-[8px] font-black font-mono">!</div>
              )}
              <div>
                <p className="text-xs font-bold text-white">
                  Theoretical Assessments ({data.verifiedCount} completed)
                </p>
                <p className="text-[10px] text-slate-500">
                  Complete adaptive skill tests to verify skills and secure skill badging.
                </p>
              </div>
            </div>

            {/* Code submissions */}
            <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40">
              {data.submissionCount > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-indigo-400 text-[8px] font-black font-mono">!</div>
              )}
              <div>
                <p className="text-xs font-bold text-white">
                  Practical Sandboxes ({data.submissionCount} submitted)
                </p>
                <p className="text-[10px] text-slate-500">
                  Solve coding challenges inside the isolated AI sandbox environments.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
