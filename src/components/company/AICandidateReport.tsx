import React, { useState } from 'react';
import { UserProfile, CompanyReport } from '../../types';
import { useAICompanyReportMutation, useAIAuthenticityDetectionMutation } from '../../hooks/useAI';
import { FileText, Shield, Loader2, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

export function AICandidateReport({ candidate }: { candidate: UserProfile }) {
  const reportMutation = useAICompanyReportMutation();
  const authMutation = useAIAuthenticityDetectionMutation();

  const [report, setReport] = useState<CompanyReport | null>(null);
  const [authData, setAuthData] = useState<any>(null);

  const generateReport = () => {
    reportMutation.mutate({
      candidateData: candidate,
      assessmentData: { mockAssessment: true, skill: 'General Technical' },
      submissionData: { completedTasks: 2 }
    }, {
      onSuccess: (data) => setReport(data.data)
    });
  };

  const checkAuthenticity = () => {
    authMutation.mutate({
      submissionContent: 'Candidate submitted code portfolio for analysis.',
      previousSubmissionsContent: []
    }, {
      onSuccess: (data) => setAuthData(data.data)
    });
  };

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-slate-800">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        AI Evaluator Reports
      </h4>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Company Report Section */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-bold text-white">Comprehensive Company Report</span>
            </div>
            {!report && (
              <button
                onClick={generateReport}
                disabled={reportMutation.isPending}
                className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {reportMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Generate Report
              </button>
            )}
          </div>
          
          {report && (
            <div className="space-y-4 text-xs animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase font-mono mb-1">Skill Score</div>
                  <div className="text-lg font-black text-white">{report.skillScore}%</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase font-mono mb-1">Quality</div>
                  <div className="text-lg font-black text-indigo-400">{report.qualityScore}%</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase font-mono mb-1">Authenticity</div>
                  <div className="text-lg font-black text-emerald-400">{report.authenticityScore}%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Strengths</h5>
                  <ul className="space-y-1 text-emerald-300/90 text-xs">
                    {report.strengths?.map((s, i) => <li key={i} className="flex gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5"/> <span>{s}</span></li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Weaknesses</h5>
                  <ul className="space-y-1 text-red-300/90 text-xs">
                    {report.weaknesses?.map((w, i) => <li key={i} className="flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5"/> <span>{w}</span></li>)}
                  </ul>
                </div>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-indigo-200">
                <strong className="text-[10px] uppercase tracking-wider block mb-1 text-indigo-400">Hiring Recommendation</strong>
                {report.hiringRecommendation}
              </div>
            </div>
          )}
        </div>

        {/* Authenticity Detection Section */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">AI Authenticity Detection (Advisory)</span>
            </div>
            {!authData && (
              <button
                onClick={checkAuthenticity}
                disabled={authMutation.isPending}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {authMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Run Detection
              </button>
            )}
          </div>
          
          {authData && (
            <div className="space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Confidence Score</span>
                  <span className="text-xl font-black text-emerald-400">{authData.authenticityScore}/100</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Likely AI Generated?</span>
                  <span className={`text-sm font-bold ${authData.isLikelyAI ? 'text-red-400' : 'text-emerald-400'}`}>
                    {authData.isLikelyAI ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Duplicate Found?</span>
                  <span className={`text-sm font-bold ${authData.duplicateDetected ? 'text-red-400' : 'text-slate-300'}`}>
                    {authData.duplicateDetected ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-slate-300">
                <strong className="text-[10px] uppercase tracking-wider block mb-1 text-slate-500">Reasoning Engine</strong>
                {authData.reasoning}
              </div>
              <p className="text-[9px] text-slate-500 italic mt-2">
                * Note: This score is advisory only and should not automatically reject candidates. It uses behavioral markers to estimate authenticity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
