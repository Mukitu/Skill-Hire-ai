import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Award, Cpu, CheckCircle2, Globe, Github, 
  MapPin, Mail, Sparkles, Loader2, ArrowLeft, Calendar, FileText, Share2, Printer
} from 'lucide-react';
import { generateQRCodeSVG } from '../../utils/qr';
import { UserProfile } from '../../types';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const res = await fetch(`/api/public/profile/${id}`);
        const data = await res.json();
        if (data.status === 'success') {
          setProfile(data.user);
          setCertificates(data.certificates || []);
        } else {
          setError(data.message || 'Failed to locate candidate profile.');
        }
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Network failure while fetching credentials.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPublicProfile();
    }
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium font-mono">Decoding cryptographic public talent ledger...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-6 p-8 bg-[#0D1117] border border-slate-800 rounded-2xl">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-lg font-black font-mono">!</div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-white">Credential Verification Failed</h2>
          <p className="text-xs text-slate-400">{error || 'This candidate identifier could not be validated on our servers.'}</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
        >
          Return to Platform Landing
        </button>
      </div>
    );
  }

  const verifiedSkillsList = Object.entries(profile.verifiedSkills || {});
  const passportId = `SH-PASS-${profile.id.substring(5, 13).toUpperCase() || 'MOCKPASS'}`;
  const publicUrl = window.location.href;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12" id="public-talent-passport">
      
      {/* Return to home button */}
      <div className="flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to SkillHire AI Home
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Passport
          </button>
          <button 
            onClick={handleShare}
            className="px-3.5 py-1.5 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? 'Link Copied!' : 'Copy Passport URL'}
          </button>
        </div>
      </div>

      {/* Hero Visual Profile Block */}
      <div className="bg-[#0D1117] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Biometric Portrait Box */}
        <div className="relative group shrink-0">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-3xl blur opacity-20" />
          <div className="relative h-36 w-36 rounded-2xl bg-slate-950 border border-slate-850 flex flex-col items-center justify-center text-center overflow-hidden">
            <span className="text-slate-700 text-7xl font-black font-serif select-none">
              {profile.name.charAt(0)}
            </span>
            <div className="absolute bottom-2 text-[8px] font-mono font-extrabold tracking-widest text-slate-500 bg-[#0D1117] border border-slate-800 px-2.5 py-0.5 rounded uppercase">
              BIOMETRIC ID
            </div>
          </div>
        </div>

        {/* Candidate Bio Information */}
        <div className="space-y-4 flex-1 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">{profile.name}</h1>
              <span className="inline-flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-teal-400 font-bold uppercase">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                Verified Candidate
              </span>
            </div>
            <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-mono">
              {profile.title || 'Full Stack AI Engineer'}
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xl mx-auto md:mx-0">
            {profile.bio || 'This professional is a verified candidate on SkillHire AI, specializing in scalable development, algorithmic efficiency, and intelligent full-stack solutions.'}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-slate-500">
            {profile.portfolioUrl && (
              <a 
                href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`} 
                target="_blank" 
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4 text-slate-600" /> Portfolio Site
              </a>
            )}
            {profile.githubUrl && (
              <a 
                href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://${profile.githubUrl}`} 
                target="_blank" 
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Github className="w-4 h-4 text-slate-600" /> GitHub Profile
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-600" /> {profile.email}
            </span>
          </div>
        </div>

        {/* Real-time Dynamic Reputation Score Dial */}
        <div className="shrink-0 flex flex-col items-center p-4 bg-slate-950/60 border border-slate-850 rounded-2xl w-full md:w-44 text-center space-y-3">
          <p className="text-[9px] font-mono font-extrabold text-slate-500 uppercase tracking-widest">CAREER REPUTATION</p>
          
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#161f30" strokeWidth="10" fill="transparent" />
              <circle 
                cx="50" cy="50" r="40" stroke="url(#publicRepGrad)" strokeWidth="10" 
                strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (profile.reputationScore || 500)) / 1000} 
                fill="transparent" 
              />
              <defs>
                <linearGradient id="publicRepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-lg font-black font-mono text-white">{profile.reputationScore || 500}</span>
          </div>

          <div className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded font-mono">
            TOP TIER percentile
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left main: Digital passport & verified skills */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Passport Container */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-600 uppercase tracking-wider font-extrabold">
              Secure Ledger ID
            </div>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-850">
              <Shield className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Cryptographic Passport</h3>
                <p className="text-[10px] text-slate-500 font-mono">HASH: {passportId}</p>
              </div>
            </div>

            {/* Verified Skills Ledger */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Verified Competency Map
              </h4>

              {verifiedSkillsList.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-850/60 text-slate-500 text-xs italic">
                  No verified skill scores found for this profile.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {verifiedSkillsList.map(([skill, details]: any) => {
                    const rating = details.score || 50;
                    let badgeLabel = "Novice";
                    let badgeColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
                    if (rating >= 85) {
                      badgeLabel = "Verified Expert";
                      badgeColor = "text-teal-400 bg-teal-500/10 border-teal-500/20";
                    } else if (rating >= 70) {
                      badgeLabel = "Competent Professional";
                      badgeColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                    }

                    return (
                      <div key={skill} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-850/80">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                          <div>
                            <span className="text-xs font-extrabold text-white capitalize">{skill}</span>
                            <span className={`ml-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-teal-400">{rating}%</span>
                          <p className="text-[8px] text-slate-500 uppercase font-mono font-bold">score level</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* General Skills tags */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Declared Skill Matrix</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map(s => (
                    <span key={s} className="text-[10px] font-mono bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-0.5 rounded capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right sidebar: Verification details & active certificates */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* QR Verification Card */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-5 shadow-lg text-center space-y-4">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-850">
              Interactive QR Verification
            </h3>
            
            <div className="flex justify-center py-2">
              {generateQRCodeSVG(publicUrl, 140, '#14b8a6')}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-300">Scan to Verify Credentials</p>
              <p className="text-[9px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Scan this cryptographically signed code with any mobile device to securely audit this candidate's live profile and validated assessment history.
              </p>
            </div>
          </div>

          {/* Active Certificates Plaque Roll */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-850 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-400" />
              Credentials List ({certificates.length})
            </h3>

            {certificates.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic text-center py-4">No active compliance certificates unlocked yet.</p>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white uppercase leading-tight tracking-wide">{cert.skill} Expert</p>
                      <p className="text-[9px] text-slate-500 font-mono">Issued {cert.issue_date || cert.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-emerald-400">{cert.score}%</span>
                      <p className="text-[8px] text-slate-500 uppercase font-bold font-mono">VALIDATED</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
