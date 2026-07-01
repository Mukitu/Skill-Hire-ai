import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Award, Shield, CheckCircle2, Cpu, ExternalLink, Calendar, 
  Loader2, ArrowLeft, Printer, Download, UserCheck, AlertOctagon, HelpCircle 
} from 'lucide-react';
import { generateQRCodeSVG } from '../../utils/qr';
import { UserProfile } from '../../types';

export default function VerifyCertificate() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<any | null>(null);
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        const res = await fetch(`/api/public/verify-certificate/${hash}`);
        const data = await res.json();
        if (data.status === 'success') {
          setCert(data.certificate);
          setCandidate(data.candidate);
        } else {
          setError(data.message || 'No certificate matching this ledger hash was found.');
        }
      } catch (err) {
        console.error('Error verifying certificate:', err);
        setError('Network failure during certificate validation check.');
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      fetchCertificateData();
    }
  }, [hash]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium font-mono">Running cryptographic verification on decentralized ledger...</p>
      </div>
    );
  }

  if (error || !cert || !candidate) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-6 p-8 bg-[#0D1117] border border-slate-800 rounded-2xl">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-lg font-black font-mono">
          <AlertOctagon className="w-6 h-6 text-red-500" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-white">Certificate Authentication Failed</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This token could not be authenticated. It may have been revoked, expired, or represents a forged digital signature.'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="w-full py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
        >
          Return to Platform Landing
        </button>
      </div>
    );
  }

  const publicUrl = window.location.href;
  const certificateHash = cert.cert_hash || cert.id;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12" id="certificate-auth-portal">
      
      {/* Back & Control Headers */}
      <div className="flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Platform Landing
        </button>

        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/public/profile/${candidate.id}`)}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Review Candidate Passport
          </button>
          <button 
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Visual Ledger Validation Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">CRYPTOGRAPHIC LEDGER VALIDATED</h3>
            <p className="text-[10px] text-slate-400">Authentic credentials backed by SkillHire AI Compliance Engine.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
            STATUS: ACTIVE & GENUINE
          </span>
        </div>
      </div>

      {/* The Certificate Plaque Canvas */}
      <div className="bg-gradient-to-b from-[#181D29] to-[#0A0C11] border-4 border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center space-y-8 print:border-slate-300 print:text-black print:bg-white">
        
        {/* Intricate decorative border layout */}
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-slate-800/40 rounded-2xl pointer-events-none print:border-slate-300" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Emblem Seal */}
        <div className="relative z-10 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-teal-400/20 to-indigo-600/20 border border-teal-400/30 flex items-center justify-center p-2.5">
            <div className="h-full w-full rounded-full bg-[#0D1117] border border-teal-500/20 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Certificate Titles */}
        <div className="space-y-2 relative z-10">
          <h2 className="text-[11px] font-mono font-black text-teal-400 uppercase tracking-widest leading-none">
            SkillHire AI Talent Certification
          </h2>
          <h1 className="text-xl md:text-2xl font-serif font-black text-white uppercase tracking-wider">
            Certificate of Competence
          </h1>
          <div className="h-0.5 w-24 bg-gradient-to-r from-teal-500 to-indigo-500 mx-auto mt-3" />
        </div>

        {/* Certificate Body Text */}
        <div className="space-y-3 relative z-10 max-w-xl mx-auto">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">This officially validates and registers that</p>
          <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-display">
            {candidate.name}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            has undergone objective, adaptive sandbox diagnostics and completed theoretical assessments, securing a high-performance expert rating in the core domain of
          </p>
          <p className="text-base font-extrabold text-white tracking-widest uppercase mt-3.5">
            {cert.skill} Expert Program
          </p>
        </div>

        {/* Rating circular percentage score & QR validation overlay */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4 relative z-10">
          
          {/* Circular Grade Score Gauge */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl shrink-0 w-44">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#161f30" strokeWidth="10" fill="transparent" />
                <circle 
                  cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="10" 
                  strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * cert.score) / 100} 
                  fill="transparent" 
                />
              </svg>
              <span className="absolute text-[11px] font-black font-mono text-emerald-400">{cert.score}%</span>
            </div>
            <div className="text-left">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Grade Rating</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">EXPERT BAND</span>
            </div>
          </div>

          {/* Real-time Validation QR Code */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl shrink-0 w-44">
            <div className="shrink-0">
              {generateQRCodeSVG(publicUrl, 48, '#14b8a6')}
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold block">SECURE QR CODE</span>
              <span className="text-[9px] text-slate-300 font-medium">Scan to verify this ledger cert</span>
            </div>
          </div>

        </div>

        {/* Ledger Hash Details footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-850 text-left relative z-10">
          <div className="space-y-0.5">
            <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">CRYPTO LEDGER HASH</p>
            <p className="text-[10px] font-mono font-bold text-slate-300 truncate" title={certificateHash}>
              {certificateHash}
            </p>
          </div>
          <div className="space-y-0.5 md:text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">REGISTRY AUTHORITY</p>
            <p className="text-[10px] font-mono font-bold text-slate-300">
              SKILLHIRE AI ACCREDITATION
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">LEDGER DATE REGISTERED</p>
            <p className="text-[10px] font-mono font-bold text-slate-300">
              {cert.issue_date || cert.date}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
