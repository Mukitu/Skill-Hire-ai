import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Shield, Cpu, Award, Globe, Github, 
  CheckCircle2, AlertTriangle, ChevronRight, Briefcase, 
  Sliders, Star, Loader2, Play, Building, MapPin, DollarSign, Bookmark, ArrowUpRight
} from 'lucide-react';
import { UserProfile, JobPost } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface AIJobMatchingProps {
  user: UserProfile;
  onApplySuccess: () => void;
}

interface MatchResult {
  job: JobPost;
  scores: {
    skillMatch: number;
    aiReputation: number;
    certificates: number;
    portfolio: number;
    assessment: number;
    overall: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  alreadyApplied: boolean;
}

export default function AIJobMatching({ user, onApplySuccess }: AIJobMatchingProps) {
  const { setCurrentUser } = useAppStore();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  // Dynamic slider weights (default values)
  const [weights, setWeights] = useState({
    skillMatch: 30,
    aiReputation: 20,
    certificates: 15,
    portfolio: 15,
    assessment: 20
  });

  // Apply workflow state
  const [resumeText, setResumeText] = useState(user.bio || '');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`/api/candidates/${user.id}/matching`);
      const data = await res.json();
      if (data.status === 'success') {
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI job matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user.id, user.reputationScore, user.skills, user.verifiedSkills]);

  // Handle weight change
  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Calculate customized overall score based on custom weights
  const getCustomizedMatches = (): MatchResult[] => {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return matches;

    const customized = matches.map(match => {
      const customOverall = Math.round(
        (match.scores.skillMatch * weights.skillMatch +
         match.scores.aiReputation * weights.aiReputation +
         match.scores.certificates * weights.certificates +
         match.scores.portfolio * weights.portfolio +
         match.scores.assessment * weights.assessment) / totalWeight
      );

      return {
        ...match,
        scores: {
          ...match.scores,
          overall: customOverall
        }
      };
    });

    // Sort descending by new overall score
    return [...customized].sort((a, b) => b.scores.overall - a.scores.overall);
  };

  // Submit Job Application from Matching Portal
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setApplying(true);
    setApplyError(null);
    setApplySuccess(false);

    try {
      const res = await fetch(`/api/candidates/${user.id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedMatch.job.id,
          resumeText
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setApplySuccess(true);
        onApplySuccess();
        
        // Optimistically update applied state in list
        setMatches(prev => prev.map(m => m.job.id === selectedMatch.job.id ? { ...m, alreadyApplied: true } : m));
        
        setTimeout(() => {
          setApplySuccess(false);
          setSelectedMatch(null);
        }, 2500);
      } else {
        setApplyError(data.message || 'Failed to file application.');
      }
    } catch (err) {
      console.error(err);
      setApplyError('Network failure occurred. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Handle Save/Unsave bookmark toggle
  const handleToggleSaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const savedJobsList = user.savedJobs || [];
    const isSaved = savedJobsList.includes(jobId);
    let updatedSavedJobs: string[];

    if (isSaved) {
      updatedSavedJobs = savedJobsList.filter(id => id !== jobId);
    } else {
      updatedSavedJobs = [...savedJobsList, jobId];
    }

    // Optimistically update
    setCurrentUser({
      ...user,
      savedJobs: updatedSavedJobs
    });

    try {
      await fetch(`/api/auth/update/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedJobs: updatedSavedJobs })
      });
    } catch (err) {
      console.error('Failed to toggle saved job:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Computing job matches, matching skills, certificates, and scoring candidates...</p>
      </div>
    );
  }

  const customizedMatches = getCustomizedMatches();
  const topMatch = customizedMatches[0];

  return (
    <div className="space-y-6 animate-fade-in" id="ai-job-matching-portal">
      
      {/* Visual Header */}
      <div className="bg-[#0D1117] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/25 rounded-full text-[10px] font-bold text-teal-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            AI RECOM_MATCHING ENGINE ACTIVE
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Verifiable Multi-Weighted Career Matching</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Our AI continuously aggregates your digital footprints: **Skill Match**, **AI Reputation Score**, verified **Certificates**, linked **Portfolios** (GitHub, Dev links), and theoretical **Assessment Scores**. Use the weight tuners to adjust recommendations in real-time.
          </p>
        </div>

        {/* Top recommendation highlight card */}
        {topMatch && (
          <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl shrink-0 w-full lg:w-72 space-y-3">
            <p className="text-[9px] font-black font-mono text-indigo-400 uppercase tracking-widest">🏆 HIGHEST RANKED MATCH</p>
            <div>
              <h4 className="text-xs font-extrabold text-white leading-tight line-clamp-1">{topMatch.job.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{topMatch.job.companyName}</p>
            </div>
            <div className="flex justify-between items-center bg-[#0D1117] p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] font-mono text-slate-400 uppercase font-black">AI Match</span>
              <span className="text-sm font-black text-teal-400 font-mono">{topMatch.scores.overall}%</span>
            </div>
            <button 
              onClick={() => setSelectedMatch(topMatch)}
              className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Analyze Fit breakdown
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Slider Adjustments */}
        <div className="lg:col-span-4 bg-[#0D1117] border border-slate-800 p-5 rounded-xl space-y-6 shadow-lg">
          <div className="pb-3 border-b border-slate-800/60 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">AI Weight Allocation</h3>
          </div>

          <div className="space-y-5">
            
            {/* 1. Skill Match Weight */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Skill Alignment</span>
                <span className="font-mono text-indigo-400 font-bold">{weights.skillMatch}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.skillMatch}
                onChange={e => handleWeightChange('skillMatch', parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-500">How closely your saved profile & verified skills align with job requirements.</p>
            </div>

            {/* 2. AI Reputation Weight */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">AI Reputation Level</span>
                <span className="font-mono text-teal-400 font-bold">{weights.aiReputation}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.aiReputation}
                onChange={e => handleWeightChange('aiReputation', parseInt(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-500">Your network reputation score based on general system engagement.</p>
            </div>

            {/* 3. Certificates Weight */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Verified Certificates</span>
                <span className="font-mono text-fuchsia-400 font-bold">{weights.certificates}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.certificates}
                onChange={e => handleWeightChange('certificates', parseInt(e.target.value))}
                className="w-full accent-fuchsia-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-500">Bonuses awarded for securing official cryptographic career badges.</p>
            </div>

            {/* 4. Portfolio Weight */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Portfolio Connectivity</span>
                <span className="font-mono text-amber-400 font-bold">{weights.portfolio}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.portfolio}
                onChange={e => handleWeightChange('portfolio', parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-500">Points mapped to GitHub accounts and external active portfolio URLs.</p>
            </div>

            {/* 5. Assessment Weight */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Assessment & Sandbox Scores</span>
                <span className="font-mono text-cyan-400 font-bold">{weights.assessment}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={weights.assessment}
                onChange={e => handleWeightChange('assessment', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-500">Your average correctness metrics across tests and practical sandboxes.</p>
            </div>

            <div className="pt-3 border-t border-slate-900 bg-[#0D1117] flex justify-between items-center">
              <button 
                onClick={() => setWeights({ skillMatch: 30, aiReputation: 20, certificates: 15, portfolio: 15, assessment: 20 })}
                className="text-[9px] font-mono font-bold text-indigo-400 hover:text-white uppercase transition-colors"
              >
                Reset to standard weights
              </button>
            </div>

          </div>
        </div>

        {/* Right column: Recommended list or specific match comparison */}
        <div className="lg:col-span-8 space-y-4">
          
          {selectedMatch ? (
            /* Match comparison detail popup/screen */
            <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-800 flex justify-between items-start gap-4">
                <div>
                  <button 
                    onClick={() => setSelectedMatch(null)}
                    className="text-[10px] text-teal-400 hover:text-white font-bold font-mono tracking-wider uppercase cursor-pointer"
                  >
                    ← Back to matched recommendations
                  </button>
                  <h3 className="font-extrabold text-base text-white mt-2 leading-tight">AI Matching Analyzer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Comparing user specifications against hiring partner matrix</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">Overall Match</span>
                    <span className="text-xl font-mono font-black text-teal-400">{selectedMatch.scores.overall}%</span>
                  </div>
                  <button
                    onClick={(e) => handleToggleSaveJob(selectedMatch.job.id, e)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      (user.savedJobs || []).includes(selectedMatch.job.id)
                        ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-teal-400'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid detail overview of matching parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                
                {/* 1. Skill alignment */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Skills</span>
                  <div className="text-sm font-black font-mono text-indigo-400">{selectedMatch.scores.skillMatch}%</div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${selectedMatch.scores.skillMatch}%` }} />
                  </div>
                </div>

                {/* 2. Reputation */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Reputation</span>
                  <div className="text-sm font-black font-mono text-teal-400">{selectedMatch.scores.aiReputation}%</div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400" style={{ width: `${selectedMatch.scores.aiReputation}%` }} />
                  </div>
                </div>

                {/* 3. Certificates */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Certificates</span>
                  <div className="text-sm font-black font-mono text-fuchsia-400">{selectedMatch.scores.certificates}%</div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-fuchsia-500" style={{ width: `${selectedMatch.scores.certificates}%` }} />
                  </div>
                </div>

                {/* 4. Portfolio */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Portfolio</span>
                  <div className="text-sm font-black font-mono text-amber-400">{selectedMatch.scores.portfolio}%</div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${selectedMatch.scores.portfolio}%` }} />
                  </div>
                </div>

                {/* 5. Assessment */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Assessment</span>
                  <div className="text-sm font-black font-mono text-cyan-400">{selectedMatch.scores.assessment}%</div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${selectedMatch.scores.assessment}%` }} />
                  </div>
                </div>

              </div>

              {/* Skills Deep Dive Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                
                {/* Matched Skills */}
                <div className="bg-[#090D12] border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Matched verified Skills ({selectedMatch.matchedSkills.length})
                  </div>
                  {selectedMatch.matchedSkills.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No direct matching verified skills detected on your profile.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatch.matchedSkills.map(skill => (
                        <span key={skill} className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded font-bold capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missing Skills */}
                <div className="bg-[#090D12] border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Missing Requirements ({selectedMatch.missingSkills.length})
                  </div>
                  {selectedMatch.missingSkills.length === 0 ? (
                    <p className="text-[10px] text-emerald-400 font-semibold italic">Perfect Match! You meet all specified skill qualifications.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatch.missingSkills.map(skill => (
                        <span key={skill} className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded font-bold capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Recommendations/Next Steps */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4.5 space-y-3">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">⚡ AI RECON_PATH RECOMMENDATIONS</h4>
                <div className="space-y-2 text-xs text-slate-300">
                  {selectedMatch.scores.skillMatch < 80 && selectedMatch.missingSkills.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      <p>
                        Secure a matching assessment for <span className="text-white font-bold font-mono">"{selectedMatch.missingSkills[0]}"</span> to increase your skill alignment rating by up to +15%.
                      </p>
                    </div>
                  )}
                  {selectedMatch.scores.portfolio < 100 && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                      <p>
                        Your Portfolio Score is currently at {selectedMatch.scores.portfolio}%. Connect a valid GitHub URL or portfolio URL inside your profile options to instantly secure the full portfolio matching score!
                      </p>
                    </div>
                  )}
                  {selectedMatch.scores.overall >= 75 ? (
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <p className="text-emerald-400 font-semibold">
                        Outstanding match score! You stand in the top tier of candidates. Submit your application instantly to catch the attention of the hiring manager.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                      <p>
                        Work on your profile, verify skills via theoretical quizzes, and build up your reputation index to unlock optimal matching percentages.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Apply Action inside modal */}
              <div className="border-t border-slate-900 pt-5 space-y-4">
                <h4 className="text-xs font-extrabold text-white">Proceed with Instant Job Application</h4>
                {applySuccess ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Application filed successfully through AI Matching Portal!
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-3.5">
                    {applyError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                        {applyError}
                      </div>
                    )}
                    <textarea
                      rows={4}
                      required
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      placeholder="Verify or append your candidate overview pitch to accompany this matching submission..."
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-750 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors resize-none font-mono"
                    />

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setSelectedMatch(null)}
                        className="px-4 py-2 border border-slate-800 bg-slate-950/20 hover:bg-slate-900/40 text-slate-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      
                      {selectedMatch.alreadyApplied ? (
                        <button 
                          type="button"
                          disabled
                          className="px-5 py-2 bg-slate-900 text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-lg border border-slate-800"
                        >
                          Already Applied
                        </button>
                      ) : (
                        <button 
                          type="submit"
                          disabled={applying}
                          className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {applying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-4 h-4 text-slate-950" />
                              Submit with {selectedMatch.scores.overall}% Match Score
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

            </div>
          ) : (
            /* Recommendations grid list */
            <div className="space-y-4">
              <div className="pb-1.5 border-b border-slate-800/60">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  AI Recommended Matches ({customizedMatches.length})
                </h4>
              </div>

              {customizedMatches.length === 0 ? (
                <div className="p-8 bg-[#0D1117] rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs italic">
                  No jobs matches found on the server. Please check back later.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {customizedMatches.map((match) => {
                    const isSaved = (user.savedJobs || []).includes(match.job.id);
                    return (
                      <div 
                        key={match.job.id}
                        onClick={() => setSelectedMatch(match)}
                        className="bg-[#0D1117] border border-slate-850/80 hover:border-slate-800 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer group space-y-4 relative overflow-hidden"
                      >
                        {/* Overall score accent tab in corner */}
                        <div className="absolute top-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 to-indigo-600" style={{ width: `${match.scores.overall}%` }} />

                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase">
                                {match.job.department || 'Engineering'}
                              </span>
                              {match.job.difficultyLevel && (
                                <span className="text-[9px] font-mono font-bold bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded-full uppercase">
                                  {match.job.difficultyLevel}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-sm text-white mt-1.5 group-hover:text-teal-400 transition-colors">{match.job.title}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-semibold mt-1">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Building className="w-3 h-3 text-slate-600" /> {match.job.companyName}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-600" /> {match.job.location || 'Remote'}
                              </span>
                              <span className="flex items-center gap-1 text-teal-400 font-mono">
                                <DollarSign className="w-3 h-3 text-slate-600" /> {match.job.salaryRange || 'Negotiable'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Radial or score circular gauge */}
                            <div className="relative flex items-center justify-center shrink-0">
                              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="#161f30" strokeWidth="10" fill="transparent" />
                                <circle 
                                  cx="50" cy="50" r="40" stroke="#14b8a6" strokeWidth="10" 
                                  strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * match.scores.overall) / 1000} 
                                  fill="transparent" 
                                />
                              </svg>
                              <span className="absolute text-[10px] font-black font-mono text-teal-400">{match.scores.overall}%</span>
                            </div>

                            {/* Bookmark icon toggle */}
                            <button
                              onClick={(e) => handleToggleSaveJob(match.job.id, e)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isSaved 
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                                  : 'bg-slate-950/40 border-slate-900 text-slate-600 hover:text-teal-400 hover:border-teal-500/20'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-400' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Breakdown status pills */}
                        <div className="pt-3.5 border-t border-slate-900 grid grid-cols-5 gap-2 text-center">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Skills</span>
                            <span className="text-[10px] font-bold font-mono text-indigo-400">{match.scores.skillMatch}%</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Reputation</span>
                            <span className="text-[10px] font-bold font-mono text-teal-400">{match.scores.aiReputation}%</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Certs</span>
                            <span className="text-[10px] font-bold font-mono text-fuchsia-400">{match.scores.certificates}%</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Portfolio</span>
                            <span className="text-[10px] font-bold font-mono text-amber-400">{match.scores.portfolio}%</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Assess</span>
                            <span className="text-[10px] font-bold font-mono text-cyan-400">{match.scores.assessment}%</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
