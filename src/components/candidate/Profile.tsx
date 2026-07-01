import React, { useState } from 'react';
import { User, FileText, Sparkles, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileProps {
  user: UserProfile;
  onUpdateSuccess: (updatedUser: UserProfile) => void;
}

export default function Profile({ user, onUpdateSuccess }: ProfileProps) {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title || '');
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || '');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch(`/api/auth/update/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          bio,
          skills,
          githubUrl,
          portfolioUrl
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess(true);
        onUpdateSuccess(data.user);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('A connection error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto space-y-6">
      
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-lg font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
          <User className="w-5 h-5 text-teal-400" />
          Edit Professional Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Keep your career profile updated. This information directly synchronizes with your verified Skill Passport and job matching evaluations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Your profile details and skill settings have been successfully synchronized with Supabase SQL database.
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {/* Name and Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rahat Islam"
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Job Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>
        </div>

        {/* GitHub and Portfolio URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              GitHub URL <span className="text-indigo-400">(Reputation Boost)</span>
            </label>
            <input 
              type="url" 
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              placeholder="e.g. https://github.com/username"
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Portfolio URL <span className="text-teal-400">(Reputation Boost)</span>
            </label>
            <input 
              type="url" 
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="e.g. https://myportfolio.dev"
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Professional Bio / Profile Pitch</label>
          <textarea 
            rows={4}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Introduce yourself to recruiters, highlight your major tech stack, and state your professional goal..."
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2.5 rounded-lg outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Skills Tag Management */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Core Skill Inventory</label>
            <span className="text-[10px] text-slate-500 italic mt-0.5 block">These skills will form the basis of your AI career assessments.</span>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl">
            {skills.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic">No skills added yet. Insert below to expand your tag inventory.</span>
            ) : (
              skills.map(s => (
                <span 
                  key={s} 
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 pl-2.5 pr-1.5 py-1 rounded"
                >
                  {s}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSkill(s)}
                    className="text-indigo-400 hover:text-white hover:bg-indigo-500/20 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Skill Field */}
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
              placeholder="e.g. Docker, Python, GCP"
              className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-teal-500 text-slate-200 text-xs px-4 py-2 rounded-lg outline-none transition-colors"
            />
            <button 
              type="button" 
              onClick={handleAddSkill}
              className="px-3.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800/80 flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-teal-500/10 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                Saving Profile...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950/20" />
                Save & Sync
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
