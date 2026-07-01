import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Star, Award, Code, Compass, Play, Send, CheckCircle2, 
  Cpu, Loader2, RefreshCw, FileText, ChevronRight, Lock, 
  User, Shield, Bell, Settings as SettingsIcon, LayoutGrid, Heart 
} from 'lucide-react';
import { UserProfile, JobPost, SkillAssessment, AssessmentAttempt, PracticalTask, TaskSubmission, MockInterviewSession } from '../types';
import { useAppStore } from '../store/useAppStore';
import {
  useAssessments,
  useTasks,
  useScanResumeMutation,
  useGenerateCustomQuizMutation,
  useSubmitQuizMutation,
  useGenerateInterviewMutation,
  useEvaluateInterviewMutation,
  useSubmitCodeMutation,
  useGenerateCertificateMutation
} from '../hooks/useQueries';

// Modular Sub-components
import Overview from './candidate/Overview';
import Profile from './candidate/Profile';
import SkillPassport from './candidate/SkillPassport';
import AIReputationScore from './candidate/AIReputationScore';
import AIJobMatching from './candidate/AIJobMatching';
import Certificates from './candidate/Certificates';
import Applications from './candidate/Applications';
import Notifications from './candidate/Notifications';
import Settings from './candidate/Settings';
import AICareerRoadmap from './candidate/AICareerRoadmap';

interface CandidateDashboardProps {
  user: UserProfile;
  onOpenSubscribe: () => void;
}

export default function CandidateDashboard({ user, onOpenSubscribe }: CandidateDashboardProps) {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  
  // Set default tab to overview
  const activeTab = tab || 'overview';

  const setActiveTab = (newTab: string) => {
    navigate(`/candidate/${newTab}`);
  };

  const { syncProfile, setCurrentUser } = useAppStore();

  // Custom data states (applications, notifications, certificates)
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingCustomData, setLoadingCustomData] = useState(false);

  // Fetch applications, notifications, and certificates from backend APIs
  const fetchCandidateCustomData = async () => {
    setLoadingCustomData(true);
    try {
      const [appsRes, notifsRes, certsRes] = await Promise.all([
        fetch(`/api/candidates/${user.id}/applications`),
        fetch(`/api/candidates/${user.id}/notifications`),
        fetch(`/api/candidates/${user.id}/certificates`)
      ]);

      const [appsData, notifsData, certsData] = await Promise.all([
        appsRes.json(),
        notifsRes.json(),
        certsRes.json()
      ]);

      if (appsData.status === 'success') {
        setApplications(appsData.applications || []);
      }
      if (notifsData.status === 'success') {
        setNotifications(notifsData.notifications || []);
      }
      if (certsData.status === 'success') {
        setCertificates(certsData.certificates || []);
      }
    } catch (err) {
      console.error('Failed to load custom candidate data:', err);
    } finally {
      setLoadingCustomData(false);
    }
  };

  useEffect(() => {
    fetchCandidateCustomData();
  }, [user.id]);

  // Handle Mark Alert/Notification as Read
  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/candidates/${user.id}/notifications/${id}/read`, {
        method: 'POST'
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => 
        fetch(`/api/candidates/${user.id}/notifications/${n.id}/read`, { method: 'POST' })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset your mock profile state?')) {
      try {
        const res = await fetch(`/api/auth/update/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Candidate User',
            title: 'Full Stack Engineer',
            bio: 'Passionate and verified career professional.',
            skills: ['React', 'TypeScript', 'Node.js']
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setCurrentUser(data.user);
          alert('State purged. Reloading settings dashboard.');
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // TanStack Queries (original interactive quiz/challenge engines)
  const { data: assessmentsData, isLoading: loadingAssessments, refetch: refetchAssessments } = useAssessments();
  const { data: tasksData, isLoading: loadingTasks, refetch: refetchTasks } = useTasks();

  const assessments = assessmentsData || [];
  const tasks = tasksData || [];

  const [completedAttempts, setCompletedAttempts] = useState<AssessmentAttempt[]>([]);

  // Resume Scanner State
  const [resumeScannerText, setResumeScannerText] = useState(user.bio || '');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);

  // Assessment State
  const [activeQuiz, setActiveQuiz] = useState<SkillAssessment | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<AssessmentAttempt | null>(null);
  
  // Custom Assessment Generator
  const [customSkill, setCustomSkill] = useState('');
  const [customDiff, setCustomDiff] = useState('Intermediate');

  // Mock Interview State
  const [interviewJobTitle, setInterviewJobTitle] = useState('Senior Full Stack React Engineer');
  const [activeInterview, setActiveInterview] = useState<MockInterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewAnswers, setInterviewAnswers] = useState<Record<number, string>>({});

  // Coding Sandbox State
  const [activeTask, setActiveTask] = useState<PracticalTask | null>(null);
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxFeedback, setSandboxFeedback] = useState<any>(null);
  const [submissionType, setSubmissionType] = useState<'code' | 'github' | 'portfolio' | 'pdf'>('code');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [pdfDataUrl, setPdfDataUrl] = useState<string | undefined>(undefined);

  // Load completed attempts from user object
  useEffect(() => {
    if (user.verifiedSkills) {
      const attempts: AssessmentAttempt[] = Object.entries(user.verifiedSkills).map(([skillName, details]) => ({
        id: `mock-attempt-${skillName}`,
        candidateId: user.id,
        assessmentId: `mock-assess-${skillName}`,
        skill: skillName,
        score: details.score,
        passed: details.verified,
        answers: {},
        verifiedDate: details.date
      }));
      setCompletedAttempts(attempts);
    }
  }, [user]);

  // Mutations
  const scanResumeMutation = useScanResumeMutation();
  const scanning = scanResumeMutation.isPending;

  const handleScanResume = async () => {
    if (!resumeScannerText) return;
    setScanResult(null);

    const jobRequirements = selectedJobId === 'job-1' 
      ? ['React 19', 'TypeScript', 'TailwindCSS', '5+ years experience']
      : ['Node.js', 'Express', 'PostgreSQL', 'API Security'];

    scanResumeMutation.mutate({
      resumeText: resumeScannerText,
      jobRequirements
    }, {
      onSuccess: (data) => {
        if (data.status === 'success') {
          setScanResult(data.analysis);
        }
      },
      onError: (e) => {
        console.error('Resume scanning failed', e);
      }
    });
  };

  const generateCustomQuizMutation = useGenerateCustomQuizMutation();
  const generatingQuiz = generateCustomQuizMutation.isPending;

  const handleGenerateCustomQuiz = async () => {
    if (!customSkill) return;
    setActiveQuiz(null);
    setQuizResult(null);

    generateCustomQuizMutation.mutate({
      skill: customSkill,
      difficulty: customDiff
    }, {
      onSuccess: (data) => {
        if (data.status === 'success') {
          setActiveQuiz(data.assessment);
          setQuizAnswers({});
        }
      },
      onError: (e) => {
        console.error(e);
      }
    });
  };

  const submitQuizMutation = useSubmitQuizMutation();
  const submittingQuiz = submitQuizMutation.isPending;
  const generateCertificateMutation = useGenerateCertificateMutation();

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    submitQuizMutation.mutate({
      candidateId: user.id,
      assessmentId: activeQuiz.id,
      answers: quizAnswers
    }, {
      onSuccess: async (data) => {
        if (data.status === 'success') {
          setQuizResult(data.attempt);
          setCompletedAttempts(prev => [...prev, data.attempt]);
          
          // Generate certificate if passed (score >= 70)
          if (data.attempt.score >= 70) {
            generateCertificateMutation.mutate({
              candidateId: user.id,
              skillName: activeQuiz.title || 'Skill Assessment',
              score: data.attempt.score,
              difficultyLevel: 'Intermediate' // Or map from assessment
            });
          }

          // Re-sync with backend profile & custom data
          await syncProfile();
          await fetchCandidateCustomData();
        }
      },
      onError: (e) => {
        console.error(e);
      }
    });
  };

  const generateInterviewMutation = useGenerateInterviewMutation();
  const generatingInterview = generateInterviewMutation.isPending;

  const handleGenerateInterview = async () => {
    setActiveInterview(null);
    setInterviewAnswers({});
    setCurrentAnswer('');

    generateInterviewMutation.mutate({
      candidateId: user.id,
      jobTitle: interviewJobTitle,
      candidateProfile: `Name: ${user.name}, Title: ${user.title}, Skills: ${user.skills.join(', ')}`
    }, {
      onSuccess: (data) => {
        if (data.status === 'success') {
          setActiveInterview(data.session);
        }
      },
      onError: (e) => {
        console.error(e);
      }
    });
  };

  const handleNextInterviewQuestion = () => {
    if (!activeInterview) return;
    const currentIdx = activeInterview.currentQuestionIndex;
    
    // Save current answer
    const updatedAnswers = { ...interviewAnswers, [currentIdx]: currentAnswer };
    setInterviewAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentIdx < activeInterview.questions.length - 1) {
      setActiveInterview({
        ...activeInterview,
        currentQuestionIndex: currentIdx + 1
      });
    } else {
      handleGradeInterview(updatedAnswers);
    }
  };

  const evaluateInterviewMutation = useEvaluateInterviewMutation();
  const gradingInterview = evaluateInterviewMutation.isPending;

  const handleGradeInterview = async (finalAnswers: Record<number, string>) => {
    if (!activeInterview) return;

    evaluateInterviewMutation.mutate({
      id: activeInterview.id,
      answers: finalAnswers
    }, {
      onSuccess: async (data) => {
        if (data.status === 'success') {
          setActiveInterview(data.session);
          await syncProfile();
          await fetchCandidateCustomData();
        }
      },
      onError: (e) => {
        console.error(e);
      }
    });
  };

  const submitCodeMutation = useSubmitCodeMutation();
  const submittingCode = submitCodeMutation.isPending;

  const handleCodeSubmit = async () => {
    if (!activeTask) return;
    if (submissionType === 'code' && !sandboxCode) return;
    if (submissionType === 'github' && !githubUrl) return;
    if (submissionType === 'portfolio' && !portfolioUrl) return;
    if (submissionType === 'pdf' && !pdfDataUrl) return;

    setSandboxFeedback(null);

    submitCodeMutation.mutate({
      taskId: activeTask.id,
      candidateId: user.id,
      code: sandboxCode,
      submissionType,
      githubUrl,
      portfolioUrl,
      pdfDataUrl
    }, {
      onSuccess: async (data) => {
        if (data.status === 'success') {
          setSandboxFeedback(data.submission);
          
          // Generate certificate if passed practical task (score >= 70)
          if (data.submission?.evaluation?.score >= 70) {
            generateCertificateMutation.mutate({
              candidateId: user.id,
              skillName: activeTask.title || 'Practical Task',
              score: data.submission.evaluation.score,
              difficultyLevel: 'Advanced' // Practical tasks are generally Advanced
            });
          }

          await syncProfile();
          await fetchCandidateCustomData();
        }
      },
      onError: (e) => {
        console.error(e);
      }
    });
  };

  return (
    <div id="candidate-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-12">
      
      {/* Sidebar profile & Navigation */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Profile overview card */}
        <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-5 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-slate-950/60 rounded-2xl border border-teal-500/20 flex items-center justify-center mx-auto text-teal-400 mb-3 font-display font-black text-lg shadow-md">
            {user.name.charAt(0)}
          </div>
          <h3 className="font-extrabold text-white text-base font-display">{user.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold leading-relaxed">{user.title || 'Engineering Candidate'}</p>

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-around text-center">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">AI Reputation</div>
              <div className="text-xl font-black text-indigo-400 font-mono mt-0.5">{user.reputationScore}</div>
            </div>
          </div>

          {/* Premium Billing status banner */}
          <div className="mt-5">
            {user.subscribed ? (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1.5 justify-center font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Premium Active
              </div>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center space-y-2">
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
                  <Star className="w-3.5 h-3.5 fill-indigo-400/20" />
                  Premium Unlocked via bdapps
                </div>
                <button
                  onClick={onOpenSubscribe}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Subscribe (3 BDT)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Unified Navigation lists */}
        <div className="space-y-4">
          
          {/* Main sections */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-2 shadow-xl space-y-1">
            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-3 py-1 font-mono">Core Dashboard</p>
            
            {[
              { id: 'overview', label: 'Overview Index', icon: LayoutGrid },
              { id: 'profile', label: 'Professional Profile', icon: User },
              { id: 'passport', label: 'Digital Skill Passport', icon: Shield },
              { id: 'reputation', label: 'Reputation Analysis', icon: Cpu },
              { id: 'matching', label: 'AI Job Matching', icon: Sparkles },
              { id: 'certificates', label: 'Verified Certificates', icon: Award },
              { id: 'applications', label: 'Job Applications', icon: FileText },
              { id: 'notifications', label: 'Activity & Alert Logs', icon: Bell },
              { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Practice suite */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-2 shadow-xl space-y-1">
            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-3 py-1 font-mono">AI Practice Suite</p>
            
            {[
              { id: 'assessments', label: 'Adaptive Career Quiz', icon: Award },
              { id: 'interviews', label: 'AI Mock Interviews', icon: Compass },
              { id: 'sandbox', label: 'Sandbox Coding Arena', icon: Code },
              { id: 'resume', label: 'ATS Resume Optimizer', icon: FileText },
              { id: 'roadmap', label: 'AI Career Roadmap', icon: Sparkles },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'assessments') { setActiveQuiz(null); setQuizResult(null); }
                    if (item.id === 'interviews') { setActiveInterview(null); }
                    if (item.id === 'sandbox') { setActiveTask(null); setSandboxFeedback(null); }
                    if (item.id === 'resume') { setScanResult(null); }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Main Workspace content */}
      <div className="lg:col-span-9">
        
        {/* Core modular views */}
        {activeTab === 'overview' && (
          <Overview 
            user={user}
            applications={applications}
            certificates={certificates}
            notifications={notifications}
            onNavigateTab={setActiveTab}
            onMarkRead={handleMarkRead}
          />
        )}

        {activeTab === 'profile' && (
          <Profile 
            user={user}
            onUpdateSuccess={(updatedUser) => {
              setCurrentUser(updatedUser);
              fetchCandidateCustomData();
            }}
          />
        )}

        {activeTab === 'passport' && (
          <SkillPassport user={user} />
        )}

        {activeTab === 'reputation' && (
          <AIReputationScore user={user} />
        )}

        {activeTab === 'matching' && (
          <AIJobMatching 
            user={user}
            onApplySuccess={() => {
              fetchCandidateCustomData();
            }}
          />
        )}

        {activeTab === 'certificates' && (
          <Certificates 
            user={user}
            certificates={certificates}
          />
        )}

        {activeTab === 'applications' && (
          <Applications 
            user={user}
            applications={applications}
            onApplySuccess={() => {
              fetchCandidateCustomData();
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <Notifications 
            user={user}
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            user={user}
            onOpenSubscribe={onOpenSubscribe}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'roadmap' && (
          <AICareerRoadmap user={user} />
        )}

        {/* ORIGINAL INTERACTIVE ENGINES */}
        
        {/* ASSESSMENTS MODULE */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            
            {/* Generate Custom Quiz with Gemini */}
            <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-teal-500/5 pointer-events-none">
                <Sparkles className="w-24 h-24" />
              </div>
              <h3 className="text-base font-extrabold font-display text-white mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-5 h-5 text-teal-400" />
                Dynamic Gemini Test Generator
              </h3>
              <p className="text-xs text-slate-400 mb-6 max-w-xl">
                Enter any skill keyword. Gemini will dynamically generate a technical multiple choice quiz checking deep core principles, syntax, and operational architecture.
              </p>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Enter Skill / Tech Stack</label>
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="e.g. Next.js, GoLang, Kubernetes"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Difficulty Level</label>
                  <select
                    value={customDiff}
                    onChange={(e) => setCustomDiff(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                {!user.subscribed ? (
                  <button
                    type="button"
                    onClick={onOpenSubscribe}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 px-6 rounded-lg text-xs tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-indigo-300" />
                    Unlock Premium Generator
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateCustomQuiz}
                    disabled={generatingQuiz || !customSkill}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-2.5 px-6 rounded-lg text-xs tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Generate Custom Quiz'}
                  </button>
                )}
              </div>
            </div>

            {/* Quiz view block */}
            {activeQuiz && !quizResult && (
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 rounded px-1.5 py-0.5 font-semibold uppercase">{activeQuiz.difficulty}</span>
                    <h3 className="text-lg font-bold font-display text-white mt-1">{activeQuiz.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">3 Questions</span>
                </div>

                <div className="space-y-6">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <div className="text-sm font-semibold text-slate-200">
                        Q{idx + 1}: {q.question}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => (
                          <label key={optIdx} className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition-colors ${
                            quizAnswers[q.id] === optIdx
                              ? 'bg-teal-500/10 border-teal-500 text-white font-medium'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}>
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                              className="accent-teal-400"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz || Object.keys(quizAnswers).length < activeQuiz.questions.length}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer disabled:opacity-40"
                  >
                    {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Answers'}
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Result Block */}
            {quizResult && (
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
                <div className="flex justify-center">
                  <div className={`p-4 rounded-full border ${
                    quizResult.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <Award className="w-12 h-12" />
                  </div>
                </div>

                <h3 className="text-xl font-bold font-display text-white">
                  {quizResult.passed ? 'Verification Complete!' : 'Assessment Unsuccessful'}
                </h3>
                
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {quizResult.passed 
                    ? `Outstanding! You scored ${quizResult.score}% on the ${quizResult.skill} Assessment. Your verified badge is added to your public credential index and your reputation score increased.`
                    : `You scored ${quizResult.score}% on the ${quizResult.skill} Assessment. You need at least 70% to pass and secure a verified credential badge. Refresh and try again!`
                  }
                </p>

                <div className="text-sm font-bold font-mono text-teal-400">
                  Your Score: {quizResult.score}%
                </div>

                <button
                  onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                  className="bg-slate-850 hover:bg-slate-800 text-white font-semibold py-2 px-6 rounded-lg text-xs cursor-pointer border border-slate-800"
                >
                  Back to Assessments
                </button>
              </div>
            )}

            {/* Ready platform quizes list */}
            {!activeQuiz && !quizResult && (
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Standard Certification Assessments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assessments.map((quiz) => (
                    <div key={quiz.id} className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors">
                      <div>
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 rounded px-1 py-0.5 font-bold uppercase">{quiz.difficulty}</span>
                        <h4 className="font-bold text-white text-sm mt-1.5">{quiz.title}</h4>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Topic: {quiz.skill}</div>
                      </div>
                      <button
                        onClick={() => { setActiveQuiz(quiz); setQuizAnswers({}); }}
                        className="p-2 bg-slate-950/60 hover:bg-slate-900/60 text-teal-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-teal-400/10" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* AI MOCK INTERVIEWS */}
        {activeTab === 'interviews' && (
          <div className="space-y-6">
            {!activeInterview ? (
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-teal-500/5 pointer-events-none">
                  <Compass className="w-24 h-24" />
                </div>
                <h3 className="text-base font-extrabold font-display text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Compass className="w-5 h-5 text-teal-400" />
                  Gemini Panelist Mock Interview Generator
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Construct a dynamic technical and behavioral panel interview matching a target job profile. Input the target position and Gemini will generate a custom sequence of questions to evaluate your readiness.
                </p>

                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Target Job Title</label>
                    <input
                      type="text"
                      value={interviewJobTitle}
                      onChange={(e) => setInterviewJobTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  {!user.subscribed ? (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Carrier Billing Subscription Required</div>
                          <div className="text-[10px] text-slate-400">Unlock the AI Interview Simulator daily for 3 BDT.</div>
                        </div>
                      </div>
                      <button
                        onClick={onOpenSubscribe}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer"
                      >
                        Unlock Now
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateInterview}
                      disabled={generatingInterview}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer disabled:opacity-40"
                    >
                      {generatingInterview ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Begin Live Practice'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                
                {/* Active interview panels */}
                {!activeInterview.completed ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 rounded-full px-2 py-0.5 font-bold uppercase font-mono">Dynamic Panelist Session</span>
                        <h4 className="text-base font-bold text-white font-display mt-1">{activeInterview.jobTitle}</h4>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Question {activeInterview.currentQuestionIndex + 1} of {activeInterview.questions.length}
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl text-xs font-semibold text-teal-400 font-mono italic leading-relaxed">
                      "{activeInterview.questions[activeInterview.currentQuestionIndex]}"
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Articulated Answer</label>
                      <textarea
                        rows={5}
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type or dictate your structured technical reply here..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-4 text-xs text-slate-200 outline-none leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800">
                      <button
                        onClick={handleNextInterviewQuestion}
                        disabled={!currentAnswer.trim() || gradingInterview}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                      >
                        {gradingInterview ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Next Question →'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Completed / Graded interview review screen */
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">Interview Completed</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Mock Evaluation Review</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase font-mono">Evaluated Score</span>
                        <div className="text-lg font-black text-teal-400 font-mono">{activeInterview.evaluation?.overallScore || 0}%</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1.5">AI Interview Feedback</h5>
                        <p className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed font-mono whitespace-pre-line">
                          {activeInterview.evaluation?.feedback || 'Review pending...'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex justify-end">
                        <button
                          onClick={() => setActiveInterview(null)}
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold px-5 py-2 rounded-lg text-white cursor-pointer"
                        >
                          Finish Session
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* SANDBOX CODING ARENA */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            {!activeTask ? (
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Code className="w-5 h-5 text-indigo-400" />
                  Sandbox Practical Challenges
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Solve isolated algorithmic coding tasks. Write code inside the editor. Our AI verification server will run tests and score correctness.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-slate-900/40 border border-slate-800 p-4.5 rounded-xl flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">{task.skill || 'Code'}</span>
                        <h4 className="text-xs font-extrabold text-white">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">{task.description}</p>
                      </div>
                      {!user.subscribed ? (
                        <button
                          onClick={onOpenSubscribe}
                          className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-black transition-all cursor-pointer hover:bg-indigo-600 hover:text-white flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3 text-indigo-400" />
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveTask(task);
                            setSandboxCode(task.starterCode || `function solution() {\n  // Code here\n}`);
                            setSandboxFeedback(null);
                          }}
                          className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-black transition-all cursor-pointer hover:bg-indigo-600 hover:text-white"
                        >
                          Code
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* IDE layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Editor Column */}
                <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                    <div>
                      <button 
                        onClick={() => setActiveTask(null)}
                        className="text-[9px] text-teal-400 hover:text-white font-bold font-mono uppercase tracking-wider cursor-pointer"
                      >
                        ← Back to challenges
                      </button>
                      <h4 className="text-sm font-extrabold text-white mt-1">{activeTask.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-black">{activeTask.skill}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                      onClick={() => setSubmissionType('code')} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${submissionType === 'code' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                    >
                      Code Editor
                    </button>
                    <button 
                      onClick={() => setSubmissionType('github')} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${submissionType === 'github' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                    >
                      GitHub Repo
                    </button>
                    <button 
                      onClick={() => setSubmissionType('portfolio')} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${submissionType === 'portfolio' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                    >
                      Portfolio Link
                    </button>
                    <button 
                      onClick={() => setSubmissionType('pdf')} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${submissionType === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                    >
                      Upload PDF
                    </button>
                  </div>

                  {submissionType === 'code' && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Workspace Editor</label>
                      <textarea
                        rows={14}
                        value={sandboxCode}
                        onChange={(e) => setSandboxCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-emerald-400 font-mono outline-none leading-relaxed"
                      />
                    </div>
                  )}

                  {submissionType === 'github' && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">GitHub Repository URL</label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/your-username/repo-name"
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-emerald-400 outline-none leading-relaxed"
                      />
                    </div>
                  )}

                  {submissionType === 'portfolio' && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Portfolio Link</label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://yourportfolio.com/project"
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-emerald-400 outline-none leading-relaxed"
                      />
                    </div>
                  )}

                  {submissionType === 'pdf' && (
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Upload PDF Submission</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setPdfDataUrl(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setPdfDataUrl(undefined);
                          }
                        }}
                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
                    <button 
                      onClick={() => setActiveTask(null)}
                      className="px-4 py-2 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCodeSubmit}
                      disabled={submittingCode}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {submittingCode ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : submissionType === 'code' ? 'Run Verify Tests' : 'Submit Work'}
                    </button>
                  </div>
                </div>

                {/* Feedback Logs Column */}
                <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide pb-2 border-b border-slate-850">
                    Evaluation & Feedback logs
                  </h4>

                  {sandboxFeedback ? (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-mono">AI EVALUATION OUTCOME</span>
                        <span className={`text-xs font-black font-mono ${sandboxFeedback.score >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {sandboxFeedback.score >= 60 ? 'PASSED / VERIFIED' : 'RETEST REQUIRED'} ({sandboxFeedback.score}%)
                        </span>
                      </div>

                      {/* Score Metrics Matrix */}
                      {sandboxFeedback.evaluation && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Req. Coverage</span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-indigo-400 font-mono">{sandboxFeedback.evaluation.requirementCoverage}%</span>
                              <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-400 h-full" style={{ width: `${sandboxFeedback.evaluation.requirementCoverage}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Problem Solving</span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-cyan-400 font-mono">{sandboxFeedback.evaluation.problemSolving}%</span>
                              <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-cyan-400 h-full" style={{ width: `${sandboxFeedback.evaluation.problemSolving}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Code Quality</span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-emerald-400 font-mono">{sandboxFeedback.evaluation.quality}%</span>
                              <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-emerald-400 h-full" style={{ width: `${sandboxFeedback.evaluation.quality}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Creativity</span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-purple-400 font-mono">{sandboxFeedback.evaluation.creativity}%</span>
                              <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-purple-400 h-full" style={{ width: `${sandboxFeedback.evaluation.creativity}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Accuracy</span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-amber-400 font-mono">{sandboxFeedback.evaluation.accuracy}%</span>
                              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-400 h-full" style={{ width: `${sandboxFeedback.evaluation.accuracy}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compiler/AI Analysis</h5>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-4 border border-slate-850 rounded-xl whitespace-pre-line">
                          {sandboxFeedback.aiReview || sandboxFeedback.feedback}
                        </p>
                      </div>

                      {sandboxFeedback.evaluation && (
                        <div className="space-y-4">
                          {/* Strengths */}
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Core Strengths
                            </h5>
                            <ul className="space-y-1 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 border border-slate-850 rounded-xl">
                              {sandboxFeedback.evaluation.strengths.map((str: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-400" /> Constructive Feedback
                            </h5>
                            <ul className="space-y-1 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 border border-slate-850 rounded-xl">
                              {sandboxFeedback.evaluation.weaknesses.map((weak: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  <span>{weak}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Suggestions */}
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-400" /> Learning Suggestions
                            </h5>
                            <ul className="space-y-1 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 border border-slate-850 rounded-xl">
                              {sandboxFeedback.evaluation.learningSuggestions.map((sug: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-indigo-400 mt-0.5">•</span>
                                  <span>{sug}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => { setActiveTask(null); setSandboxFeedback(null); }}
                        className="w-full text-center py-2.5 bg-slate-900 hover:bg-slate-850 text-xs font-bold border border-slate-800 rounded-xl text-slate-300 transition-all"
                      >
                        Finish Challenge
                      </button>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-slate-500 text-xs italic">
                      Verify your sandbox script solution using the button. Compilation test outputs and correctness score will be reported here.
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        )}

        {/* ATS RESUME OPTIMIZER */}
        {activeTab === 'resume' && (
          <div className="space-y-6">
            <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-5 h-5 text-indigo-400" />
                ATS Profile Resume Scan
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validate your professional pitch or complete resume text against predefined industry job guidelines. Gemini will scan and return matching keywords, missing requirements, and key suggestions.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Role requirements</label>
                    <select 
                      value={selectedJobId}
                      onChange={e => setSelectedJobId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="">-- Choose Job Description --</option>
                      <option value="job-1">Lead Frontend Engineer (React 19, TypeScript)</option>
                      <option value="job-2">Security backend Architect (Node, Express, PostgreSQL)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resume Text Profile Pitch</label>
                  <textarea 
                    rows={6}
                    value={resumeScannerText}
                    onChange={e => setResumeScannerText(e.target.value)}
                    placeholder="Paste your professional profile resume text details here..."
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors resize-none font-mono"
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-850">
                  {scanning ? (
                    <button 
                      type="button"
                      disabled
                      className="bg-slate-800 text-slate-500 font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gemini Scanning...
                    </button>
                  ) : !user.subscribed ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">Carrier daily plan required</span>
                      <button 
                        onClick={onOpenSubscribe}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-indigo-300" /> Unlock
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleScanResume}
                      disabled={!resumeScannerText || !selectedJobId}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-6 rounded-lg text-xs transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Analyze and Score Resume
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Resume scan result */}
            {scanResult && (
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-xl shadow-xl space-y-6 animate-fade-in">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white font-display">Optimization Scanner results</h4>
                    <span className="text-xs text-slate-400">Analysis complete</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">ATS Compatibility Match</div>
                    <div className="text-xl font-bold text-teal-400 font-mono">{scanResult.matchScore}%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-300 uppercase mb-1.5">Tech Recruiter Overview</h5>
                    <p className="text-xs text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-800/60 leading-relaxed font-mono whitespace-pre-line">
                      {scanResult.feedback}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-400 uppercase mb-1.5">Matched Keywords & Strengths</h5>
                      <div className="bg-slate-950 border border-emerald-500/10 p-4 rounded-lg flex flex-wrap gap-1.5">
                        {scanResult.matchedSkills.map((s: string, i: number) => (
                          <span key={i} className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                            ✔ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-indigo-400 uppercase mb-1.5">Missing Requirements</h5>
                      <div className="bg-slate-950 border border-indigo-500/10 p-4 rounded-lg flex flex-wrap gap-1.5">
                        {scanResult.missingSkills.map((s: string, i: number) => (
                          <span key={i} className="text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                            ↳ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-teal-400 uppercase mb-1.5">Recommended Actions</h5>
                    <p className="text-xs text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-800/60 leading-relaxed font-mono">
                      {scanResult.suggestedImprovement}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
