import React, { useState } from 'react';
import { Award, Shield, CheckCircle2, Download, ExternalLink, Calendar, Search, Cpu } from 'lucide-react';
import { UserProfile } from '../../types';
import { generateQRCodeSVG } from '../../utils/qr';

interface CertificatesProps {
  user: UserProfile;
  certificates: any[];
}

export default function Certificates({ user, certificates }: CertificatesProps) {
  const [activeCert, setActiveCert] = useState<any | null>(null);

  const handleVerifyOnBlockchain = (hash: string) => {
    const url = `${window.location.origin}/verify/certificate/${hash}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction */}
      <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-400" />
          Verified Talent Certificates
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Earning a rating of <span className="text-teal-400 font-bold font-mono">80% or higher</span> on any skill assessment automatically generates an official SkillHire Compliance Certificate. These credentials can be verified by employers via our backend API.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800/80 flex flex-col items-center gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-500">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No compliance certificates unlocked yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ready to claim your official credentials? Complete any Career Quiz Assessment with a performance score above 80% to generate yours!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Certificate grid list */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-800/60">
              Select Certificate Plaque
            </h4>
            <div className="space-y-2.5">
              {certificates.map((cert) => {
                const isActive = activeCert?.id === cert.id;
                return (
                  <div 
                    key={cert.id}
                    onClick={() => setActiveCert(cert)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isActive 
                        ? 'bg-indigo-600/10 border-indigo-500/40 shadow-indigo-500/5' 
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-white leading-tight">
                        {cert.skill} Expert Certificate
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {cert.issue_date || cert.date}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          Rating: {cert.score}%
                        </span>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-slate-900/60 flex items-center justify-center border border-slate-800 text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate visual viewport */}
          <div>
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-800/60 mb-4">
              Plaque Preview Canvas
            </h4>
            
            {activeCert ? (
              <div className="bg-gradient-to-b from-[#181D29] to-[#0A0C11] border-2 border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center space-y-6">
                
                {/* Visual border and seals */}
                <div className="absolute top-3 left-3 right-3 bottom-3 border border-slate-800/40 rounded-xl pointer-events-none" />
                
                {/* Seal / Emblem */}
                <div className="relative z-10 flex justify-center pt-2">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-teal-400/20 to-indigo-600/20 border border-teal-400/30 flex items-center justify-center p-2">
                    <div className="h-full w-full rounded-full bg-[#0D1117] border border-teal-500/20 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-teal-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <h2 className="text-[10px] font-mono font-black text-teal-400 uppercase tracking-widest leading-none">
                    SkillHire AI Talent Accreditation
                  </h2>
                  <h1 className="text-base font-serif font-bold text-white uppercase tracking-wider">
                    Certificate of Competence
                  </h1>
                </div>

                <div className="space-y-1 relative z-10">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">This official token certifies that</p>
                  <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-display">
                    {user.name}
                  </p>
                  <p className="text-[9px] font-sans text-slate-400 max-w-xs mx-auto leading-relaxed">
                    has passed rigorous checks and demonstrated verified proficiency in the core technical skill category of
                  </p>
                  <p className="text-sm font-bold text-white tracking-wide uppercase mt-1">
                    {activeCert.skill}
                  </p>
                </div>

                {/* Score & QR Badge Row */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                  {/* Score badge */}
                  <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-950/60 border border-slate-850 rounded-xl w-36">
                    <span className="text-sm font-mono font-black text-emerald-400">{activeCert.score}%</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">EXPERT RATING</span>
                  </div>

                  {/* QR code on plaque */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-850 rounded-xl w-44 text-left">
                    <div className="shrink-0">
                      {generateQRCodeSVG(`${window.location.origin}/verify/certificate/${activeCert.cert_hash || activeCert.id}`, 44, '#10b981')}
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold block leading-none">QR VERIFIED</span>
                      <span className="text-[9px] text-slate-400 font-mono">Scan to validate</span>
                    </div>
                  </div>
                </div>

                {/* Certificate Footer block */}
                <div className="grid grid-cols-2 pt-4 border-t border-slate-800/60 gap-4 text-left relative z-10">
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">VERIFICATION HASH</p>
                    <p className="text-[9px] font-mono font-bold text-slate-300 truncate" title={activeCert.cert_hash || activeCert.id}>
                      {activeCert.cert_hash || activeCert.id}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">ISSUE DATE</p>
                    <p className="text-[9px] font-mono font-bold text-slate-300">
                      {activeCert.issue_date || activeCert.date}
                    </p>
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="flex gap-2 justify-center pt-2 relative z-10">
                  <button 
                    onClick={() => handleVerifyOnBlockchain(activeCert.cert_hash || activeCert.id)}
                    className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Verify Token
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-[10px] font-black text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download Plaque
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800/60 text-slate-500 text-xs italic">
                Select a compliance certificate from the list on the left to review, verify or download your official digital plaque.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
