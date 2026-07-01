import React, { useRef, useState } from 'react';
import { Award, Shield, CheckCircle2, Copy, Sparkles, Printer, UserCheck, Calendar, ExternalLink, Check } from 'lucide-react';
import { UserProfile } from '../../types';
import { generateQRCodeSVG } from '../../utils/qr';

interface SkillPassportProps {
  user: UserProfile;
}

export default function SkillPassport({ user }: SkillPassportProps) {
  const passportRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const passportId = `SH-PASS-${user.id.substring(5, 13).toUpperCase() || 'MOCKPASS'}`;
  const verifiedSkillsList = Object.entries(user.verifiedSkills || {});
  const publicProfileUrl = `${window.location.origin}/public/profile/${user.id}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(passportId);
    alert('Cryptographic Passport ID copied to clipboard: ' + passportId);
  };

  const handleSharePassport = () => {
    navigator.clipboard.writeText(publicProfileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Introduction text */}
      <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-xl shadow-lg">
        <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          AI Skill Passport System
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          The Skill Passport is a secure, digital talent credential. It holds cryptographic proof of your skill scores evaluated through our adaptive assessment engine, and is ready to be shared with verified hiring managers worldwide.
        </p>
      </div>

      {/* Holographic Passport Card */}
      <div 
        ref={passportRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#121625] via-[#0D111C] to-[#0A0C12] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 print:border-slate-300 print:text-black print:bg-white"
      >
        {/* Tech decorative frames */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-4 text-[9px] font-mono text-slate-600 tracking-widest font-bold uppercase pointer-events-none">
          SkillHire AI secure credential v2.1
        </div>

        {/* Passport Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-800/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider uppercase font-display">Talent Passport</h2>
              <p className="text-[10px] text-teal-400 font-bold font-mono">AUTHORIZED SKILL DISPATCH</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-teal-400 font-bold">
            <UserCheck className="w-3.5 h-3.5" />
            STATUS: VERIFIED
          </div>
        </div>

        {/* Passport Grid Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: Photo & Metadata */}
          <div className="md:col-span-5 flex flex-col items-center text-center space-y-4">
            
            {/* Visual Portrait box */}
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000" />
              <div className="relative h-32 w-32 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="text-slate-700 text-6xl font-black select-none font-display">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute bottom-2 text-[8px] font-mono font-bold tracking-wider text-slate-500 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded uppercase">
                  BIOMETRIC PIN
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-white">{user.name}</h3>
              <p className="text-xs text-slate-400 font-semibold">{user.title || 'Full Stack Engineer'}</p>
            </div>

            {/* Passport ID */}
            <div className="w-full bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-2">
              <div className="text-left">
                <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">Passport Code</p>
                <p className="text-[11px] font-mono font-bold text-white tracking-wider">{passportId}</p>
              </div>
              <button 
                onClick={handleCopyId}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy passport hash ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Column Right: Verified Skill list */}
          <div className="md:col-span-7 space-y-4">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800/60 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              Verified Competency Index
            </h4>

            {verifiedSkillsList.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800/60 flex flex-col items-center gap-2">
                <Award className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-500 italic">No verified skill badges found.</p>
                <p className="text-[10px] text-slate-600">Complete skill assessments to populate passport.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {verifiedSkillsList.map(([skill, details]) => (
                  <div key={skill} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{skill}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> Checked {details.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black font-mono text-teal-400">{details.score}%</div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">PERFORMANCE</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Verification Footprint */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-center sm:text-left">
                <div>
                  <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">Credential Issue Authority</p>
                  <p className="text-[9px] text-slate-300 font-bold font-mono">SkillHire AI Certifying Engine</p>
                </div>
                
                {/* Fake High-Tech Barcode */}
                <div className="bg-white p-1 rounded border border-slate-200 inline-block">
                  <svg className="w-32 h-5" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
                    {/* barcode bars */}
                    <rect x="0" width="2" height="20" fill="black" />
                    <rect x="3" width="1" height="20" fill="black" />
                    <rect x="5" width="3" height="20" fill="black" />
                    <rect x="9" width="1" height="20" fill="black" />
                    <rect x="11" width="2" height="20" fill="black" />
                    <rect x="15" width="4" height="20" fill="black" />
                    <rect x="20" width="1" height="20" fill="black" />
                    <rect x="22" width="2" height="20" fill="black" />
                    <rect x="25" width="1" height="20" fill="black" />
                    <rect x="28" width="3" height="20" fill="black" />
                    <rect x="32" width="1" height="20" fill="black" />
                    <rect x="34" width="4" height="20" fill="black" />
                    <rect x="39" width="2" height="20" fill="black" />
                    <rect x="42" width="1" height="20" fill="black" />
                    <rect x="45" width="3" height="20" fill="black" />
                    <rect x="49" width="1" height="20" fill="black" />
                    <rect x="52" width="2" height="20" fill="black" />
                    <rect x="55" width="4" height="20" fill="black" />
                    <rect x="60" width="1" height="20" fill="black" />
                    <rect x="63" width="2" height="20" fill="black" />
                    <rect x="66" width="1" height="20" fill="black" />
                    <rect x="68" width="3" height="20" fill="black" />
                    <rect x="72" width="1" height="20" fill="black" />
                    <rect x="74" width="4" height="20" fill="black" />
                    <rect x="79" width="2" height="20" fill="black" />
                    <rect x="82" width="1" height="20" fill="black" />
                    <rect x="85" width="3" height="20" fill="black" />
                    <rect x="89" width="1" height="20" fill="black" />
                    <rect x="91" width="2" height="20" fill="black" />
                    <rect x="94" width="1" height="20" fill="black" />
                    <rect x="96" width="3" height="20" fill="black" />
                  </svg>
                </div>
              </div>
              
              {/* Interactive QR Code for Verification */}
              <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
                <div className="shrink-0">
                  {generateQRCodeSVG(publicProfileUrl, 56, '#14b8a6')}
                </div>
                <div className="text-left">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold block">QR VERIFICATION</span>
                  <p className="text-[9px] text-slate-300 leading-tight">Scan with mobile to<br />validate credentials</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Control Actions */}
      <div className="flex flex-wrap justify-end gap-3 print:hidden">
        <a 
          href={`/public/profile/${user.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-slate-800 bg-slate-950/40 hover:bg-slate-900/40 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview Public Passport
        </a>
        <button 
          onClick={handlePrint}
          className="px-4 py-2 border border-slate-800 bg-slate-950/40 hover:bg-slate-900/40 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Export / Print Credential
        </button>
        <button 
          onClick={handleSharePassport}
          className="px-4 py-2 bg-teal-500/10 border border-teal-500/35 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-w-[170px] justify-center"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-400" />
              Passport Link Copied!
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Share Skill Passport
            </>
          )}
        </button>
      </div>

    </div>
  );
}
