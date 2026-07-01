import React, { useState } from 'react';
import { Sparkles, Compass, Calendar, CheckCircle, Target, BookOpen, MessageSquare, Loader2, Award, ChevronRight } from 'lucide-react';
import { UserProfile } from '../../types';
import { useAICareerRoadmapMutation } from '../../hooks/useAI';

interface AICareerRoadmapProps {
  user: UserProfile;
}

export default function AICareerRoadmap({ user }: AICareerRoadmapProps) {
  const [targetCareer, setTargetCareer] = useState('Senior Full Stack Architect');
  const roadmapMutation = useAICareerRoadmapMutation();
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any | null>(null);

  const handleGenerate = () => {
    roadmapMutation.mutate(
      {
        skills: user.skills || [],
        targetCareer
      },
      {
        onSuccess: (data) => {
          if (data.status === 'success') {
            setGeneratedRoadmap(data.roadmap);
          }
        }
      }
    );
  };

  const suggestions = [
    'Senior Full Stack Architect',
    'AI / Machine Learning Engineer',
    'DevOps & Kubernetes Specialist',
    'Solidity Web3 Developer',
    'Security DevSecOps Engineer'
  ];

  return (
    <div className="space-y-6" id="ai-career-roadmap-root">
      <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Compass className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wide flex items-center gap-1.5">
              AI Career Roadmap Intelligence
              <span className="text-[10px] font-mono font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase">Groq Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze your current verified skills and construct a comprehensive learning and accreditation roadmap to reach your dream technical position.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Present Skills</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill) => (
                      <span key={skill} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No skills listed. Go to profile to add.</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Career Destination</label>
                <input
                  type="text"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  placeholder="e.g. Lead DevOps Engineer"
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Popular Goal Targets</span>
                <div className="flex flex-col gap-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTargetCareer(s)}
                      className={`text-left text-[10px] px-2.5 py-1.5 rounded transition-colors font-mono ${
                        targetCareer === s
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border border-transparent'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={roadmapMutation.isPending || !targetCareer}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-850 disabled:text-slate-500 cursor-pointer"
              >
                {roadmapMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Career Path...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Roadmap
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Content */}
          <div className="md:col-span-2">
            {roadmapMutation.isPending ? (
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500/10 border-t-indigo-400 animate-spin" />
                  <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Formulating Custom Roadmap</p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Groq is analyzing current credentials, cross-referencing industry skill lattices, and plotting learning milestones.
                  </p>
                </div>
              </div>
            ) : generatedRoadmap ? (
              <div className="space-y-6">
                {/* Header overview */}
                <div className="bg-gradient-to-r from-indigo-950/40 via-indigo-950/10 to-transparent border border-indigo-500/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] uppercase text-indigo-400 font-bold font-mono tracking-widest">Recommended Career Path</span>
                    <h4 className="text-sm font-extrabold text-white mt-0.5">{generatedRoadmap.targetCareer}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] text-slate-300 font-mono font-bold">Timeframe: {generatedRoadmap.estimatedTimeframe}</span>
                  </div>
                </div>

                {/* Progressive Timeline Phases */}
                <div className="relative pl-4 border-l border-slate-800 space-y-6 ml-2">
                  {generatedRoadmap.phases.map((phase: any, index: number) => (
                    <div key={index} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center font-mono text-[9px] font-bold text-indigo-400">
                        {index + 1}
                      </span>

                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 hover:border-slate-800 transition-all space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="text-xs font-extrabold text-white tracking-wide">{phase.phaseName}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">{phase.objective}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900">
                          {/* Skills & Quizzes */}
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Skills to Acquire</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {phase.skillsToAcquire.map((sk: string) => (
                                  <span key={sk} className="text-[9px] bg-indigo-950/40 text-indigo-300 border border-indigo-950 px-1.5 py-0.5 rounded font-mono">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {phase.suggestedQuizzes && phase.suggestedQuizzes.length > 0 && (
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Recommended Quizzes</span>
                                <div className="space-y-0.5 mt-1">
                                  {phase.suggestedQuizzes.map((quiz: string) => (
                                    <div key={quiz} className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <span className="truncate">{quiz}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Milestone Project */}
                          <div className="bg-slate-900/60 border border-slate-900 p-2.5 rounded-lg space-y-1">
                            <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1 tracking-wider">
                              <Target className="w-3 h-3 text-emerald-400" /> Phase Project Milestone
                            </span>
                            <p className="text-[11px] text-slate-300 leading-relaxed italic">
                              "{phase.projectMilestone}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Professional advice */}
                {generatedRoadmap.counselorAdvice && (
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider font-mono">Hiring Specialist Career Tip</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        {generatedRoadmap.counselorAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-16 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-3">
                <Compass className="w-8 h-8 text-slate-700" />
                <p>Provide a target technical goal and generate your personalized learning & development roadmap.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
