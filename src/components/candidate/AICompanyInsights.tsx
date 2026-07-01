import React, { useState } from 'react';
import { Sparkles, FileText, ShieldAlert, CheckCircle, TrendingUp, HelpCircle, Loader2, Award, Zap } from 'lucide-react';
import { useAICompanyInsightsMutation } from '../../hooks/useAI';

export default function AICompanyInsights() {
  const insightsMutation = useAICompanyInsightsMutation();
  const [title, setTitle] = useState('Senior Node.js backend developer');
  const [description, setDescription] = useState('We are looking for a backend developer to join our growing development team. Responsibilities include managing databases, writing clean JavaScript, and deploying API routes.');
  const [category, setCategory] = useState('Backend Development');
  const [requirementsInput, setRequirementsInput] = useState('3+ years of experience, NodeJS knowledge, Git familiarity');
  const [generatedInsights, setGeneratedInsights] = useState<any | null>(null);

  const handleAnalyze = () => {
    const requirements = requirementsInput.split(',').map((r) => r.trim()).filter(Boolean);
    insightsMutation.mutate(
      {
        title,
        description,
        requirements,
        category
      },
      {
        onSuccess: (data) => {
          if (data.status === 'success') {
            setGeneratedInsights(data.insights);
          }
        }
      }
    );
  };

  const categories = [
    'Frontend Development',
    'Backend Development',
    'Fullstack Engineering',
    'DevOps & Infrastructure',
    'AI / Machine Learning',
    'Database Engineering'
  ];

  return (
    <div className="space-y-6" id="ai-company-insights-root">
      <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
            <Zap className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wide flex items-center gap-1.5">
              AI Job Posting Optimizer
              <span className="text-[10px] font-mono font-medium bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full uppercase">Groq Intelligence</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze your requirements sheet, rate posting market-competitiveness, and generate customized screening assessments to hook premium technical candidates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Back-End Engineer"
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Qualifications list (comma-separated)</label>
                <textarea
                  rows={2}
                  value={requirementsInput}
                  onChange={(e) => setRequirementsInput(e.target.value)}
                  placeholder="3+ years of experience, NodeJS knowledge, Git familiarity"
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition-colors resize-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Brief Description / pitch</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={insightsMutation.isPending || !title || !description}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-850 disabled:text-slate-500 cursor-pointer"
              >
                {insightsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Job Post...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Optimize Job Posting
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Block */}
          <div className="lg:col-span-2">
            {insightsMutation.isPending ? (
              <div className="bg-slate-950 border border-slate-855 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/10 border-t-teal-400 animate-spin" />
                  <Sparkles className="w-5 h-5 text-teal-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Running Corporate Insights scan</p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Groq is auditing qualification metrics, scanning keyword density, and drafting optimal screening assessments.
                  </p>
                </div>
              </div>
            ) : generatedInsights ? (
              <div className="space-y-6">
                {/* Health & Competitiveness Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">Job Health Score</span>
                      <h4 className="text-xl font-black text-teal-400 font-mono mt-0.5">{generatedInsights.healthIndex}%</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-slate-900 flex items-center justify-center font-bold font-mono text-xs text-teal-300 bg-teal-500/5">
                      ★
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">Market Standing</span>
                      <h4 className="text-xs font-bold text-white mt-1 uppercase tracking-wide bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                        {generatedInsights.marketCompetitiveness} Competitiveness
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Requirements optimizations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-bold text-amber-400 flex items-center gap-1 tracking-wider font-mono">
                      <ShieldAlert className="w-3.5 h-3.5" /> Detected Gaps / Shortcomings
                    </span>
                    <ul className="space-y-1 text-xs text-slate-400 font-mono">
                      {generatedInsights.shortcomings.map((short: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{short}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-bold text-teal-400 flex items-center gap-1 tracking-wider font-mono">
                      <CheckCircle className="w-3.5 h-3.5" /> Optimal Keywords to Add
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 font-mono">
                      {generatedInsights.improvedRequirements.map((req: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-400 mt-0.5">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested practical assessment */}
                <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl space-y-2">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1.5 tracking-wider font-mono">
                    <Award className="w-4 h-4 text-indigo-400" /> Suggested Sandbox Assessment Challenge
                  </span>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {generatedInsights.suggestedAssessmentTask}
                    </p>
                  </div>
                </div>

                {/* Attraction advice */}
                <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl space-y-2">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1 tracking-wider font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Candidate Attraction Strategy
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    "{generatedInsights.adviceForAttraction}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-855 rounded-xl p-16 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-3">
                <FileText className="w-8 h-8 text-slate-700" />
                <p>Post or draft a job profile and obtain complete automated Groq insights to scale recruiting quality.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
