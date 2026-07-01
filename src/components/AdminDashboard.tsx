import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Briefcase, CreditCard, Activity, Database, 
  Settings, BarChart3, FileText, Code2, AlertTriangle, 
  Trash2, Edit, CheckCircle, Search, RefreshCw, Send, Plus, 
  ArrowUpRight, Info, CheckCircle2, XCircle, Sparkles, Sliders, Play, Lock, Eye, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { UserProfile, JobPost, MockInterviewSession } from '../types';

interface AdminDashboardProps {
  adminUser: UserProfile;
}

interface SubscriptionRecord {
  phone: string;
  status: string;
  date: string;
  userName: string;
  userEmail: string;
}

interface SystemLog {
  id: string;
  type: string;
  target: string;
  user: string;
  score: number;
  timestamp: string;
  details: string;
}

export default function AdminDashboard({ adminUser }: AdminDashboardProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'jobs' | 'subscriptions' | 'reports' | 'ai_logs' | 'analytics' | 'settings'>('overview');
  
  // Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [subscriptionRecords, setSubscriptionRecords] = useState<SubscriptionRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>({
    maintenanceMode: false,
    aiStrictEval: true,
    carrierBillingFeeRate: 3,
    allowCandidatePublicSharing: true,
    sandboxCompilerAllowed: true
  });

  // UI Utility States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selected Entities for Inspection/Edit
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);

  // bdapps Carrier Simulator State
  const [cbPhone, setCbPhone] = useState('8801812345678');
  const [cbStatus, setCbStatus] = useState('active');
  const [cbEvent, setCbEvent] = useState('renewed');
  const [cbLoading, setCbLoading] = useState(false);

  // Manual Subscription Sync State
  const [manualPhone, setManualPhone] = useState('');
  const [manualStatus, setManualStatus] = useState('subscribed');

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      // Fetch subscribers (bdapps)
      const resSubs = await fetch('/api/admin/subscriptions');
      const dataSubs = await resSubs.json();
      if (dataSubs.subscriptions) {
        setSubscriptionRecords(dataSubs.subscriptions);
      }

      // Fetch users
      const resUsers = await fetch('/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.status === 'success') {
        setUsers(dataUsers.users);
      }

      // Fetch jobs
      const resJobs = await fetch('/api/admin/jobs');
      const dataJobs = await resJobs.json();
      if (dataJobs.status === 'success') {
        setJobs(dataJobs.jobs);
      }

      // Fetch logs
      const resLogs = await fetch('/api/admin/logs');
      const dataLogs = await resLogs.json();
      if (dataLogs.status === 'success') {
        setSystemLogs(dataLogs.logs);
      }

      // Fetch settings
      const resSettings = await fetch('/api/admin/settings');
      const dataSettings = await resSettings.json();
      if (dataSettings.status === 'success') {
        setSystemSettings(dataSettings.settings);
      }

      // Fetch analytics
      const resAnalytics = await fetch('/api/admin/analytics');
      const dataAnalytics = await resAnalytics.json();
      if (dataAnalytics.status === 'success') {
        setAnalyticsData(dataAnalytics.data);
      }

    } catch (e) {
      console.error('Failed to sync Super Admin Database', e);
      setErrorMessage('Critical Error: Failed to sync registry databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Trigger Callback Simulator
  const handleTriggerCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    setCbLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/bdapps/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cbPhone,
          status: cbStatus,
          eventType: cbEvent,
        }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setSuccessMessage(`SUCCESS: Callback injected. status mapping: "${cbStatus}".`);
        fetchData();
      } else {
        setErrorMessage('Error: Carrier callback simulator rejected hook.');
      }
    } catch (err) {
      setErrorMessage('Error: Connection timed out.');
    } finally {
      setCbLoading(false);
    }
  };

  // Manual Subscription Sync
  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim()) return;

    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/subscriptions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: manualPhone,
          status: manualStatus
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMessage(`SUCCESS: Subscription sync completed for ${manualPhone}.`);
        setManualPhone('');
        fetchData();
      } else {
        setErrorMessage('Failed to update subscription state.');
      }
    } catch (e) {
      setErrorMessage('Network error modifying subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update User
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/users/update/${editingUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMessage(`SUCCESS: User "${editingUser.name}" successfully updated.`);
        setEditingUser(null);
        setSelectedUser(null);
        fetchData();
      } else {
        setErrorMessage('Failed to apply user updates.');
      }
    } catch (e) {
      setErrorMessage('Connection error writing profile.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('CRITICAL: Are you sure you want to permanently delete this user account? This cannot be undone.')) return;

    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/users/delete/${userId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMessage('SUCCESS: User profile removed permanently from directory.');
        setSelectedUser(null);
        setEditingUser(null);
        fetchData();
      } else {
        setErrorMessage('Failed to delete user.');
      }
    } catch (e) {
      setErrorMessage('Network error deleting user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Job Listing
  const handleUpdateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/jobs/update/${editingJob.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJob)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMessage(`SUCCESS: Position specification for "${editingJob.title}" updated.`);
        setEditingJob(null);
        setSelectedJob(null);
        fetchData();
      } else {
        setErrorMessage('Failed to save job details.');
      }
    } catch (e) {
      setErrorMessage('Error writing to jobs directory.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Job Listing
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to retire this job post listing?')) return;

    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/jobs/delete/${jobId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMessage('SUCCESS: Job listing retired successfully.');
        setSelectedJob(null);
        setEditingJob(null);
        fetchData();
      } else {
        setErrorMessage('Could not remove job listing.');
      }
    } catch (e) {
      setErrorMessage('Network error removing job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (updates: Record<string, any>) => {
    const updatedSettings = { ...systemSettings, ...updates };
    setSystemSettings(updatedSettings);

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      setSuccessMessage('SUCCESS: System settings updated.');
    } catch (e) {
      setErrorMessage('Failed to save settings to db store.');
    }
  };

  // Filter candidates & corporate accounts
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.role || '').toLowerCase().includes(query) ||
      (u.title || '').toLowerCase().includes(query) ||
      (u.companyName || '').toLowerCase().includes(query)
    );
  });

  // Filter jobs
  const filteredJobs = jobs.filter(j => {
    const query = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(query) ||
      j.companyName.toLowerCase().includes(query) ||
      j.department.toLowerCase().includes(query) ||
      j.location.toLowerCase().includes(query)
    );
  });

  // Recharts color scheme variables
  const PIE_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[700px] animate-fade-in" id="super-admin-layout">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-64 flex flex-col gap-3">
        <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800/80 pb-4">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm line-clamp-1">{adminUser.name}</h3>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'overview', label: 'Control Tower', icon: Activity },
              { id: 'users', label: 'Users Directory', icon: Users, badge: users.length },
              { id: 'companies', label: 'Verified Partners', icon: Shield },
              { id: 'jobs', label: 'Positions Audit', icon: Briefcase, badge: jobs.length },
              { id: 'subscriptions', label: 'bdapps Carrier Sync', icon: CreditCard },
              { id: 'reports', label: 'Reconciliation Log', icon: FileText },
              { id: 'ai_logs', label: 'Gemini AI Feeds', icon: Code2 },
              { id: 'analytics', label: 'Deep Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Platform Settings', icon: Settings }
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSearchQuery('');
                    setSelectedUser(null);
                    setEditingUser(null);
                    setSelectedJob(null);
                    setEditingJob(null);
                  }}
                  id={`btn-${item.id}`}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-r from-teal-500/15 to-indigo-500/5 border-teal-500/30 text-teal-300' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-slate-900 border border-slate-800 text-slate-300 rounded font-bold font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <button 
          onClick={fetchData}
          disabled={loading}
          className="w-full bg-[#0D1117] border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Control Center</span>
        </button>
      </div>

      {/* 2. MAIN WORKING SCREEN */}
      <div className="flex-1 min-w-0">
        
        {/* Banner Status Info */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2"
              id="success-banner"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2"
              id="error-banner"
            >
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          
          {/* TAB: CONTROL TOWER (OVERVIEW) */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Header Box */}
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none">
                  <Shield className="w-48 h-48" />
                </div>
                <div>
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                    System Control Active
                  </span>
                  <h2 className="text-xl font-black text-white mt-1.5 font-display tracking-tight">
                    Super Admin Intelligent Control Tower
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete administrative reconciliation, user governance, API auditing, and billing synchronization dashboard.
                  </p>
                </div>
              </div>

              {/* Stats KPI Overview Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Registered Accounts', value: users.length, sub: 'Candidates & Companies', icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/5' },
                  { label: 'Active Jobs Broadcasted', value: jobs.length, sub: 'Direct Positions', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
                  { label: 'bdapps Robi Subscribers', value: subscriptionRecords.filter(r => r.status === 'subscribed').length, sub: 'Synchronized Carrier SIMs', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                  { label: 'AI Evaluation Audits', value: systemLogs.length, sub: 'Evaluated sandbox codes', icon: Code2, color: 'text-amber-400', bg: 'bg-amber-500/5' }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold">{stat.label}</span>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multi-Section Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Live Carrier reconciliation report */}
                <div className="lg:col-span-7 bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                      Carrier Revenue Reconciliation
                    </h3>
                    <p className="text-[10px] text-slate-500">Live projected revenue streams calculated from active daily Robi/Airtel charging cycles.</p>
                  </div>

                  <div className="py-6 space-y-4">
                    {[
                      { item: 'Daily Gross Projections', value: `${subscriptionRecords.filter(r => r.status === 'subscribed').length * systemSettings.carrierBillingFeeRate} BDT`, desc: 'Active subscription charges' },
                      { item: 'Carrier Commission (40% Cut)', value: `${subscriptionRecords.filter(r => r.status === 'subscribed').length * systemSettings.carrierBillingFeeRate * 0.4} BDT`, desc: 'Operator infrastructure deduction' },
                      { item: 'SkillHire Net Income Projections', value: `${subscriptionRecords.filter(r => r.status === 'subscribed').length * systemSettings.carrierBillingFeeRate * 0.6} BDT`, desc: 'Direct developer payout liquidity' }
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-slate-850 pb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-300">{row.item}</h4>
                          <span className="text-[10px] text-slate-500">{row.desc}</span>
                        </div>
                        <div className="text-sm font-bold text-white font-mono">{row.value}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setActiveTab('reports')} className="w-full text-center py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-teal-400 hover:text-white font-bold transition-all cursor-pointer">
                    View Complete Billing Reports
                  </button>
                </div>

                {/* System Diagnostics status */}
                <div className="lg:col-span-5 bg-[#0D1117] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      Platform Security & Diagnostics
                    </h3>
                    <p className="text-[10px] text-slate-500">Real-time indicators showing direct interface and API operational layers.</p>
                  </div>

                  <div className="py-4 space-y-3">
                    {[
                      { component: 'Gemini AI Model Node', state: 'ONLINE', icon: Sparkles, color: 'text-teal-400' },
                      { component: 'bdapps USSD/SMS Hook', state: 'ACTIVE', icon: CreditCard, color: 'text-indigo-400' },
                      { component: 'Supabase Sync Gateway', state: 'ONLINE', icon: Database, color: 'text-emerald-400' },
                      { component: 'Sandbox Execution Compiler', state: systemSettings.sandboxCompilerAllowed ? 'ALLOWED' : 'DISABLED', icon: Code2, color: systemSettings.sandboxCompilerAllowed ? 'text-teal-400' : 'text-rose-400' }
                    ].map((comp, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-950/40 rounded-xl border border-slate-900">
                        <div className="flex items-center gap-2">
                          <comp.icon className={`w-3.5 h-3.5 ${comp.color}`} />
                          <span className="text-xs text-slate-300 font-medium">{comp.component}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-bold border border-slate-800">
                          {comp.state}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setActiveTab('settings')} className="w-full text-center py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-indigo-400 hover:text-white font-bold transition-all cursor-pointer">
                    Adjust Platform Configurations
                  </button>
                </div>

              </div>

              {/* Subscriptions Callback Simulator Promo Card */}
              <div className="bg-gradient-to-r from-teal-950/20 to-indigo-950/10 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-bold font-mono">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    CARRIER SIMULATOR READY
                  </div>
                  <h3 className="font-bold text-white text-base">Test Robi/Airtel USSD & SMS Carrier Hookups</h3>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Need to mock direct subscriber callback updates or daily recurring billing charge events to test system automation triggers? Use the carrier simulator.
                  </p>
                </div>
                <button onClick={() => setActiveTab('subscriptions')} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                  <span>Open Carrier Simulator</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* TAB: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl">
                
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-400" />
                      Platform Users Directory Control
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Govern candidate profiles, modify credentials, update technical reputations, or delete accounts.</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Users List or Selected Edit */}
                {editingUser ? (
                  /* Edit User UI */
                  <form onSubmit={handleUpdateUserSubmit} className="space-y-4 max-w-xl bg-slate-950 p-6 rounded-2xl border border-slate-850">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-4">Edit User Account: {editingUser.name}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Reputation Score (0 - 1000)</label>
                        <input 
                          type="number" 
                          value={editingUser.reputationScore}
                          onChange={(e) => setEditingUser({ ...editingUser, reputationScore: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          min="0"
                          max="1000"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Role Title</label>
                        <select 
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="candidate">Candidate (Talent)</option>
                          <option value="company">Company (Employer)</option>
                          <option value="admin">Admin (System)</option>
                        </select>
                      </div>
                    </div>

                    {editingUser.role === 'company' && (
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Associated Corporate Brand</label>
                        <input 
                          type="text" 
                          value={editingUser.companyName || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, companyName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Professional Title</label>
                      <input 
                        type="text" 
                        value={editingUser.title || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Professional Biography Summary</label>
                      <textarea 
                        value={editingUser.bio || ''}
                        rows={3}
                        onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <button 
                        type="button" 
                        onClick={() => setEditingUser(null)} 
                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Apply Profile Changes'}
                      </button>
                    </div>
                  </form>
                ) : selectedUser ? (
                  /* Detail view */
                  <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{selectedUser.name}</h4>
                          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded font-mono uppercase">
                            {selectedUser.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{selectedUser.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingUser(selectedUser)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(selectedUser.id)}
                          className="p-2 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedUser(null)}
                          className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs cursor-pointer"
                        >
                          Close Profile
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-slate-500 uppercase text-[10px] block">Role Designation</strong>
                          <span>{selectedUser.title || 'Not Specified'}</span>
                        </div>
                        {selectedUser.role === 'company' && (
                          <div>
                            <strong className="text-slate-500 uppercase text-[10px] block">Associated Company</strong>
                            <span>{selectedUser.companyName || 'Not Registered'}</span>
                          </div>
                        )}
                        <div>
                          <strong className="text-slate-500 uppercase text-[10px] block">Corporate Phone State (Sync)</strong>
                          <span>{selectedUser.phone || 'No Linked SIM'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-500 uppercase text-[10px] block">Developer Reputation score</strong>
                          <span className="font-mono text-teal-400 font-bold text-sm">{selectedUser.reputationScore} / 1000</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <strong className="text-slate-500 uppercase text-[10px] block">Biographical Statement</strong>
                          <p className="leading-relaxed text-slate-400">{selectedUser.bio || 'Biography blank.'}</p>
                        </div>
                        {selectedUser.role === 'candidate' && (
                          <div>
                            <strong className="text-slate-500 uppercase text-[10px] block">Verified skills list</strong>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedUser.skills && selectedUser.skills.map((s, idx) => (
                                <span key={idx} className="bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* List table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                          <th className="py-3 px-4">Account Profile</th>
                          <th className="py-3 px-4">Role / Brand</th>
                          <th className="py-3 px-4 text-center">Reputation Index</th>
                          <th className="py-3 px-4 text-center">Linked Phone</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500">
                              No matching profiles indexed in this node.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                                    {u.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-200">{u.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div>
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    u.role === 'admin' ? 'bg-teal-500/15 text-teal-400' :
                                    u.role === 'company' ? 'bg-indigo-500/15 text-indigo-400' :
                                    'bg-slate-800 text-slate-400'
                                  }`}>
                                    {u.role}
                                  </span>
                                  {u.companyName && (
                                    <div className="text-[10px] text-slate-400 mt-1">{u.companyName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="font-mono font-bold text-teal-400">{u.reputationScore}</span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono text-[10px] text-slate-400">
                                {u.phone || '—'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button 
                                    onClick={() => setSelectedUser(u)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                    title="View full detail profile"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingUser(u)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                    title="Edit profile settings"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  {u.id !== adminUser.id && (
                                    <button 
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-1.5 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                                      title="Delete user profile"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: VERIFIED PARTNERS (COMPANIES) */}
          {activeTab === 'companies' && (
            <motion.div 
              key="companies"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl">
                <div className="border-b border-slate-800/80 pb-5 mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-teal-400" />
                    Corporate Partners & Employers Hub
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspect, audit and adjust reputation scores for company accounts registered to post jobs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.filter(u => u.role === 'company').length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-6">No company partner profiles verified yet.</p>
                  ) : (
                    users.filter(u => u.role === 'company').map((comp) => (
                      <div key={comp.id} className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col justify-between hover:border-slate-750 transition-all">
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                                {comp.companyName || 'Corporate Entity'}
                                <span className="inline-block h-3.5 w-3.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] rounded flex items-center justify-center">✔</span>
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Recruiter: {comp.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 font-mono uppercase block">Corporate Index</span>
                              <span className="font-mono text-xs font-bold text-teal-400">{comp.reputationScore} reputation</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed italic border-l border-slate-800 pl-3">
                            "{comp.bio || 'Hiring active talent for advanced products.'}"
                          </p>

                          <div className="text-[10px] text-slate-500 flex items-center gap-3 pt-2">
                            <span>Jobs Listed: <strong className="text-slate-300 font-mono">{jobs.filter(j => j.companyId === comp.id).length} positions</strong></span>
                            <span>•</span>
                            <span>Contact: <strong className="text-slate-300 font-mono">{comp.email}</strong></span>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-900">
                          <button 
                            onClick={() => {
                              const newRep = window.prompt(`Update reputation index for ${comp.companyName || 'this company'} (0-1000):`, String(comp.reputationScore));
                              if (newRep !== null) {
                                const parsed = parseInt(newRep);
                                if (!isNaN(parsed)) {
                                  setEditingUser({ ...comp, reputationScore: parsed });
                                  // Trigger mock submit to instantly apply
                                  setActionLoading(true);
                                  fetch(`/api/admin/users/update/${comp.id}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...comp, reputationScore: parsed })
                                  })
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data.status === 'success') {
                                      setSuccessMessage(`SUCCESS: Corporate reputation index updated to ${parsed}.`);
                                      fetchData();
                                    }
                                  })
                                  .finally(() => setActionLoading(false));
                                }
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Recalculate reputation
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(comp);
                              setActiveTab('users');
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Inspect details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: POSITIONS AUDIT (JOBS) */}
          {activeTab === 'jobs' && (
            <motion.div 
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      Active Job Positions Verification Audit
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Verify specifications for jobs listed across SkillHire, or retire obsolete listings.</p>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search active jobs..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {editingJob ? (
                  /* Edit Job UI */
                  <form onSubmit={handleUpdateJobSubmit} className="space-y-4 max-w-xl bg-slate-950 p-6 rounded-2xl border border-slate-850">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Edit Position: {editingJob.title}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Job Title</label>
                        <input 
                          type="text" 
                          value={editingJob.title}
                          onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Brand Publisher</label>
                        <input 
                          type="text" 
                          value={editingJob.companyName}
                          disabled
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Location Scheme</label>
                        <input 
                          type="text" 
                          value={editingJob.location}
                          onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Salary scale</label>
                        <input 
                          type="text" 
                          value={editingJob.salaryRange}
                          onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Job Description specifications</label>
                      <textarea 
                        value={editingJob.description}
                        rows={4}
                        onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <button 
                        type="button" 
                        onClick={() => setEditingJob(null)} 
                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Specifications'}
                      </button>
                    </div>
                  </form>
                ) : selectedJob ? (
                  /* Job detail preview */
                  <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                      <div>
                        <h4 className="font-bold text-white text-base">{selectedJob.title}</h4>
                        <span className="text-[10px] text-slate-500 mt-1 block">Publisher: <strong>{selectedJob.companyName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingJob(selectedJob)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteJob(selectedJob.id)}
                          className="p-2 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 rounded-xl text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedJob(null)}
                          className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs cursor-pointer"
                        >
                          Close Listing
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs text-slate-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-slate-500 uppercase text-[10px] block">Location format</strong>
                          <span>{selectedJob.location}</span>
                        </div>
                        <div>
                          <strong className="text-slate-500 uppercase text-[10px] block">Salary scale</strong>
                          <span className="text-teal-400 font-bold font-mono">{selectedJob.salaryRange}</span>
                        </div>
                      </div>

                      <div>
                        <strong className="text-slate-500 uppercase text-[10px] block mb-1">Core Position specifications</strong>
                        <p className="leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-900 text-slate-400">
                          {selectedJob.description}
                        </p>
                      </div>

                      <div>
                        <strong className="text-slate-500 uppercase text-[10px] block mb-1.5">Desired verified skills</strong>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedJob.skillsRequired && selectedJob.skillsRequired.map((s, idx) => (
                            <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Job listings table */
                  <div className="space-y-4">
                    {filteredJobs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-6 text-center">No active listings registered in database.</p>
                    ) : (
                      filteredJobs.map((j) => (
                        <div key={j.id} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-750 transition-all">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-bold text-white text-sm">{j.title}</h4>
                              <span className="text-[10px] text-slate-400 font-medium">{j.companyName} • <span className="font-mono text-slate-500">{j.department}</span></span>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                              <span>Location: <strong className="text-slate-400 font-sans">{j.location}</strong></span>
                              <span>•</span>
                              <span>Salary: <strong className="text-teal-400 font-mono">{j.salaryRange}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedJob(j)}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Audit specifications
                            </button>
                            <button 
                              onClick={() => setEditingJob(j)}
                              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteJob(j.id)}
                              className="p-2 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 rounded-xl text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB: bdapps CARRIER SYNC */}
          {activeTab === 'subscriptions' && (
            <motion.div 
              key="subscriptions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Simulator Grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* bdapps Simulator Form */}
                <div className="lg:col-span-5 bg-[#0D1117] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-teal-400 animate-pulse" />
                      <h3 className="font-bold text-white font-display text-xs uppercase tracking-wide">
                        bdapps Carrier Callback Simulator
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Simulate the external Robi/Airtel server requests (callbacks) to SkillHire AI system to verify automated credential upgrades or daily charge success logs.
                    </p>

                    <form onSubmit={handleTriggerCallback} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
                          Mock Subscriber Mobile (Robi/Airtel)
                        </label>
                        <input
                          type="text"
                          value={cbPhone}
                          onChange={(e) => setCbPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
                          Carrier billing Event Type
                        </label>
                        <select
                          value={cbEvent}
                          onChange={(e) => setCbEvent(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="renewed">Daily Auto-Renewal (Charge Success)</option>
                          <option value="failure">Billing Refusal (Out of Balance)</option>
                          <option value="unsubscribed">Voluntary Subscriber Cancel</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
                          System Subscription State Map
                        </label>
                        <select
                          value={cbStatus}
                          onChange={(e) => setCbStatus(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="active">Active (Premium access granted)</option>
                          <option value="suspended">Suspended (Out of balance)</option>
                          <option value="unsubscribed">Unsubscribed (Access revoked)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={cbLoading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {cbLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Inject Carrier Webhook Callback'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Subscriber sync on demand list */}
                <div className="lg:col-span-7 bg-[#0D1117] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-bold text-white font-display text-xs uppercase tracking-wide">
                          Manual Sync & Active Registry
                        </h3>
                      </div>
                    </div>

                    {/* Manual addition form */}
                    <div className="p-5 border-b border-slate-850/80 bg-slate-950/30">
                      <form onSubmit={handleManualSync} className="flex flex-col md:flex-row gap-3 text-xs">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Add Robi phone e.g. 88018XXXXXXXX..." 
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-white focus:outline-none"
                          />
                        </div>
                        <div className="w-full md:w-36">
                          <select 
                            value={manualStatus}
                            onChange={(e) => setManualStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                          >
                            <option value="subscribed">Subscribed</option>
                            <option value="unsubscribed">Revoked</option>
                          </select>
                        </div>
                        <button 
                          type="submit" 
                          disabled={actionLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl cursor-pointer py-2.5 flex items-center gap-1"
                        >
                          {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>Sync</span>
                        </button>
                      </form>
                    </div>

                    <div className="p-5">
                      <div className="overflow-y-auto max-h-[250px]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-500 uppercase text-[9px] tracking-widest">
                              <th className="py-2">Phone</th>
                              <th className="py-2">User details</th>
                              <th className="py-2">Status Badge</th>
                              <th className="py-2 text-right">Modified</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {subscriptionRecords.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500">
                                  No premium carrier records registered.
                                </td>
                              </tr>
                            ) : (
                              subscriptionRecords.map((rec, i) => (
                                <tr key={i} className="hover:bg-slate-950/20 text-[11px]">
                                  <td className="py-2.5 font-mono text-white">{rec.phone}</td>
                                  <td className="py-2.5">
                                    <div className="font-semibold text-slate-300">{rec.userName}</div>
                                    <div className="text-[9px] text-slate-500 font-mono">{rec.userEmail}</div>
                                  </td>
                                  <td className="py-2.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      rec.status === 'subscribed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                      {rec.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-[9px] text-slate-500">{rec.date}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-850 flex justify-between items-center text-[10px] text-slate-500">
                    <span>bdapps sandbox compiler connected</span>
                    <span className="text-teal-400 flex items-center gap-1">● Active State</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: RECONCILIATION LOG (REPORTS) */}
          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Detailed Projections Report Card */}
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-400" />
                    Daily Carrier Billing Financial Projections
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Reconciliation projections based on daily 3 BDT charge rates mapped across all Robi/Airtel profiles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Weekly Gross projection', value: `${subscriptionRecords.filter(r => r.status === 'subscribed').length * systemSettings.carrierBillingFeeRate * 7} BDT`, rate: 'Based on active subscriber count' },
                    { label: 'Monthly Gross projection', value: `${subscriptionRecords.filter(r => r.status === 'subscribed').length * systemSettings.carrierBillingFeeRate * 30} BDT`, rate: 'Computed for standard billing month' },
                    { label: 'Annualized Gross projection', value: `${subscriptionRecords.filter(r => r.status === 'subscribed').length * systemSettings.carrierBillingFeeRate * 365} BDT`, rate: 'Based on 100% renewal consistency' }
                  ].map((rep, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{rep.label}</span>
                      <div className="my-3">
                        <span className="text-xl font-black text-teal-400 font-mono">{rep.value}</span>
                      </div>
                      <span className="text-[9px] text-slate-500">{rep.rate}</span>
                    </div>
                  ))}
                </div>

                {/* Candidate matching audits */}
                <div className="space-y-3 pt-4 border-t border-slate-850">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Candidate Quality Matching Audit</h4>
                  <p className="text-xs text-slate-400">Aggregated ATS rating states mapping candidates matching capability indexes across SkillHire platform.</p>

                  <div className="overflow-x-auto bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-500 font-semibold text-[10px] uppercase">
                          <th className="py-2">Skill Area</th>
                          <th className="py-2 text-center">Avg Graded Score</th>
                          <th className="py-2 text-center">Badges Issued</th>
                          <th className="py-2 text-right">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-[11px] text-slate-300">
                        {[
                          { skill: 'React Development', score: '91%', badges: 4, state: 'STABLE' },
                          { skill: 'TypeScript Systems', score: '87%', badges: 3, state: 'STABLE' },
                          { skill: 'Full Stack Node.js', score: '84%', badges: 2, state: 'OPTIMAL' },
                          { skill: 'CSS / Fluid Layouts', score: '81%', badges: 1, state: 'OPTIMAL' }
                        ].map((row, i) => (
                          <tr key={i}>
                            <td className="py-3 font-semibold text-slate-200">{row.skill}</td>
                            <td className="py-3 text-center text-teal-400 font-bold font-mono">{row.score}</td>
                            <td className="py-3 text-center font-mono">{row.badges} issued</td>
                            <td className="py-3 text-right"><span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">{row.state}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: AI LOGS (GEMINI LOGS) */}
          {activeTab === 'ai_logs' && (
            <motion.div 
              key="ai_logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl">
                <div className="border-b border-slate-800/80 pb-5 mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4.5 h-4.5 text-teal-400 animate-pulse" />
                    Gemini AI Prompt & Evaluation Transcript Feeds
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Real-time transcripts of coding tests, technical submissions, and mock interview answers processed by Gemini API.</p>
                </div>

                <div className="space-y-4">
                  {systemLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No AI evaluation transcripts recorded yet.</p>
                  ) : (
                    systemLogs.map((log) => (
                      <div key={log.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl hover:border-slate-750 transition-all">
                        <div className="flex justify-between items-start border-b border-slate-900 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                log.type === 'AI Coding Sandbox' ? 'bg-teal-500/10 text-teal-400' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {log.type}
                              </span>
                              <h4 className="font-bold text-slate-200 text-xs">{log.target}</h4>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Candidate: <strong>{log.user}</strong></span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block uppercase">Graded score</span>
                            <span className="font-mono text-sm font-bold text-teal-400">{log.score}%</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs">
                          <strong className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">AI Evaluator assessment feed</strong>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900/80 leading-relaxed font-mono text-[10px] text-slate-400 whitespace-pre-wrap">
                            {log.details}
                          </div>
                        </div>

                        <div className="mt-2 text-right text-[9px] text-slate-500 font-mono">
                          Generated via @google/genai • {log.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: DEEP ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {analyticsData ? (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Totals banner row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: 'Registered accounts', v: analyticsData.totals.users, c: 'text-teal-400' },
                      { l: 'Active positions list', v: analyticsData.totals.jobs, c: 'text-indigo-400' },
                      { l: 'Synchronized Subscriber numbers', v: analyticsData.totals.subscriptions, c: 'text-emerald-400' },
                      { l: 'Sandbox compiler runs', v: analyticsData.totals.submissions, c: 'text-amber-400' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#0D1117] border border-slate-800 p-4 rounded-xl text-center">
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase">{stat.l}</span>
                        <span className={`text-2xl font-black ${stat.c} font-mono mt-1 block`}>{stat.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recharts visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* User Distribution BarChart */}
                    <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Candidate vs. Employer registration</h4>
                        <span className="text-[10px] text-slate-500 block">Relative ratio of software talent vs active corporate brands.</span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.userDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937', borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="#14b8a6">
                              {analyticsData.userDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Subscription States PieChart */}
                    <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Robi/Airtel Subscriptions status</h4>
                        <span className="text-[10px] text-slate-500 block">Synchronized billing state segments from carrier callback feeds.</span>
                      </div>
                      <div className="h-64 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analyticsData.subStates}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {analyticsData.subStates.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937', borderRadius: '8px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top verified skills BarChart */}
                    <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl space-y-4 lg:col-span-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top verified skills in talent pools</h4>
                        <span className="text-[10px] text-slate-500 block">Highest density verified skills listed on active candidate passports.</span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.skills}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937', borderRadius: '8px' }} />
                            <Bar dataKey="value" fill="#6366f1" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  Generating deep visual analytics...
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6"
            >
              <div className="mb-6 pb-4 border-b border-slate-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Super Admin platform settings
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure global operational parameters and Gemini evaluation strictly.</p>
              </div>

              <div className="space-y-6 max-w-xl text-xs">
                
                {/* 1. Maintenance mode toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Global System Maintenance Mode</h4>
                    <span className="text-[10px] text-slate-500 block">Force temporary lock on candidate assessments for system audits.</span>
                  </div>
                  <button 
                    onClick={() => handleSaveSettings({ maintenanceMode: !systemSettings.maintenanceMode })}
                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                      systemSettings.maintenanceMode ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {systemSettings.maintenanceMode ? 'ENABLED (LOCKED)' : 'OFF (OPERATIONAL)'}
                  </button>
                </div>

                {/* 2. Strict evaluation model */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Gemini AI strictness evaluation</h4>
                    <span className="text-[10px] text-slate-500 block">Turn on strict code validations and severe rating rubrics on sandboxes.</span>
                  </div>
                  <button 
                    onClick={() => handleSaveSettings({ aiStrictEval: !systemSettings.aiStrictEval })}
                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                      systemSettings.aiStrictEval ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {systemSettings.aiStrictEval ? 'STRICT EVAL' : 'CREATIVE EVAL'}
                  </button>
                </div>

                {/* 3. Allow compiler runs */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Candidate Sandbox compilation</h4>
                    <span className="text-[10px] text-slate-500 block">Allow candidates to execute test cases on integrated code challenges.</span>
                  </div>
                  <button 
                    onClick={() => handleSaveSettings({ sandboxCompilerAllowed: !systemSettings.sandboxCompilerAllowed })}
                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                      systemSettings.sandboxCompilerAllowed ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {systemSettings.sandboxCompilerAllowed ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>

                {/* 4. Carrier rate config */}
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 space-y-3">
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Carrier billing charge parameters</h4>
                    <span className="text-[10px] text-slate-500 block">Adjust the simulated daily tariff deducted from synchronized carrier SIM accounts.</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={systemSettings.carrierBillingFeeRate}
                      onChange={(e) => handleSaveSettings({ carrierBillingFeeRate: parseInt(e.target.value) || 0 })}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-teal-500 w-24 text-center"
                      min="1"
                      max="50"
                    />
                    <span className="self-center font-semibold text-slate-400 font-mono">BDT per day (Robi/Airtel standard)</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}
