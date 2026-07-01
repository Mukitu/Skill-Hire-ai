import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Briefcase, Plus, Search, Code, Cpu, Sparkles, User, BadgeAlert, 
  CheckCircle, ArrowUpRight, Loader2, Award, Calendar, Settings, 
  BarChart2, Shield, Users, Mail, DollarSign, MapPin, Trash2, 
  Edit3, X, Eye, FileText, Check, ChevronDown, CheckCircle2, TrendingUp,
  FileSpreadsheet, ClipboardList, RefreshCw, MessageSquare, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AICompanyInsights from './candidate/AICompanyInsights';
import { AICandidateReport } from './company/AICandidateReport';
import { UserProfile, JobPost, PracticalTask, MockInterviewSession } from '../types';
import { 
  useJobs, 
  useCreateJobMutation, 
  useGenerateTaskMutation, 
  useGenerateJobTaskMutation, 
  useCreateTaskMutation,
  useRankCandidatesMutation,
  useShortlistCandidatesMutation,
  useGenerateInterviewMutation,
  useScheduleInterviewMutation,
  useSubmitInterviewSummaryMutation,
  useInterviewsQuery
} from '../hooks/useQueries';

// Zod Validation Schema for Job Posting
const jobPostSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters long"),
  department: z.string().min(2, "Department is required"),
  location: z.string().min(2, "Location is required"),
  salaryRange: z.string().min(2, "Salary scale is required"),
  skillsRequired: z.string().min(2, "At least one required skill is required"),
  requirements: z.string().min(2, "At least one qualification is required"),
  description: z.string().min(10, "Job description must be at least 10 characters long"),
});

type JobPostFormData = z.infer<typeof jobPostSchema>;

interface CompanyDashboardProps {
  user: UserProfile;
}

export default function CompanyDashboard({ user }: CompanyDashboardProps) {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const activeTab = tab || 'dashboard';

  const setActiveTab = (newTab: string) => {
    navigate(`/company/${newTab}`);
  };

  // State Management
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<MockInterviewSession[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  // Modals & Details State
  const [selectedCandidate, setSelectedCandidate] = useState<UserProfile | null>(null);
  const [inspectingApp, setInspectingApp] = useState<any | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<MockInterviewSession | null>(null);
  
  // Job Inline Edit & Confirmation State
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [updatingStatusAppId, setUpdatingStatusAppId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('Shortlisted');
  const [statusFeedback, setStatusFeedback] = useState('');

  // Settings state
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [companyNameVal, setCompanyNameVal] = useState(user.companyName || 'Dynamic Startup');
  const [bioVal, setBioVal] = useState(user.bio || 'Building future-proof AI software products.');
  const [titleVal, setTitleVal] = useState(user.title || 'Hiring Manager');

  // Task Creator Tab State
  const [taskSkills, setTaskSkills] = useState('TypeScript, React');
  const [generatedTask, setGeneratedTask] = useState<PracticalTask | null>(null);

  // Job Listing Creation Messages
  const [jobFormMsg, setJobFormMsg] = useState('');

  // AI Task Generation Modal State
  const [isJobTaskModalOpen, setIsJobTaskModalOpen] = useState(false);
  const [generatedJobTask, setGeneratedJobTask] = useState<Partial<PracticalTask> | null>(null);
  const [generatingJobTask, setGeneratingJobTask] = useState(false);
  const [associatedJobId, setAssociatedJobId] = useState<string | null>(null);

  // TanStack Queries & Mutations
  const { data: jobsData, isLoading: loadingJobs, refetch: refetchJobs } = useJobs();
  const jobs = jobsData || [];

  const createJobMutation = useCreateJobMutation();
  const generateTaskMutation = useGenerateTaskMutation();
  const generateJobTaskMutation = useGenerateJobTaskMutation();
  const createTaskMutation = useCreateTaskMutation();

  const rankCandidatesMutation = useRankCandidatesMutation();
  const shortlistCandidatesMutation = useShortlistCandidatesMutation();
  const generateInterviewMutation = useGenerateInterviewMutation();
  const scheduleInterviewMutation = useScheduleInterviewMutation();
  const submitInterviewSummaryMutation = useSubmitInterviewSummaryMutation();

  const [hiringEngineJobId, setHiringEngineJobId] = useState<string>('');
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<UserProfile | null>(null);
  const [interviewDifficulty, setInterviewDifficulty] = useState('Intermediate');
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [interviewScheduling, setInterviewScheduling] = useState(false);
  const [meetingType, setMeetingType] = useState('zoom');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const { data: realInterviews } = useInterviewsQuery('company', user.id);

  const submittingJob = createJobMutation.isPending;
  const generatingTask = generateTaskMutation.isPending;

  // React Hook Form for Job Posting
  const { register, handleSubmit, formState: { errors }, reset } = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      salaryRange: '',
      skillsRequired: 'React, TypeScript, CSS',
      requirements: '3+ years commercial React, TypeScript skills',
      description: '',
    }
  });

  // Data Loading functions
  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      if (data.status === 'success') {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/companies/${user.id}/applications`);
      const data = await res.json();
      if (data.status === 'success') {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchInterviews = async () => {
    setLoadingInterviews(true);
    try {
      const res = await fetch(`/api/companies/${user.id}/interviews`);
      const data = await res.json();
      if (data.status === 'success') {
        setInterviews(data.interviews);
      }
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchCandidates(),
      fetchApplications(),
      fetchInterviews(),
      refetchJobs()
    ]);
  };

  useEffect(() => {
    refreshAllData();
  }, [user.id, activeTab]);

  // Handle job posting
  const handlePostJobSubmit = (formData: JobPostFormData) => {
    setJobFormMsg('');
    const skillsList = formData.skillsRequired.split(',').map(s => s.trim()).filter(Boolean);
    createJobMutation.mutate({
      companyId: user.id,
      companyName: companyNameVal || user.companyName || 'Dynamic Partner',
      title: formData.title,
      department: formData.department,
      location: formData.location,
      salaryRange: formData.salaryRange,
      description: formData.description,
      requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean),
      skillsRequired: skillsList
    }, {
      onSuccess: (data) => {
        if (data.status === 'success' && data.job) {
          setJobFormMsg('SUCCESS: Active position launched! Generating AI Assessment Task...');
          setAssociatedJobId(data.job.id);
          
          setGeneratingJobTask(true);
          generateJobTaskMutation.mutate({
            title: formData.title,
            description: formData.description,
            category: formData.department || 'Web Development', // Using department as category for the prompt
            skills: skillsList
          }, {
            onSuccess: (taskData) => {
              setGeneratingJobTask(false);
              if (taskData.status === 'success' && taskData.task) {
                setGeneratedJobTask(taskData.task);
                setIsJobTaskModalOpen(true);
                reset();
                refreshAllData();
              } else {
                setJobFormMsg('ERROR: Could not generate AI task. Check logs.');
              }
            },
            onError: () => {
              setGeneratingJobTask(false);
              setJobFormMsg('ERROR: Network issue generating AI task.');
            }
          });
          
        } else {
          setJobFormMsg('ERROR: Could not post listing.');
        }
      },
      onError: () => {
        setJobFormMsg('Network error. Check configuration.');
      }
    });
  };

  // Handle job inline editing
  const handleEditJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      const res = await fetch(`/api/jobs/update/${editingJob.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJob)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEditingJob(null);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle job retirement (delete)
  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/delete/${jobId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDeletingJobId(null);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle applicant state update
  const handleUpdateStatus = async (appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          feedback: statusFeedback
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUpdatingStatusAppId(null);
        setStatusFeedback('');
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle AI sandbox challenge generation
  const handleGenerateTaskAI = async () => {
    setGeneratedTask(null);
    generateTaskMutation.mutate({
      skills: taskSkills.split(',').map(s => s.trim()).filter(Boolean)
    }, {
      onSuccess: (data) => {
        if (data.status === 'success') {
          setGeneratedTask(data.task);
        }
      },
      onError: (e) => {
        console.error('Task generation failed', e);
      }
    });
  };

  // Handle Recruiter Profile Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await fetch(`/api/auth/update/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyNameVal,
          bio: bioVal,
          title: titleVal
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSettingsMsg('SUCCESS: Corporate profile synced to Cloud Secure Registry.');
      } else {
        setSettingsMsg('Failed to update company settings.');
      }
    } catch (err) {
      console.error(err);
      setSettingsMsg('Error saving profile changes.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Calculate Dashboard Summary Stats
  const activePositionsCount = jobs.filter(j => j.companyId === user.id).length || 1; 
  const totalApplicantsCount = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'Interviewing').length;
  const averageReputation = candidates.length > 0 
    ? Math.round(candidates.reduce((acc, c) => acc + c.reputationScore, 0) / candidates.length)
    : 680;

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[650px]">
      
      {/* 1. Left Sidebar Navigation Panel */}
      <div className="w-full lg:w-64 flex flex-col gap-2">
        <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-800/60 pb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm line-clamp-1">{companyNameVal}</h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Hiring Hub</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard Workspace', icon: Cpu },
              { id: 'create_job', label: 'Broadcast Job', icon: Plus },
              { id: 'manage_jobs', label: 'Positions Manager', icon: Briefcase },
              { id: 'applicants', label: 'Applicants Tracker', icon: FileSpreadsheet, badge: applications.filter(a => a.status === 'Applied').length },
              { id: 'hiring_hub', label: 'AI Hiring Engine', icon: Sparkles },
              { id: 'candidates', label: 'Talent Directory', icon: Users },
              { id: 'interviews', label: 'Simulated Panel Logs', icon: MessageSquare, badge: interviews.length },
              { id: 'analytics', label: 'Performance Analytics', icon: BarChart2 },
              { id: 'task_creator', label: 'AI Sandbox Lab', icon: Sparkles },
              { id: 'company_insights', label: 'AI Job Optimizer', icon: Zap },
              { id: 'settings', label: 'Corporate Settings', icon: Settings }
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-indigo-500/15 to-teal-500/5 border-indigo-500/30 text-indigo-300' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 rounded font-bold font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Refresh Status Trigger */}
        <button 
          onClick={refreshAllData}
          className="w-full bg-[#0D1117] border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Real-Time Data</span>
        </button>
      </div>

      {/* 2. Main Content Workspace Container */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D1117] border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-teal-500/5 pointer-events-none">
                  <Cpu className="w-48 h-48" />
                </div>
                <div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                    Hiring Manager Intelligence Control
                  </span>
                  <h2 className="text-xl font-black text-white mt-1.5 font-display tracking-tight">
                    Corporate Recruitment Control Tower
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage direct applicants, inspect AI-verified reputation indexes, evaluate simulator logs, and launch code sandboxes.
                  </p>
                </div>
              </div>

              {/* Bento Grid KPI Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Positions', value: activePositionsCount, change: 'Broadcasting Live', icon: Briefcase, color: 'text-teal-400', bg: 'bg-teal-500/5' },
                  { label: 'Platform Applicants', value: totalApplicantsCount, change: `${interviewingCount} Interviewing`, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
                  { label: 'Evaluated Transcripts', value: interviews.length, change: '100% Autograded', icon: ClipboardList, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                  { label: 'Talent Match Index', value: `${averageReputation}/1000`, change: 'Average Reputation', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/5' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold">{stat.label}</span>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono tracking-wide">{stat.change}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Workspace Split Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SVG Visual Progress Funnel (Applicant States) */}
                <div className="lg:col-span-7 bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                      Platform Recruitment Pipeline Funnel
                    </h3>
                    <p className="text-[10px] text-slate-500">Live counts of talent crossing different matching checkpoints.</p>
                  </div>

                  <div className="py-6 flex flex-col gap-4">
                    {[
                      { stage: 'Applied Checkpoint', count: totalApplicantsCount, pct: 100, color: '#6366f1' },
                      { stage: 'Aptitude Screening / Shortlist', count: applications.filter(a => a.status === 'Shortlisted' || a.status === 'Interviewing' || a.status === 'Hired').length, pct: 75, color: '#14b8a6' },
                      { stage: 'Simulated Panel / Interviewing', count: interviewingCount, pct: 50, color: '#10b981' },
                      { stage: 'Hired / Offered Position', count: applications.filter(a => a.status === 'Hired').length, pct: 20, color: '#eab308' }
                    ].map((row, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-300">{row.stage}</span>
                          <span className="text-slate-400 font-mono font-bold">{row.count} candidate{row.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${row.count > 0 ? (row.count / (totalApplicantsCount || 1)) * 100 : 0}%`, 
                              backgroundColor: row.color 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                    <span>Funnel computed instantly</span>
                    <button onClick={() => setActiveTab('applicants')} className="text-teal-400 hover:text-white font-bold flex items-center gap-0.5 cursor-pointer">
                      View active applicants
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Action Widget (Gemini Task Generator Promo) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-[#121824] to-[#0A0C10] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-9 w-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-white font-display">Automate Coding Challenges</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Need custom coding challenges? Request our integrated Gemini compiler engine to construct fully formatted and autograded sandbox assignments in seconds.
                    </p>
                  </div>

                  <div className="space-y-3.5 mt-6">
                    <input 
                      type="text" 
                      placeholder="TypeScript, React, CSS..." 
                      value={taskSkills}
                      onChange={(e) => setTaskSkills(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 text-center font-mono"
                    />
                    <button 
                      onClick={() => setActiveTab('task_creator')}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Launch AI Sandbox Lab</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Recent Applicants Quick Table */}
              <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Recent Direct Applicants
                  </h3>
                  <button onClick={() => setActiveTab('applicants')} className="text-xs text-indigo-400 hover:text-white font-bold cursor-pointer">
                    Manage all
                  </button>
                </div>

                {applications.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No candidates have applied to your roles yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 font-semibold">Candidate</th>
                          <th className="py-2.5 font-semibold">Target Position</th>
                          <th className="py-2.5 font-semibold text-center">ATS Score</th>
                          <th className="py-2.5 font-semibold text-center">Status</th>
                          <th className="py-2.5 font-semibold text-right">Applied On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-xs">
                        {applications.slice(0, 3).map((app) => (
                          <tr key={app.id} className="hover:bg-slate-900/10">
                            <td className="py-3 font-semibold text-white">{app.candidate_name}</td>
                            <td className="py-3 text-slate-400">{app.job_title}</td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded font-bold font-mono text-[10px] ${
                                app.score >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {app.score || '85'}%
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                app.status === 'Hired' ? 'bg-emerald-500/15 text-emerald-400' :
                                app.status === 'Interviewing' ? 'bg-indigo-500/15 text-indigo-400' :
                                app.status === 'Shortlisted' ? 'bg-teal-500/15 text-teal-400' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-3 text-right text-slate-500 font-mono text-[10px]">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB: CREATE_JOB */}
          {activeTab === 'create_job' && (
            <motion.div 
              key="create_job"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6"
            >
              <div className="mb-6 pb-4 border-b border-slate-800/60">
                <h3 className="text-lg font-bold font-display text-white">
                  Broadcast New Position to SkillHire Network
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  List active openings which candidates can view and apply for instantly.
                </p>
              </div>

              <form onSubmit={handleSubmit(handlePostJobSubmit)} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Job Title</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="e.g. Senior Frontend Developer"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                    {errors.title && <p className="text-red-400 text-[10px] mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Department / Domain Category</label>
                    <select
                      {...register('department')}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500 appearance-none"
                    >
                      <option value="">Select Domain Category...</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile Development">Mobile Development</option>
                      <option value="UI UX">UI UX</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="SEO">SEO</option>
                      <option value="Content Writing">Content Writing</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Cyber Security">Cyber Security</option>
                      <option value="Data Analysis">Data Analysis</option>
                    </select>
                    {errors.department && <p className="text-red-400 text-[10px] mt-1">{errors.department.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Location Format</label>
                    <input
                      type="text"
                      {...register('location')}
                      placeholder="e.g. Remote / Hybrid / Dhaka"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                    {errors.location && <p className="text-red-400 text-[10px] mt-1">{errors.location.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Salary Range Scale</label>
                    <input
                      type="text"
                      {...register('salaryRange')}
                      placeholder="e.g. 130,000 - 170,000 BDT/month"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                    {errors.salaryRange && <p className="text-red-400 text-[10px] mt-1">{errors.salaryRange.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Required Core Skills (Comma separated)</label>
                  <input
                    type="text"
                    {...register('skillsRequired')}
                    placeholder="React, TypeScript, CSS, Node.js"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                  {errors.skillsRequired && <p className="text-red-400 text-[10px] mt-1">{errors.skillsRequired.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Key Requirements & Qualifications (Comma separated)</label>
                  <input
                    type="text"
                    {...register('requirements')}
                    placeholder="5+ years of production experience, expert with hooks and state"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  {errors.requirements && <p className="text-red-400 text-[10px] mt-1">{errors.requirements.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Job Description</label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    placeholder="Briefly summarize the product context, team, culture, and core daily responsibilities..."
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                  {errors.description && <p className="text-red-400 text-[10px] mt-1">{errors.description.message}</p>}
                </div>

                {jobFormMsg && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                    jobFormMsg.startsWith('SUCCESS') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {jobFormMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingJob}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  {submittingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Launch Position Broadcast'}
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB: MANAGE_JOBS */}
          {activeTab === 'manage_jobs' && (
            <motion.div 
              key="manage_jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-400" />
                  Your Active Job Positions ({jobs.filter(j => j.companyId === user.id).length})
                </h3>

                <div className="space-y-4">
                  {jobs.filter(j => j.companyId === user.id).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs space-y-4">
                      <p className="italic">No active postings registered under your corporate ID.</p>
                      <button onClick={() => setActiveTab('create_job')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer">
                        Post your first job
                      </button>
                    </div>
                  ) : (
                    jobs.filter(j => j.companyId === user.id).map((j) => (
                      <div key={j.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                        {editingJob && editingJob.id === j.id ? (
                          /* Inline Edit Form */
                          <form onSubmit={handleEditJobSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Job Title</label>
                                <input 
                                  type="text" 
                                  value={editingJob.title}
                                  onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Salary Scale</label>
                                <input 
                                  type="text" 
                                  value={editingJob.salaryRange}
                                  onChange={(e) => setEditingJob({...editingJob, salaryRange: e.target.value})}
                                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Location Format</label>
                                <input 
                                  type="text" 
                                  value={editingJob.location}
                                  onChange={(e) => setEditingJob({...editingJob, location: e.target.value})}
                                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Department</label>
                                <input 
                                  type="text" 
                                  value={editingJob.department}
                                  onChange={(e) => setEditingJob({...editingJob, department: e.target.value})}
                                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 uppercase mb-1">Description</label>
                              <textarea 
                                value={editingJob.description}
                                rows={3}
                                onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white leading-relaxed"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => setEditingJob(null)} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                                Cancel
                              </button>
                              <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded-lg cursor-pointer">
                                Save Changes
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* View Mode */
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-white text-base">{j.title}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/50">{j.department}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-500" /> {j.location}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-teal-400"><DollarSign className="w-3 h-3 text-teal-400/80" /> {j.salaryRange}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => setEditingJob(j)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Edit position specifications"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                
                                {deletingJobId === j.id ? (
                                  <div className="flex items-center gap-1 bg-red-950/20 border border-red-900/40 px-2 py-1 rounded-lg">
                                    <span className="text-[10px] text-red-400 font-bold mr-1">Confirm?</span>
                                    <button onClick={() => handleDeleteJob(j.id)} className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer">Yes</button>
                                    <button onClick={() => setDeletingJobId(null)} className="text-[10px] text-slate-400 hover:text-white font-medium px-1 py-0.5 cursor-pointer">No</button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setDeletingJobId(j.id)}
                                    className="p-1.5 bg-slate-900 hover:bg-red-950/25 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/20 rounded-lg transition-colors cursor-pointer"
                                    title="Retire position"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed mt-2">{j.description}</p>
                            
                            {/* AI Insights Panel */}
                            <div className="mt-4 pt-4 border-t border-slate-800/40 space-y-4">
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                                  <span>AI Analysis Level:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                                    j.difficultyLevel === 'Advanced' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                    j.difficultyLevel === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {j.difficultyLevel || 'Intermediate'}
                                  </span>
                                </div>
                              </div>

                              {j.requiredSkillsList && j.requiredSkillsList.length > 0 && (
                                <div>
                                  <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block mb-1.5">Required Skills (Mandatory)</span>
                                  <div className="flex flex-wrap gap-1">
                                    {j.requiredSkillsList.map((s, idx) => (
                                      <span key={idx} className="bg-slate-900 text-slate-300 text-[10px] rounded border border-slate-800 px-2 py-0.5 font-mono">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {j.optionalSkillsList && j.optionalSkillsList.length > 0 && (
                                <div>
                                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block mb-1.5">Optional Skills (Nice-To-Have)</span>
                                  <div className="flex flex-wrap gap-1">
                                    {j.optionalSkillsList.map((s, idx) => (
                                      <span key={idx} className="bg-slate-900 text-slate-400 text-[10px] rounded border border-slate-800 px-2 py-0.5 font-mono">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {j.skillMatrix && j.skillMatrix.length > 0 && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">AI-Generated Skill Matrix Specifications</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {j.skillMatrix.map((item, idx) => (
                                      <div key={idx} className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-2.5 flex items-center justify-between">
                                        <div>
                                          <div className="text-xs font-bold text-white font-mono">{item.skill}</div>
                                          <div className="text-[9px] text-slate-500 mt-0.5">{item.category} • Depth: {item.proficiency}</div>
                                        </div>
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          item.importance === 'High' ? 'bg-red-500/10 text-red-400' :
                                          item.importance === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                          'bg-slate-800 text-slate-400'
                                        }`}>
                                          {item.importance}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Desired Skillsets</span>
                              <div className="flex flex-wrap gap-1">
                                {j.skillsRequired.map((s, idx) => (
                                  <span key={idx} className="bg-slate-900 text-slate-400 text-[10px] rounded border border-slate-800/60 px-2 py-0.5 font-mono">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: APPLICANTS */}
          {activeTab === 'applicants' && (
            <motion.div 
              key="applicants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                    Incoming Application Registry ({applications.length})
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Real-Time Sync active</span>
                </div>

                {loadingApps ? (
                  <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    Querying secure applications records...
                  </div>
                ) : applications.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No matching applications received yet.</p>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h4 className="font-bold text-white text-base">{app.candidate_name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                app.status === 'Hired' ? 'bg-emerald-500/15 text-emerald-400' :
                                app.status === 'Interviewing' ? 'bg-indigo-500/15 text-indigo-400' :
                                app.status === 'Shortlisted' ? 'bg-teal-500/15 text-teal-400' :
                                app.status === 'Rejected' ? 'bg-red-500/15 text-red-400' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                              <span>Target: <strong>{app.job_title}</strong></span>
                              <span>•</span>
                              <span className="text-slate-500">{app.candidate_title || 'Software Developer'}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px]">{app.candidate_email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 uppercase font-mono">ATS Compatibility</div>
                              <div className={`text-lg font-bold font-mono ${app.score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {app.score || '85'}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 uppercase font-mono">Candidate Rep</div>
                              <div className="text-lg font-bold text-indigo-400 font-mono">
                                {app.candidate_reputation || '550'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Resume text context */}
                        <div className="mt-4">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Resume Screening Highlight</span>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                            {app.resume_text || "Resume details submitted securely."}
                          </p>
                        </div>

                        {/* Recruiter feedback loop */}
                        {app.feedback && (
                          <div className="mt-3.5 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-300 flex gap-2">
                            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                            <div>
                              <strong className="block mb-0.5 text-slate-200">Hiring Decision Log</strong>
                              {app.feedback}
                            </div>
                          </div>
                        )}

                        {/* Actions block */}
                        <div className="mt-5 pt-3.5 border-t border-slate-850 flex flex-wrap gap-2.5 items-center justify-between">
                          
                          <button 
                            onClick={async () => {
                              const candProfile = candidates.find(c => c.id === app.candidate_id);
                              if (candProfile) {
                                setSelectedCandidate(candProfile);
                              } else {
                                // fetch on demand
                                try {
                                  const res = await fetch(`/api/auth/profile/${app.candidate_id}`);
                                  const d = await res.json();
                                  if (d.status === 'success') {
                                    setSelectedCandidate(d.user);
                                  }
                                } catch (e) { console.error(e); }
                              }
                            }}
                            className="text-xs text-teal-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer py-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Inspect verified Skill Passport</span>
                          </button>

                          {updatingStatusAppId === app.id ? (
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-2">
                              <select 
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="bg-slate-900 border border-slate-800 p-2 text-xs rounded-xl text-white outline-none"
                              >
                                <option value="Shortlisted">Shortlist Candidate</option>
                                <option value="Interviewing">Invite to Simulated Panel</option>
                                <option value="Hired">Mark Position as Offered/Hired</option>
                                <option value="Rejected">Log Rejection / Archive</option>
                              </select>
                              <input 
                                type="text"
                                placeholder="Add hiring feedback/evaluation notes..."
                                value={statusFeedback}
                                onChange={(e) => setStatusFeedback(e.target.value)}
                                className="bg-slate-900 border border-slate-800 p-2 text-xs rounded-xl text-white outline-none placeholder:text-slate-500 w-full md:w-64"
                              />
                              <div className="flex gap-1.5">
                                <button onClick={() => handleUpdateStatus(app.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer">
                                  Save
                                </button>
                                <button onClick={() => setUpdatingStatusAppId(null)} className="text-slate-400 hover:text-white text-xs px-2.5 py-2 cursor-pointer">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => {
                                  setUpdatingStatusAppId(app.id);
                                  setNewStatus('Shortlisted');
                                }} 
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold px-3.5 py-2 rounded-xl cursor-pointer"
                              >
                                Update Status / Log Decision
                              </button>
                            </div>
                          )}

                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: CANDIDATES */}
          {activeTab === 'candidates' && (
            <motion.div 
              key="candidates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-400 animate-pulse" />
                    Verified Talent Directory
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Verified skill sets categorized by AI Career Reputation Score index.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Autonomous Audit Active</span>
              </div>

              {loadingCandidates ? (
                <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  Querying blockchain-verified candidate registries...
                </div>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No platform candidates listed yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidates.map((cand) => (
                    <div key={cand.id} className="bg-[#0D1117] border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between">
                      
                      <div className="p-5 border-b border-slate-800/40 bg-slate-950/20">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white text-base">{cand.name}</h4>
                            <div className="text-xs text-slate-400 mt-0.5">{cand.title || 'Full Stack Engineer'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Reputation</div>
                            <div className="text-lg font-bold text-indigo-400 font-mono leading-tight">{cand.reputationScore}</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                          {cand.bio || 'Developer profile seeking new roles and practicing AI technical assessments.'}
                        </p>
                      </div>

                      <div className="p-5 flex-1 space-y-4">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">Verified Skill Passport Badges</span>
                          {Object.keys(cand.verifiedSkills || {}).length === 0 ? (
                            <span className="text-xs text-slate-500 italic font-mono">No skill assessments verified yet.</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(cand.verifiedSkills).map(([skill, s]) => (
                                <span key={skill} className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full py-0.5 px-2 font-bold font-mono">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  {skill} ({s.score}%)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Self-Asserted Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {cand.skills && cand.skills.length > 0 ? (
                              cand.skills.map((s, idx) => (
                                <span key={idx} className="bg-slate-950 text-slate-400 text-[10px] rounded px-2 py-0.5 font-mono">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">No custom tags added</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${cand.subscribed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className="text-slate-500 font-mono text-[10px]">Premium Member</span>
                        </div>
                        <button 
                          onClick={() => setSelectedCandidate(cand)}
                          className="text-teal-400 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
                        >
                          Inspect Bio
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: INTERVIEWS */}
          {activeTab === 'interviews' && (
            <motion.div 
              key="interviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Simulated AI Panel Evaluation Logs ({interviews.length})
                  </h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Autograded Transcript System
                  </span>
                </div>

                {loadingInterviews ? (
                  <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Querying secure simulated conversation logs...
                  </div>
                ) : interviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No simulated panel sessions evaluated yet.</p>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((session) => {
                      const cand = candidates.find(c => c.id === session.candidateId);
                      return (
                        <div key={session.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                          
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-4">
                            <div>
                              <h4 className="font-bold text-white text-base">
                                Candidate Session: {cand?.name || 'Rahat Islam'}
                              </h4>
                              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                <span>Target Skill Profile: <strong>{session.jobTitle}</strong></span>
                                <span>•</span>
                                <span className="font-mono text-slate-500">Completed Session</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase font-mono block">Simulated Panel Grade</span>
                              <span className="text-2xl font-black font-mono text-emerald-400">
                                {session.evaluation?.overallScore || '88'}/100
                              </span>
                            </div>
                          </div>

                          {/* strengths and improvements */}
                          {session.evaluation && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-xs space-y-1.5">
                                <h5 className="font-bold text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> High-Proficiency Highlights
                                </h5>
                                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                                  {session.evaluation.strengths.map((str, i) => (
                                    <li key={i}>{str}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl text-xs space-y-1.5">
                                <h5 className="font-bold text-indigo-400 flex items-center gap-1">
                                  <TrendingUp className="w-3.5 h-3.5" /> Core Improvement Areas
                                </h5>
                                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                                  {session.evaluation.improvements.map((imp, i) => (
                                    <li key={i}>{imp}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* recommendation bio feedback */}
                          <p className="text-xs text-slate-400 leading-relaxed mt-4 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                            <strong>Panel Recommendation:</strong> {session.evaluation?.feedback || 'Simulated session graded with high compatibility match.'}
                          </p>

                          <div className="mt-4 flex justify-end">
                            <button 
                              onClick={() => setSelectedInterview(session)}
                              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Full Transcript script ({session.questions.length} questions)</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-[#0D1117] border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-teal-400" />
                    Corporate Talent Analytics
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Statistical metrics compiled from objective platform audits.</p>
                </div>
                <span className="text-[10px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-500 font-mono">2026 Season</span>
              </div>

              {/* Analytics Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart 1: Reputation Score Distribution (SVG) */}
                <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                      Candidate Reputation Distribution
                    </h4>
                    <p className="text-[10px] text-slate-500">Density mapping representing verified candidate scores.</p>
                  </div>

                  <div className="py-6 flex items-end justify-between h-48 px-4 relative">
                    <div className="absolute inset-x-0 bottom-0 border-b border-slate-800/80" />
                    {/* SVG Spline/Bar chart representation */}
                    {[
                      { range: '0-400', count: 12, h: '15%' },
                      { range: '400-600', count: 32, h: '45%' },
                      { range: '600-800', count: 68, h: '95%' },
                      { range: '800-1000', count: 24, h: '60%' }
                    ].map((bar, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 w-1/5 z-10">
                        <span className="text-[9px] text-slate-400 font-bold font-mono">{bar.count} cand</span>
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600/80 to-teal-500/80 rounded-t-md hover:from-teal-400 hover:to-indigo-400 transition-all duration-300"
                          style={{ height: bar.h }}
                        />
                        <span className="text-[9px] text-slate-500 font-mono mt-1">{bar.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 2: Skills Demand frequency */}
                <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-teal-400" />
                      Most Requested Skill Badges
                    </h4>
                    <p className="text-[10px] text-slate-500">Target frequency matching across current job listings.</p>
                  </div>

                  <div className="py-4 space-y-3">
                    {[
                      { skill: 'React Framework Core', count: 94, pct: '94%' },
                      { skill: 'TypeScript Strict Types', count: 88, pct: '88%' },
                      { skill: 'Node & Microservices', count: 65, pct: '65%' },
                      { skill: 'Tailwind Design System', count: 58, pct: '58%' }
                    ].map((row, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-300 font-semibold">{row.skill}</span>
                          <span className="text-teal-400 font-bold">{row.count}% frequency</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: row.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: TASK_CREATOR */}
          {activeTab === 'task_creator' && (
            <motion.div 
              key="task_creator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Creator form */}
              <div className="lg:col-span-5 bg-[#0D1117] border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold font-display text-white">
                    Generate Interactive Sandboxes
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
                  Employing Gemini LLM core to construct interactive, fully autograded programming sandbox trials target-matched for candidate evaluations.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Technology Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={taskSkills}
                      onChange={(e) => setTaskSkills(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                      placeholder="e.g. TypeScript, React Hooks, Node"
                    />
                  </div>

                  <button
                    onClick={handleGenerateTaskAI}
                    disabled={generatingTask}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generatingTask ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        Assembling Sandbox with Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                        Forge Automated Sandbox Challenge
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Result */}
              <div className="lg:col-span-7 bg-[#0D1117] border border-slate-800 rounded-xl p-6 shadow-lg min-h-[400px] flex flex-col justify-between">
                {generatedTask ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 text-indigo-400 font-bold uppercase tracking-wider">
                          {generatedTask.skill} Challenge
                        </span>
                        <h4 className="text-base font-bold text-white mt-1 font-display">{generatedTask.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Time Limit: {generatedTask.timeLimit}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase mb-1">Interactive task specification</h5>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg font-mono whitespace-pre-line">
                          {generatedTask.description}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase mb-1">Starter Sandbox code template</h5>
                        <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-teal-400 font-mono text-[10px] overflow-x-auto max-h-[180px]">
                          {generatedTask.starterCode}
                        </pre>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] leading-relaxed flex gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Interactive coding environment is configured. Candidates can now select <strong>{generatedTask.title}</strong> from their sandbox arena and code in real time!</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl mb-4 text-indigo-400/40">
                      <Cpu className="w-8 h-8" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">No active challenge configuration forged</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Enter technology skills on the left to request the platform AI to architect a structured code sandbox trial with autograded test specs.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: COMPANY INSIGHTS OPTIMIZER */}
          {activeTab === 'company_insights' && (
            <motion.div 
              key="company_insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AICompanyInsights />
            </motion.div>
          )}

          {/* TAB: AI HIRING ENGINE HUB */}
          {activeTab === 'hiring_hub' && (
            <motion.div 
              key="hiring_hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      AI Hiring Engine Hub
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Orchestrate high-volume recruitment with AI Ranking, Auto-Shortlisting, and Interview Synthesis.
                    </p>
                  </div>
                  <select 
                    value={hiringEngineJobId}
                    onChange={(e) => setHiringEngineJobId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Target Position...</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                {!hiringEngineJobId ? (
                  <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                    <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-slate-400">Target Position Not Selected</h3>
                    <p className="text-xs text-slate-500 mt-1">Select a job from the dropdown above to engage the hiring engine.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Control Panel */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-300 uppercase mb-4">Automation Matrix</h3>
                        <div className="space-y-3">
                          <button 
                            onClick={() => rankCandidatesMutation.mutate({ jobId: hiringEngineJobId })}
                            disabled={rankCandidatesMutation.isPending}
                            className="w-full flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-xs font-bold text-indigo-300 transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              {rankCandidatesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                              <span>AI Candidate Ranking</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>

                          <button 
                            onClick={() => shortlistCandidatesMutation.mutate({ jobId: hiringEngineJobId })}
                            disabled={shortlistCandidatesMutation.isPending}
                            className="w-full flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-bold text-emerald-300 transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              {shortlistCandidatesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                              <span>AI Auto-Shortlisting</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        </div>
                        <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800/40">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Engine Intelligence Status</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-[10px] text-emerald-400 font-mono">GROQ-ULTRA V4.2 ACTIVE</span>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-relaxed italic">
                            Ranking is calculated based on AI Reputation Score, Match Percent, and Assessment performance.
                          </p>
                        </div>
                      </div>

                      {/* Scheduled Interviews List */}
                      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-300 uppercase mb-4 flex items-center justify-between">
                          Upcoming Interviews
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                            {(realInterviews || []).length}
                          </span>
                        </h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {realInterviews && realInterviews.length > 0 ? realInterviews.map((int: any) => {
                            const cand = candidates.find(c => c.id === int.candidate_id);
                            return (
                              <div key={int.id} className="p-3 bg-slate-950 border border-slate-800/50 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-white">{cand?.name || 'Candidate'}</span>
                                  <span className="text-[9px] text-slate-500 font-mono">{new Date(int.scheduled_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <Calendar className="w-3 h-3 text-indigo-400" />
                                  <span className="text-slate-400">{new Date(int.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <a 
                                  href={int.meeting_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block w-full text-center py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg transition-all"
                                >
                                  Join {int.meeting_type}
                                </a>
                              </div>
                            );
                          }) : (
                            <div className="text-center py-6 text-slate-600 italic text-[10px]">
                              No interviews scheduled yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Applicants Ranking Feed */}
                    <div className="lg:col-span-2">
                      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-300 uppercase">Engine Ranked Applicants</h3>
                          <div className="flex items-center gap-4 text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-slate-400">Shortlisted</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-slate-400">Candidate</span>
                            </div>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-800">
                          {applications.filter(a => a.jobId === hiringEngineJobId).sort((a, b) => (b.aiRanking || 0) - (a.aiRanking || 0)).map((app, idx) => {
                            const cand = candidates.find(c => c.id === app.candidateId);
                            return (
                              <div key={app.id} className="p-4 hover:bg-slate-900/40 transition-all group">
                                <div className="flex items-start justify-between">
                                  <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-500 border border-slate-700">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-white">{cand?.name}</h4>
                                        {app.shortlisted && (
                                          <div className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase font-mono tracking-tight">
                                            Shortlisted
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 mb-2">{cand?.title}</p>
                                      <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 rounded-full border border-slate-800">
                                          <TrendingUp className="w-3 h-3 text-indigo-400" />
                                          <span className="text-[10px] text-slate-400 font-mono">Match: {app.matchScore || 0}%</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 rounded-full border border-slate-800">
                                          <Award className="w-3 h-3 text-amber-400" />
                                          <span className="text-[10px] text-slate-400 font-mono">Rep: {cand?.reputationScore || 300}</span>
                                        </div>
                                        {app.aiRanking && (
                                          <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                            <Sparkles className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[10px] text-indigo-300 font-mono font-bold">AI RANK: {app.aiRanking}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2">
                                    <button 
                                      onClick={() => {
                                        setInterviewCandidate(cand!);
                                        setIsInterviewModalOpen(true);
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      Schedule Interview
                                    </button>
                                    <button 
                                      className="text-[10px] text-slate-500 hover:text-white transition-all flex items-center gap-1"
                                      onClick={() => {
                                        setInspectingApp(app);
                                        setSelectedCandidate(cand!);
                                        setActiveTab('applicants');
                                      }}
                                    >
                                      <Eye className="w-3 h-3" />
                                      Full Report
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {applications.filter(a => a.jobId === hiringEngineJobId).length === 0 && (
                            <div className="p-20 text-center text-slate-600 italic text-xs">
                              No applicants found for this position.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6"
            >
              <div className="mb-6 pb-4 border-b border-slate-800/60">
                <h3 className="text-lg font-bold font-display text-white">
                  Corporate Profile Settings
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your brand assets, recruitment team tags, and custom settings synced with Supabase.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    value={companyNameVal}
                    onChange={(e) => setCompanyNameVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Your Professional Title / Role</label>
                  <input
                    type="text"
                    value={titleVal}
                    onChange={(e) => setTitleVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Corporate Mission & Bio</label>
                  <textarea
                    value={bioVal}
                    rows={4}
                    onChange={(e) => setBioVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>

                {settingsMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    settingsMsg.startsWith('SUCCESS') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {settingsMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                >
                  {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Corporate Profiles'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 3. VERIFIED SKILL PASSPORT DETAIL MODAL */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0D1117] border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 relative"
            >
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4 border-b border-slate-800/60 pb-5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-lg">{selectedCandidate.name}</h3>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-black font-mono">
                      Verified Passport
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedCandidate.title || 'Full Stack Tech stack'}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedCandidate.email}</p>
                </div>
              </div>

              {/* Bio block */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Bio</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCandidate.bio || 'Candidate has not added a custom biography yet.'}
                </p>
              </div>

              {/* Reputation & Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Reputation Rank</span>
                  <span className="text-xl font-black text-indigo-400 font-mono">
                    {selectedCandidate.reputationScore}/1000
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Billing Status</span>
                  <span className={`text-xs font-bold font-mono mt-1 block ${selectedCandidate.subscribed ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {selectedCandidate.subscribed ? 'Premium Active' : 'Basic Member'}
                  </span>
                </div>
              </div>

              {/* Verified Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Skill Badges</h4>
                {Object.keys(selectedCandidate.verifiedSkills || {}).length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-mono">No badges verified via platform quizzes yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {Object.entries(selectedCandidate.verifiedSkills).map(([skill, details]) => (
                      <div key={skill} className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-white font-semibold">{skill}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono">
                            Score: {details.score}%
                          </span>
                          <span className="block text-[8px] text-slate-500 mt-0.5">Verified on {details.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Self asserted skills */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Additional Developer Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                    selectedCandidate.skills.map((s, idx) => (
                      <span key={idx} className="bg-slate-950 text-slate-400 text-[10px] rounded px-2.5 py-1 border border-slate-850 font-mono">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No custom tags added.</span>
                  )}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MOCK INTERVIEW TRANSCRIPT MODAL */}
      <AnimatePresence>
        {selectedInterview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0D1117] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative"
            >
              <button 
                onClick={() => setSelectedInterview(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-slate-800 pb-4">
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Evaluation Transcript
                </span>
                <h3 className="text-lg font-black text-white mt-1.5 font-display">
                  {selectedInterview.jobTitle} Session Script
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Full transcript of questions and responses autograded by SkillHire AI panel evaluation cores.
                </p>
              </div>

              <div className="space-y-4">
                {selectedInterview.questions.map((question, index) => {
                  const answer = selectedInterview.answers[index];
                  return (
                    <div key={index} className="space-y-2 border-b border-slate-800/40 pb-4 last:border-b-0">
                      <div className="flex gap-2.5 items-start">
                        <span className="text-xs font-bold text-teal-400 font-mono mt-0.5 bg-teal-500/10 px-1.5 py-0.5 rounded">
                          Q{index + 1}
                        </span>
                        <p className="text-xs font-semibold text-white leading-relaxed">{question}</p>
                      </div>

                      <div className="pl-8 flex gap-2 text-xs">
                        <div className="h-6 w-6 bg-slate-950 border border-slate-850 rounded-full flex items-center justify-center text-[10px] text-indigo-400 font-mono">
                          A
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-2xl leading-relaxed italic border border-slate-900 w-full">
                          "{answer || "No typed response recorded."}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-xs space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Final Audit Recommendations
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedInterview.evaluation?.feedback || 'Simulated transcript analysis completed with high compatibilities.'}
                </p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI INTERVIEW SCHEDULING MODAL */}
      <AnimatePresence>
        {isInterviewModalOpen && interviewCandidate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0D1117] border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative"
            >
              <button 
                onClick={() => {
                  setIsInterviewModalOpen(false);
                  setGeneratedQuestions([]);
                }}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-display">AI Interview Synthesis</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Generate personalized deep-dive questions and schedule technical sessions.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Stage 1: Generate Questions */}
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase">1. Question Generation</h3>
                    <select 
                      value={interviewDifficulty}
                      onChange={(e) => setInterviewDifficulty(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded p-1 outline-none"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => generateInterviewMutation.mutate({ 
                      jobId: hiringEngineJobId, 
                      candidateId: interviewCandidate.id, 
                      difficulty: interviewDifficulty 
                    }, {
                      onSuccess: (data) => setGeneratedQuestions(data.questions || [])
                    })}
                    disabled={generateInterviewMutation.isPending}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {generateInterviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generate {interviewDifficulty} Questions
                  </button>

                  {generatedQuestions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {generatedQuestions.map((q, i) => (
                        <div key={i} className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-slate-300 leading-relaxed italic">
                          {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stage 2: Schedule */}
                {generatedQuestions.length > 0 && (
                  <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase">2. Logistics & Delivery</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Session Timestamp</label>
                        <input 
                          type="datetime-local" 
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-[11px] text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Panel Type</label>
                        <select 
                          value={meetingType}
                          onChange={(e) => setMeetingType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-[11px] text-white outline-none focus:border-indigo-500"
                        >
                          <option value="zoom">Zoom Video</option>
                          <option value="google_meet">Google Meet</option>
                          <option value="custom">Custom Bridge Link</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Meeting URI</label>
                      <input 
                        type="url" 
                        placeholder="https://..."
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-[11px] text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button 
                      onClick={() => scheduleInterviewMutation.mutate({
                        jobId: hiringEngineJobId,
                        candidateId: interviewCandidate.id,
                        scheduledAt,
                        meetingType,
                        meetingLink,
                        difficultyLevel: interviewDifficulty,
                        questions: generatedQuestions
                      }, {
                        onSuccess: () => {
                          setIsInterviewModalOpen(false);
                          setGeneratedQuestions([]);
                          setScheduledAt('');
                          setMeetingLink('');
                        }
                      })}
                      disabled={scheduleInterviewMutation.isPending || !scheduledAt || !meetingLink}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {scheduleInterviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Finalize & Send Invite
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isJobTaskModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0D1117] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative"
            >
              <button 
                onClick={() => {
                  setIsJobTaskModalOpen(false);
                  setGeneratedJobTask(null);
                  setAssociatedJobId(null);
                }}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
                <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-display">Review AI Generated Task</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    An automated practical assessment has been generated for your new job listing. You can edit the parameters before publishing it to candidates.
                  </p>
                </div>
              </div>

              {generatingJobTask ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Synthesizing Assessment Task...</p>
                </div>
              ) : generatedJobTask ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    createTaskMutation.mutate({
                      ...generatedJobTask,
                      jobId: associatedJobId || undefined
                    }, {
                      onSuccess: (data) => {
                        setIsJobTaskModalOpen(false);
                        setGeneratedJobTask(null);
                        setAssociatedJobId(null);
                        setJobFormMsg('SUCCESS: AI Assessment Task Published Successfully!');
                        setTimeout(() => setJobFormMsg(''), 5000);
                      },
                      onError: () => {
                        setJobFormMsg('ERROR: Could not publish AI task.');
                      }
                    });
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Task Title</label>
                    <input 
                      type="text" 
                      value={generatedJobTask.title || ''}
                      onChange={(e) => setGeneratedJobTask({...generatedJobTask, title: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:border-teal-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Target Skill/Domain</label>
                      <input 
                        type="text" 
                        value={generatedJobTask.skill || ''}
                        onChange={(e) => setGeneratedJobTask({...generatedJobTask, skill: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Time Limit</label>
                      <input 
                        type="text" 
                        value={generatedJobTask.timeLimit || ''}
                        onChange={(e) => setGeneratedJobTask({...generatedJobTask, timeLimit: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Task Description / Instructions</label>
                    <textarea 
                      value={generatedJobTask.description || ''}
                      onChange={(e) => setGeneratedJobTask({...generatedJobTask, description: e.target.value})}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:border-teal-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Starter Template / Initial Code</label>
                    <textarea 
                      value={generatedJobTask.starterCode || ''}
                      onChange={(e) => setGeneratedJobTask({...generatedJobTask, starterCode: e.target.value})}
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-emerald-400 font-mono focus:border-teal-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                    <button 
                      type="button"
                      onClick={() => setIsJobTaskModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Skip Task Publishing
                    </button>
                    <button 
                      type="submit"
                      disabled={createTaskMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {createTaskMutation.isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Publish Assessment Task
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500">
                  Failed to load AI generated task.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
