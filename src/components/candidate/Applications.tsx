import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Briefcase, 
  Award, 
  Loader2, 
  Sparkles, 
  Building, 
  MapPin, 
  DollarSign, 
  Activity,
  Search,
  Bookmark,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import { UserProfile, JobPost } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface ApplicationsProps {
  user: UserProfile;
  applications: any[];
  onApplySuccess: () => void;
}

export default function Applications({ user, applications, onApplySuccess }: ApplicationsProps) {
  const { setCurrentUser } = useAppStore();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  // Job detail / Apply State
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [resumeText, setResumeText] = useState(user.bio || '');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedLoc, setSelectedLoc] = useState('All');
  const [selectedSalary, setSelectedSalary] = useState('All');
  const [feedTab, setFeedTab] = useState<'all' | 'saved'>('all');

  // Fetch job list from server
  useEffect(() => {
    setLoadingJobs(true);
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.jobs) {
          setJobs(data.jobs);
        }
      })
      .catch(err => console.error('Failed to load jobs', err))
      .finally(() => setLoadingJobs(false));
  }, []);

  // Sync state when bio changes or a different job is selected
  useEffect(() => {
    if (selectedJob) {
      setResumeText(user.bio || '');
    }
  }, [selectedJob, user.bio]);

  // Handle Save/Unsave bookmark toggle (Optimistic Sync to Supabase & db_store.json)
  const handleToggleSaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card details expansion if applied
    const savedJobsList = user.savedJobs || [];
    const isSaved = savedJobsList.includes(jobId);
    let updatedSavedJobs: string[];

    if (isSaved) {
      updatedSavedJobs = savedJobsList.filter(id => id !== jobId);
    } else {
      updatedSavedJobs = [...savedJobsList, jobId];
    }

    // Optimistically update globally & in localStorage
    setCurrentUser({
      ...user,
      savedJobs: updatedSavedJobs
    });

    try {
      const res = await fetch(`/api/auth/update/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedJobs: updatedSavedJobs })
      });
      const data = await res.json();
      if (data.status !== 'success') {
        console.error('Failed to update saved jobs on database. Reverting...');
        setCurrentUser({
          ...user,
          savedJobs: savedJobsList
        });
      }
    } catch (err) {
      console.error('Network sync error for saved job toggle. Reverting...', err);
      setCurrentUser({
        ...user,
        savedJobs: savedJobsList
      });
    }
  };

  // Submit Application
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setApplying(true);
    setError(null);
    setApplySuccess(false);

    try {
      const res = await fetch(`/api/candidates/${user.id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          resumeText
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setApplySuccess(true);
        onApplySuccess();
        setTimeout(() => {
          setApplySuccess(false);
          setSelectedJob(null);
        }, 2500);
      } else {
        setError(data.message || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please check network.');
    } finally {
      setApplying(false);
    }
  };

  // Get dynamic unique departments
  const uniqueDepartments = ['All', ...Array.from(new Set(jobs.map(j => j.department).filter(Boolean)))];

  // Filters logic
  const filteredJobs = jobs.filter(job => {
    // Keyword search match
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.skillsRequired && job.skillsRequired.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));

    // Department match
    const matchesDept = selectedDept === 'All' || job.department === selectedDept;

    // Location match
    const matchesLoc = selectedLoc === 'All' || 
      (selectedLoc === 'Remote' && job.location.toLowerCase().includes('remote')) ||
      (selectedLoc === 'On-site' && !job.location.toLowerCase().includes('remote') && !job.location.toLowerCase().includes('hybrid')) ||
      (selectedLoc === 'Hybrid' && job.location.toLowerCase().includes('hybrid'));

    // Salary range match
    let matchesSalary = true;
    if (selectedSalary !== 'All') {
      const sal = job.salaryRange.toLowerCase();
      if (selectedSalary === '150k+') {
        matchesSalary = sal.includes('15') || sal.includes('16') || sal.includes('17') || sal.includes('18') || sal.includes('19') || sal.includes('20') || sal.includes('140');
      } else if (selectedSalary === '100k+') {
        matchesSalary = sal.includes('10') || sal.includes('11') || sal.includes('12') || sal.includes('13') || sal.includes('14') || sal.includes('15') || sal.includes('16');
      } else if (selectedSalary === 'Negotiable') {
        matchesSalary = sal.includes('negotiable') || sal.includes('disclose') || sal.includes('tbd');
      }
    }

    // Saved state feed toggle
    const matchesFeedTab = feedTab === 'all' || (user.savedJobs || []).includes(job.id);

    return matchesSearch && matchesDept && matchesLoc && matchesSalary && matchesFeedTab;
  });

  const savedCount = jobs.filter(j => (user.savedJobs || []).includes(j.id)).length;

  return (
    <div className="space-y-8 animate-fade-in" id="job-applications-module">
      
      {/* Dynamic Intro Banner */}
      <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
        <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-teal-400" />
          Job Dispatch & AI ATS Matching
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Explore top-tier technical roles. Save positions to apply later, perform instant keyword-rich AI ATS evaluations, and synchronize directly with hiring partner queues configured in Supabase.
        </p>
      </div>

      {/* Main Filter Control Station */}
      <div className="bg-[#0D1117] border border-slate-800/80 p-4 rounded-xl shadow-md space-y-4">
        
        {/* Search Input and View Toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, company, requirements, or skills..."
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-lg outline-none transition-colors font-sans"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Feed View Tabs */}
          <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-lg shrink-0 select-none">
            <button
              onClick={() => setFeedTab('all')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                feedTab === 'all' 
                  ? 'bg-slate-850 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Open Positions ({jobs.length})
            </button>
            <button
              onClick={() => setFeedTab('saved')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                feedTab === 'saved' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${feedTab === 'saved' ? 'fill-teal-400/20' : ''}`} />
              Saved ({savedCount})
            </button>
          </div>
        </div>

        {/* Extended Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-900">
          
          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Department</label>
            <div className="relative">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none transition-all cursor-pointer appearance-none"
              >
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'All' ? '💼 All Departments' : dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Work Location</label>
            <div className="relative">
              <select
                value={selectedLoc}
                onChange={e => setSelectedLoc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="All">🌍 All Locations</option>
                <option value="Remote">🌐 Remote Preferred</option>
                <option value="Hybrid">🤝 Hybrid</option>
                <option value="On-site">🏢 On-site Only</option>
              </select>
            </div>
          </div>

          {/* Salary Bucket Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Compensation</label>
            <div className="relative">
              <select
                value={selectedSalary}
                onChange={e => setSelectedSalary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="All">💵 All Salaries</option>
                <option value="100k+">💰 $100,000+ USD</option>
                <option value="150k+">💎 $150,000+ USD</option>
                <option value="Negotiable">🤝 Negotiable</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Job Feed listing or Application Process */}
        <div className="lg:col-span-7 space-y-6">
          
          {selectedJob ? (
            /* Selected Position / Application Form */
            <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-fade-in">
              <div className="pb-4 border-b border-slate-800 flex justify-between items-start gap-4">
                <div>
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="text-[10px] text-teal-400 hover:text-white font-bold font-mono tracking-wider uppercase cursor-pointer"
                  >
                    ← Back to Jobs list
                  </button>
                  <h3 className="font-extrabold text-base text-white mt-2 leading-tight">Apply for {selectedJob.title}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 font-semibold mt-1">
                    <span className="text-teal-400 font-mono">{selectedJob.companyName}</span>
                    <span className="text-slate-600">•</span>
                    <span>{selectedJob.location}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-indigo-400">{selectedJob.salaryRange}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleToggleSaveJob(selectedJob.id, e)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    (user.savedJobs || []).includes(selectedJob.id)
                      ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                      : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-teal-400'
                  }`}
                  title={(user.savedJobs || []).includes(selectedJob.id) ? "Saved Position" : "Save Position"}
                >
                  <Bookmark className={`w-4 h-4 ${(user.savedJobs || []).includes(selectedJob.id) ? 'fill-teal-400' : ''}`} />
                </button>
              </div>

              {/* Job Requirements Description */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Position Context</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedJob.description}
                </p>

                {selectedJob.difficultyLevel && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    <span>AI Evaluated Level:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                      selectedJob.difficultyLevel === 'Advanced' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                      selectedJob.difficultyLevel === 'Beginner' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}>
                      {selectedJob.difficultyLevel}
                    </span>
                  </div>
                )}

                {selectedJob.requiredSkillsList && selectedJob.requiredSkillsList.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Required Skills (Mandatory)</h5>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedJob.requiredSkillsList.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-900 border border-slate-850 text-slate-300 px-2 py-0.5 rounded">
                          {i + 1}. {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.optionalSkillsList && selectedJob.optionalSkillsList.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Optional Skills (Advantageous)</h5>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedJob.optionalSkillsList.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-900 border border-slate-850 text-slate-400 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.skillMatrix && selectedJob.skillMatrix.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Skill Matrix Mapping</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {selectedJob.skillMatrix.map((item, idx) => (
                        <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white font-mono block">{item.skill}</span>
                            <span className="text-[9px] text-slate-500 mt-0.5">{item.category} • Depth: {item.proficiency}</span>
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

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minimum Requirements</h5>
                    <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                      {selectedJob.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {applySuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Your job application with custom ATS scan scoring has been filed and registered.
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between items-center">
                      <span>Paste Resume Pitch or Bio Text</span>
                      <span className="text-slate-500 font-mono font-medium lowercase">ATS matching will evaluate against skills required</span>
                    </label>
                    <textarea 
                      rows={6}
                      required
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      placeholder="Input your professional overview, recent projects, and target skill list here. This triggers a server-side Gemini ATS comparison evaluation."
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-750 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors resize-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
                    <button 
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="px-4 py-2 border border-slate-800 bg-slate-950/20 hover:bg-slate-900/40 text-slate-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
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
                          <Send className="w-3.5 h-3.5 fill-slate-950/15" />
                          File Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Position Feed List */
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/60">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {feedTab === 'all' ? 'Active Job Recommendations' : 'Your Saved Positions'} ({filteredJobs.length})
                </h4>
                {searchTerm || selectedDept !== 'All' || selectedLoc !== 'All' || selectedSalary !== 'All' ? (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDept('All');
                      setSelectedLoc('All');
                      setSelectedSalary('All');
                    }}
                    className="text-[10px] font-bold font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Clear Filter Overrides
                  </button>
                ) : null}
              </div>

              {loadingJobs ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-400" />
                  <p className="text-xs">Scanning hiring partners...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80 text-center text-slate-500 text-xs italic">
                  {feedTab === 'saved' 
                    ? "You haven't saved any jobs matching current parameters yet. Hover over stars to save positions!"
                    : "No jobs found matching your specified search and filter criteria."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => {
                    const alreadyApplied = applications.some(app => app.job_id === job.id);
                    const isSaved = (user.savedJobs || []).includes(job.id);
                    return (
                      <div 
                        key={job.id} 
                        onClick={() => setSelectedJob(job)}
                        className="bg-[#0D1117] border border-slate-850/80 hover:border-slate-800 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer group space-y-4 relative"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase">
                                {job.department || 'Engineering'}
                              </span>
                              {job.location.toLowerCase().includes('remote') && (
                                <span className="text-[9px] font-mono font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full uppercase">
                                  Remote
                                </span>
                              )}
                              {job.difficultyLevel && (
                                <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded-full uppercase ${
                                  job.difficultyLevel === 'Advanced' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' :
                                  job.difficultyLevel === 'Beginner' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                                  'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                }`}>
                                  {job.difficultyLevel}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-sm text-white mt-1.5 group-hover:text-teal-400 transition-colors">{job.title}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-semibold mt-1">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Building className="w-3 h-3 text-slate-600" /> {job.companyName}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-600" /> {job.location || 'Remote'}
                              </span>
                              <span className="flex items-center gap-1 text-teal-400 font-mono">
                                <DollarSign className="w-3 h-3 text-slate-600" /> {job.salaryRange || 'Negotiable'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Save toggle button */}
                            <button
                              onClick={(e) => handleToggleSaveJob(job.id, e)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isSaved 
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                                  : 'bg-slate-950/40 border-slate-900 text-slate-600 hover:text-teal-400 hover:border-teal-500/20'
                              }`}
                              title={isSaved ? "Unsave Position" : "Save Position"}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-400' : ''}`} />
                            </button>

                            {alreadyApplied ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg shrink-0">
                                Applied
                              </span>
                            ) : (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500 hover:text-slate-950 text-teal-400 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                              >
                                Apply Now
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description Preview snippet */}
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {job.description}
                        </p>

                        {/* Required skills inventory */}
                        {job.skillsRequired && job.skillsRequired.length > 0 && (
                          <div className="pt-3 border-t border-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-1">Required:</span>
                            {job.skillsRequired.map(sk => (
                              <span key={sk} className="text-[9px] font-mono bg-slate-950 border border-slate-850 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Submitted applications status */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-800/60">
            Filed Applications & History
          </h4>

          {applications.length === 0 ? (
            <div className="p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80 text-center text-slate-500 text-xs italic">
              No applications submitted yet. Browse open jobs on the left to start!
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {applications.map((app) => (
                <div key={app.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3.5 shadow-md hover:border-slate-800 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-white leading-snug">{app.job_title}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{app.company_name}</p>
                    </div>
                    <span className={`text-[9px] font-mono font-black border px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                      app.status === 'accepted' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : app.status === 'rejected' 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                        : app.status === 'interviewing' 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : app.status === 'reviewing' 
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                        : 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400'
                    }`}>
                      {app.status || 'Applied'}
                    </span>
                  </div>

                  {/* ATS Matching score progress bar */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-900">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">ATS COMPLIANCE INDEX</span>
                      <span className="text-teal-400 font-extrabold">{app.score}% MATCH</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400" style={{ width: `${app.score || 0}%` }} />
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {app.feedback && (
                    <div className="p-2.5 bg-[#0D1117]/80 rounded-lg border border-slate-900 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <p className="text-[8px] font-mono font-bold text-indigo-400 tracking-wider uppercase">AI ATS Recommendation</p>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-sans italic">
                        "{app.feedback}"
                      </p>
                    </div>
                  )}

                  {/* Applied date */}
                  {app.created_at && (
                    <div className="text-[8px] font-mono text-slate-600 text-right uppercase">
                      Submittal date: {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
