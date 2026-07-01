import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Briefcase, 
  Award, 
  Compass, 
  Key, 
  UserPlus, 
  Users, 
  ArrowRight, 
  Loader2, 
  Code, 
  Smartphone, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Send, 
  Chrome, 
  CheckCircle, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Brain, 
  Layers, 
  ChevronDown, 
  Check, 
  HelpCircle, 
  BarChart3, 
  DollarSign, 
  Building 
} from 'lucide-react';
import { UserRole } from '../types';

interface HeroLandingProps {
  onLoginSuccess: (user: any) => void;
  currentUser?: any;
  onLogout?: () => void;
}

type AuthView = 'signin' | 'signup' | 'forgot' | 'otp' | 'google';

export default function HeroLanding({ onLoginSuccess, currentUser, onLogout }: HeroLandingProps) {
  // Authentication states
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. SIGN IN state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. SIGN UP state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('candidate');
  const [registerCompany, setRegisterCompany] = useState('');
  const [registerTitle, setRegisterTitle] = useState('');

  // 3. OTP STATE
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');

  // 4. FORGOT PASSWORD STATE
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [simulatedResetCode, setSimulatedResetCode] = useState('');

  // 5. GOOGLE LOGIN STATE
  const [googleRole, setGoogleRole] = useState<UserRole>('candidate');
  const [googleEmail, setGoogleEmail] = useState('google.dev@skillhire.ai');
  const [googleName, setGoogleName] = useState('Google Developer');

  // Interactive AI Sandbox simulator state
  const [activeTab, setActiveTab] = useState<'sandbox' | 'interview'>('sandbox');
  const [sandboxCode, setSandboxCode] = useState(`// Premium Gemini AI Evaluation Sandbox
function computeOptimalSequence(tasks) {
  return tasks
    .filter(t => t.priority === 'CRITICAL')
    .sort((a, b) => b.impact - a.impact);
}`);
  const [sandboxOutput, setSandboxOutput] = useState('Click "Verify Code" to let Gemini run cognitive analysis...');
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // Simulated Interview State
  const [interviewQuestionIndex, setInterviewQuestionIndex] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewOutput, setInterviewOutput] = useState('');
  const [isInterviewAnalyzing, setIsInterviewAnalyzing] = useState(false);

  const interviewQuestions = [
    "How do you handle micro-service failure in high-throughput cloud clusters?",
    "Explain how React 19 concurrent features can optimize rendering workloads.",
    "Describe a complex system design bottleneck you solved in a production environment."
  ];

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Unified error/success helpers
  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  // Submit Handler: Email/Password login
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Server network failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler: Register account
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerName || !registerPassword || !registerRole) {
      setError('Required fields are missing.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          name: registerName,
          role: registerRole,
          companyName: registerRole === 'company' ? registerCompany : undefined,
          title: registerTitle
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setError(data.message || 'Account registration failed.');
      }
    } catch (err) {
      setError('Network failure. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Send handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpIdentifier) {
      setError('Email or phone number is required.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const isPhoneNumber = /^[+0-9]+$/.test(otpIdentifier.trim().replace(/\s/g, ''));
      const endpoint = isPhoneNumber ? '/api/bdapps/auth/otp-send' : '/api/auth/otp-send';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: isPhoneNumber ? otpIdentifier : undefined,
          emailOrPhone: !isPhoneNumber ? otpIdentifier : undefined
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setOtpSent(true);
        if (data.isSimulated || data.code) {
          setSimulatedOtpCode(data.code);
          setSuccessMsg(`bdapps Simulated OTP generated! Enter code ${data.code} to continue.`);
        } else {
          setSimulatedOtpCode('');
          setSuccessMsg(data.message || 'OTP verification code dispatched successfully via bdapps.');
        }
      } else {
        setError(data.message || 'Failed to dispatch OTP verification.');
      }
    } catch (err) {
      setError('Network error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verify & Login handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const isPhoneNumber = /^[+0-9]+$/.test(otpIdentifier.trim().replace(/\s/g, ''));
      const endpoint = isPhoneNumber ? '/api/bdapps/auth/otp-verify' : '/api/auth/otp-verify';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: isPhoneNumber ? otpIdentifier : undefined,
          emailOrPhone: !isPhoneNumber ? otpIdentifier : undefined,
          code: otpCode 
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('OTP Code Verified! Authenticating session...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setError(data.message || 'Incorrect verification code.');
      }
    } catch (err) {
      setError('Error verifying code.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Send code
  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please provide your registered email address.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setForgotSent(true);
        setSimulatedResetCode(data.code || '556699');
        setSuccessMsg('We dispatched a simulated reset OTP code!');
      } else {
        setError(data.message || 'No account matching this email was found.');
      }
    } catch (err) {
      setError('Network error processing recovery.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Reset password & login
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotCode !== simulatedResetCode) {
      setError('Invalid verification reset code.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 5) {
      setError('New password must be at least 5 characters.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPassword }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Password updated successfully! Logging you in...');
        
        // Auto signin after successful reset
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, password: forgotNewPassword }),
        });
        const loginData = await loginRes.json();
        if (loginData.status === 'success') {
          setTimeout(() => {
            onLoginSuccess(loginData.user);
          }, 1200);
        } else {
          setAuthView('signin');
        }
      } else {
        setError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('Network error updating password.');
    } finally {
      setLoading(false);
    }
  };

  // Google Single Sign-On simulation
  const handleGoogleSso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) {
      setError('Please provide Google email and name.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          role: googleRole
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Successfully linked Google account!');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setError(data.message || 'Google SSO link failed.');
      }
    } catch (err) {
      setError('Google auth connector error.');
    } finally {
      setLoading(false);
    }
  };

  // Instant demo prefills using phone numbers
  const handlePrefillLogin = (prefillPhone: string) => {
    clearMessages();
    setOtpIdentifier(prefillPhone);
    setOtpSent(false);
    setOtpCode('');
    setSimulatedOtpCode('');
  };

  // Handle Sandbox run simulation
  const handleVerifySandbox = () => {
    setIsSandboxRunning(true);
    setSandboxOutput('Gemini AI sandbox compiler active...\nAnalyzing syntax & design pattern matching...');
    
    setTimeout(() => {
      setSandboxOutput(`[SYSTEM COGNITION ANALYSIS COMPLETE]
- Match Rate: 97.4% alignment with Software Engineer II heuristics.
- Performance Index: O(N log N) verified. Correct sort-mapping of sequence.
- Code Robustness: High. Safe optional chaining and type assertions utilized.
- Reputation Delta: +35 points pending verification lock.`);
      setIsSandboxRunning(false);
    }, 1500);
  };

  // Handle simulated Interview submission
  const handleVerifyInterview = () => {
    if (!interviewAnswer || interviewAnswer.trim().length < 10) {
      setInterviewOutput('Please articulate a more extensive response (at least 10 characters) to proceed.');
      return;
    }
    setIsInterviewAnalyzing(true);
    setInterviewOutput('Spinning up Gemini natural language review...');

    setTimeout(() => {
      setInterviewOutput(`[GEMINI BEHAVIORAL SPEECH ANALYSIS]
- Score: 89/100 (Advanced Competence)
- Strong Indicators: Accurate terminologies, structural flow, and focus on team scalability.
- Feedback: Exceeds threshold. Direct matching with premium company requisites.`);
      setIsInterviewAnalyzing(false);
    }, 1500);
  };

  // Handle Contact Submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    }, 1000);
  };

  return (
    <div className="space-y-24 pb-16">
      
      {/* 1. HERO SECTION WITH EMBEDDED AUTH DRAWER */}
      <section id="hero-fold" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-4 md:py-8">
        
        {/* Left: Hook Copy & Launch Points */}
        <motion.div 
          className="lg:col-span-7 space-y-6 md:space-y-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-xs font-bold text-teal-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            The Next-Generation Career Intelligence Engine
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-display text-white leading-[1.1]">
            Accelerate your <br />
            career with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-400">AI-verified reputation</span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-xl leading-relaxed">
            SkillHire AI redefines modern tech recruitment. Instead of self-reported resumes, candidates verify skills via dynamic Gemini assessment sandboxes, live code runtimes, and real-time behavioral interview simulations. Fully integrated with bdapps Carrier Billing.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-800/80 py-5">
            <div>
              <div className="text-xl md:text-2xl font-extrabold text-white font-mono">14,200+</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Assessments Meted</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-extrabold text-teal-400 font-mono">98.2%</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Placement Rate</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-extrabold text-indigo-400 font-mono">3 BDT</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Daily Subscription</div>
            </div>
          </div>

          {/* Instant Demo Portals */}
          <div className="p-5 bg-slate-950/60 border border-slate-800/60 rounded-2xl space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              Instant Demo Portals:
            </div>
            <p className="text-[11px] text-slate-400">
              Skip typing credentials during testing. Click an option below to simulate authentication:
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handlePrefillLogin('01822334455')}
                className="text-xs font-semibold px-3 py-2 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                Candidate Demo
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => handlePrefillLogin('01833445566')}
                className="text-xs font-semibold px-3 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-400 rounded-lg border border-teal-500/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                Recruiter Demo
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => handlePrefillLogin('01844556677')}
                className="text-xs font-semibold px-3 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 rounded-lg border border-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                Admin Demo
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right: Premium Authentication Center Card */}
        <motion.div 
          className="lg:col-span-5"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div id="auth-panel" className="bg-[#0D1117] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            
            <div className="p-6 md:p-8 space-y-6">
              
              {currentUser && currentUser.role === 'candidate' && !currentUser.subscribed ? (
                <div className="space-y-5">
                  <div className="text-center">
                    <Star className="w-12 h-12 text-amber-400 fill-amber-400/20 mx-auto mb-2 animate-bounce" />
                    <h2 className="text-lg font-bold font-display text-white">Activate Premium Credentials</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Phone Number: <span className="text-teal-400 font-mono font-bold">{currentUser.phone}</span>
                    </p>
                    
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 text-left mt-4 space-y-2.5">
                      <span className="font-bold text-white block">Daily Carrier Billing (3 BDT/day):</span>
                      <ul className="space-y-1 text-slate-400 list-disc list-inside text-[11px] leading-relaxed">
                        <li>Interactive Gemini tech assessment compilers</li>
                        <li>Uncapped behavioral & live code interview simulators</li>
                        <li>Verified certificates & shared reputation portfolio URLs</li>
                        <li>Direct candidate matching access with hiring partners</li>
                      </ul>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                      {successMsg}
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={async () => {
                        setLoading(true);
                        setError('');
                        setSuccessMsg('');
                        try {
                          const res = await fetch('/api/bdapps/subscription/subscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: currentUser.phone, userId: currentUser.id })
                          });
                          const data = await res.json();
                          if (data.status === 'SUCCESS' || data.statusCode === 'S1000') {
                            setSuccessMsg('Carrier daily subscription activated! Synchronizing profile...');
                            setTimeout(async () => {
                              const profileRes = await fetch(`/api/auth/profile/${currentUser.id}`);
                              const profileData = await profileRes.json();
                              if (profileData.status === 'success') {
                                onLoginSuccess(profileData.user);
                              }
                            }, 1500);
                          } else {
                            setError(data.message || 'Subscription failed. Please check carrier credit.');
                          }
                        } catch (err) {
                          setError('Connection error. Failed to reach bdapps billing server.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Confirm Activation (3 BDT/day)'}
                    </button>

                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors py-2 cursor-pointer underline"
                    >
                      ← Log Out / Change Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <Smartphone className="w-10 h-10 text-teal-400 mx-auto mb-2 animate-bounce" />
                    <h2 className="text-lg font-bold font-display text-white">bdapps Phone OTP Login</h2>
                    <p className="text-xs text-slate-400 mt-1">Authenticate instantly using your Bangladeshi mobile number via Axiata bdapps</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <span className="inline-block text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full font-mono">Robi / Airtel</span>
                      <span className="inline-block text-[9px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold px-2 py-0.5 rounded-full font-mono">bdapps Connected</span>
                    </div>
                  </div>

                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Mobile Phone Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={otpIdentifier}
                            onChange={(e) => setOtpIdentifier(e.target.value)}
                            placeholder="e.g. 018XXXXXXXX or 88018XXXXXXXX"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                            required
                          />
                          <div className="absolute right-3 top-3">
                            <span className="text-[9px] text-slate-500 font-mono font-bold text-teal-400">BD +880</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1.5 block leading-relaxed">
                          Your phone is verified securely. For new subscribers, a premium candidate passport will be registered, and your carrier subscriberId is saved in our database.
                        </span>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Request OTP Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      {simulatedOtpCode && (
                        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 text-center font-mono">
                          Simulated bdapps Gateway returned OTP: <span className="font-bold text-white text-sm">{simulatedOtpCode}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 font-mono">Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-center font-mono text-white tracking-widest focus:outline-none focus:border-teal-500 text-lg"
                          required
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                          {error}
                        </div>
                      )}

                      {successMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                          {successMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Verify OTP & Secure Login'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); clearMessages(); }}
                        className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors py-1 cursor-pointer"
                      >
                        ← Change Number / Back
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>

            {/* Carrier billing warning indicator footer */}
            <div className="bg-slate-950 border-t border-slate-800/80 p-4 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 animate-pulse" />
              bdapps Robi/Airtel daily subscription (3 BDT/day + VAT) applies to premium candidate sandboxes.
            </div>

          </div>
        </motion.div>

      </section>

      {/* 2. LOGO CLOUD / PLATFORM TRUST BAR */}
      <section className="bg-slate-950/40 border-y border-slate-900/80 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
            INTEGRATED SECURE IDENTITY GATEWAY & CARRIER INFRASTRUCTURES
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-display font-extrabold text-slate-300 tracking-tight text-lg">bdapps</span>
            <span className="font-display font-black text-slate-400 tracking-wider text-lg">ROBI AXIATA</span>
            <span className="font-sans font-bold text-slate-300 tracking-tight text-sm">AIRTEL TELECOM</span>
            <span className="font-mono text-slate-400 font-bold tracking-tight text-xs">GEMINI AI INTEGRATION</span>
            <span className="font-mono text-slate-400 font-bold tracking-tight text-xs">SUPABASE STORAGE</span>
          </div>
        </div>
      </section>

      {/* 3. AI FEATURES SPOTLIGHT SECTION (Interactive compiler terminal) */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] text-indigo-400 font-bold font-mono uppercase">
            Interactive Showcase
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            Evaluate your skills inside real AI Cognitive sandboxes
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            No more static multiple-choice questions. Our real-time terminal checks algorithmic design, cognitive speed, and code paradigms using Gemini logic evaluation models. Try the simulator below:
          </p>
        </div>

        {/* Dynamic Sandbox Simulator */}
        <div className="max-w-4xl mx-auto bg-[#090C10] border border-slate-800 rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12">
          
          {/* Controls column */}
          <div className="md:col-span-4 bg-slate-950/80 border-r border-slate-900 p-5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest block">Choose Assessment Type</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveTab('sandbox'); }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    activeTab === 'sandbox' 
                      ? 'border-teal-500/30 bg-teal-500/5 text-white' 
                      : 'border-transparent text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-teal-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold font-display">Algorithmic Sandbox</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Solve system sequences and code structures</p>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('interview'); }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    activeTab === 'interview' 
                      ? 'border-indigo-500/30 bg-indigo-500/5 text-white' 
                      : 'border-transparent text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Brain className="w-4 h-4 text-indigo-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold font-display">Gemini Behavioral AI</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Voice or text conversational panel matching</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl space-y-2 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Zap className="w-3.5 h-3.5 fill-amber-400/20" />
                SaaS Integration
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Premium assessments update user reputation indices mapped globally across regional corporate partner hiring dashboards in real-time.
              </p>
            </div>
          </div>

          {/* Interactive display terminal */}
          <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-6">
            
            {activeTab === 'sandbox' ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-teal-400 font-mono tracking-wider flex items-center gap-1.5 font-bold uppercase">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    Interactive Algorithmic Terminal (ES6 Typescript)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ROUTINE: EVAL_SEQ_ALG</span>
                </div>

                <div className="relative flex-1">
                  <textarea
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    className="w-full h-40 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-slate-900 font-mono text-[10px] text-slate-400 min-h-[90px] whitespace-pre-wrap">
                  {sandboxOutput}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSandboxCode(`// Premium Gemini AI Evaluation Sandbox
function computeOptimalSequence(tasks) {
  return tasks
    .filter(t => t.priority === 'CRITICAL')
    .sort((a, b) => b.impact - a.impact);
}`);
                      setSandboxOutput('Click "Verify Code" to let Gemini run cognitive analysis...');
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Code
                  </button>
                  <button
                    onClick={handleVerifySandbox}
                    disabled={isSandboxRunning}
                    className="px-5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSandboxRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                    Verify Code with Gemini
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-indigo-400 font-mono tracking-wider flex items-center gap-1.5 font-bold uppercase">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    Gemini Speech & Behavioral Analysis System
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">STAGE: MICRO_WORKLOAD</span>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  <div className="text-[10px] uppercase font-mono text-indigo-300 font-bold tracking-wider mb-1">
                    Simulated Question {interviewQuestionIndex + 1} of 3:
                  </div>
                  <p className="text-xs text-white font-medium">{interviewQuestions[interviewQuestionIndex]}</p>
                </div>

                <div className="relative flex-1">
                  <textarea
                    value={interviewAnswer}
                    onChange={(e) => setInterviewAnswer(e.target.value)}
                    placeholder="Describe your design or process hierarchy here..."
                    className="w-full h-24 bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                {interviewOutput && (
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-900 font-mono text-[10px] text-slate-400 whitespace-pre-wrap">
                    {interviewOutput}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      const next = (interviewQuestionIndex + 1) % interviewQuestions.length;
                      setInterviewQuestionIndex(next);
                      setInterviewAnswer('');
                      setInterviewOutput('');
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Try Another Question
                  </button>
                  <button
                    onClick={handleVerifyInterview}
                    disabled={isInterviewAnalyzing}
                    className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isInterviewAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                    Analyze Response Heuristics
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 4. CORE FEATURES SECTION (The Bento Grid layout) */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded text-[10px] text-teal-400 font-bold font-mono uppercase">
            Platform Capabilities
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            A comprehensive pipeline from check to placement
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Engineered with a modular architecture that completely bypasses resume spam, empowering human resource representatives to source verified developer talent.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Bento Cell 1: Skill Reputation Score */}
          <div className="md:col-span-8 bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                Unified AI Reputation Index (ARI)
                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">ARI Index</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every candidate is indexed with a professional repute indicator scored out of 1000 points. ARI scales dynamically based on sandbox algorithm accuracy, code cleanliness parameters, and structural system designs.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center font-extrabold text-xs text-white">RI</div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Rahat Islam (Fullstack)</div>
                  <div className="text-[10px] text-slate-500">Verified React/Node Sandbox Badges</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-mono">REPUTE INDEX</div>
                <div className="text-sm font-black text-indigo-400 font-mono">895 / 1000</div>
              </div>
            </div>
          </div>

          {/* Bento Cell 2: Secure Carrier Billing */}
          <div className="md:col-span-4 bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="h-10 w-10 bg-teal-500/10 rounded-xl border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white font-display">bdapps Carrier Gateway</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fully compliant, single-click subscription model integrated with Robi and Airtel networks. Charge candidate premium plans securely to phone bills.
              </p>
            </div>
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">NETWORK LATENCY</div>
              <div className="flex items-center gap-1.5 text-xs text-teal-400 font-bold font-mono">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
                API INTEGRATION COMPLIANT (3 BDT/DAY)
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Recruiter Feeds */}
          <div className="md:col-span-4 bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
            <div className="h-10 w-10 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white font-display">Recruiter Sandbox Feeds</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Company owners can query top-scoring candidates according to specific micro-skills instead of sifting through text PDFs.
              </p>
            </div>
          </div>

          {/* Bento Cell 4: Direct Assessment Builder */}
          <div className="md:col-span-8 bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="h-10 w-10 bg-teal-500/10 rounded-xl border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Code className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-display">Custom Employer Code Sandboxes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Define challenges unique to your company. Our backend Gemini systems synthesize personalized validation metrics automatically to verify candidate alignment.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE "HOW IT WORKS" TIMELINE SECTION */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] text-indigo-400 font-bold font-mono uppercase">
            Platform Workflow
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            A frictionless path to verified recruitment
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            How SkillHire AI matches candidates with active company vacancies.
          </p>
        </div>

        {/* 3 Step Timeline Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-teal-500/25 via-indigo-500/25 to-teal-500/25 z-0" />

          {/* Step 1 */}
          <div className="space-y-4 text-center relative z-10">
            <div className="h-16 w-16 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center text-teal-400 font-mono font-black text-lg mx-auto shadow-lg">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-display">Create Account & Register</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                Define your target role designation. Complete the bdapps Robi/Airtel gateway setup to unlock the testing terminal.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-4 text-center relative z-10">
            <div className="h-16 w-16 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center text-indigo-400 font-mono font-black text-lg mx-auto shadow-lg">
              02
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-display">Solve Gemini Sandboxes</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                Verify micro-skills by writing code and interacting with panel interview questions. Watch your ARI score ascend.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4 text-center relative z-10">
            <div className="h-16 w-16 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center text-teal-400 font-mono font-black text-lg mx-auto shadow-lg">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white font-display">Direct HR Matchmaking</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                Recruiters query high-reputation candidates directly, arranging immediate salary placements. Bypasses classic interviews.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. PRICING TIERS SECTION */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded text-[10px] text-teal-400 font-bold font-mono uppercase">
            Simple Pricing Model
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            Transparent plans for candidates & recruiters
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Flexible packages mapped directly to your tech career velocity. No hidden charges.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: Free Candidate */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Candidate Basic</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-black text-white font-mono">Free</span>
                <span className="text-xs text-slate-500 ml-1">/ entry</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore the platform, browse active job listings, and take up to 2 basic quizzes monthly.
              </p>
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Basic profile listing
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  2 monthly static assessments
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Standard response delay
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setAuthView('signup'); clearMessages(); window.scrollTo({ top: 100, behavior: 'smooth' }); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Get Started Free
            </button>
          </div>

          {/* Card 2: Premium Candidate (Robi/Airtel Sub) - Highlighted */}
          <div className="bg-gradient-to-b from-[#0D1117] to-[#121824] border-2 border-teal-500/60 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-4 right-4 bg-teal-500/15 border border-teal-500/20 text-teal-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              RECOMMENDED
            </div>
            <div className="space-y-4">
              <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Candidate Premium</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-black text-white font-mono">3 BDT</span>
                <span className="text-xs text-slate-400 ml-1">/ daily charge</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Directly billed via Robi & Airtel mobile networks. Synthesize unlimited Gemini dynamic code sandboxes & mock behavioral modules.
              </p>
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-teal-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Unlimited Gemini evaluations
                </div>
                <div className="flex items-center gap-2 text-xs text-teal-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Verified candidate badge on profile
                </div>
                <div className="flex items-center gap-2 text-xs text-teal-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Prioritized recruiter matching queue
                </div>
                <div className="flex items-center gap-2 text-xs text-teal-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  No credit card required
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setAuthView('signup'); clearMessages(); window.scrollTo({ top: 100, behavior: 'smooth' }); }}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-lg shadow-teal-500/10"
            >
              Subscribe with Mobile Account
            </button>
          </div>

          {/* Card 3: Recruiting Enterprise */}
          <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Corporate Enterprise</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-black text-white font-mono">$149</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For sourcing agents, HR, and technical leaders. Configure sandbox metrics and pipeline candidates directly.
              </p>
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Direct candidate sourcing access
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Define up to 10 company sandboxes
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Dedicated API integration
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setAuthView('signup'); clearMessages(); window.scrollTo({ top: 100, behavior: 'smooth' }); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Launch Corporate Console
            </button>
          </div>

        </div>
      </section>

      {/* 7. INTERACTIVE FAQ SECTION */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] text-indigo-400 font-bold font-mono uppercase">
            Information Center
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Everything you need to know about SkillHire AI career verification models.
          </p>
        </div>

        {/* Collapsible Accordions */}
        <div className="max-w-3xl mx-auto space-y-3">
          
          {[
            {
              q: "What is bdapps Carrier Billing, and how is it processed?",
              a: "bdapps is Axiata's official regional telco API gateway. Candidates using Robi or Airtel SIM cards can choose the Candidate Premium plan and have BDT 3 + tax per day billed directly to their mobile account airtime or postpaid cycle, bypassing the need for credit cards."
            },
            {
              q: "How does the Gemini AI sandbox evaluate candidate code?",
              a: "When a candidate completes a system sequence or code snippet, our integrated server-side Gemini gateway runs code paradigm checks, complexity heuristic metrics, and cognitive logic verification. This generates a direct ARI reputation score, protecting against plagiarism."
            },
            {
              q: "As a Recruiter, how can I access candidate databases?",
              a: "Simply sign up with a 'Company Recruiter' role mapping. You'll gain access to the company dashboard, allowing you to view and search high-ARI verified candidates, view complete sandbox run histories, and extend instant job placements."
            },
            {
              q: "Is there a contract or commitment with the premium plan?",
              a: "None at all. Candidates can unsubscribe from daily carrier charges at any point directly via their console profile with a single click, instantly halting daily BDT charge cycles."
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-[#0D1117] border border-slate-800/80 rounded-xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex justify-between items-center p-5 text-left text-xs md:text-sm font-semibold text-white hover:text-teal-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  {item.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transform transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? 'rotate-180 text-teal-400' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-slate-900 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

        </div>
      </section>

      {/* 8. HIGH-CONVERTING CONTACT SECTION */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded text-[10px] text-teal-400 font-bold font-mono uppercase">
            Secure Feedback
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            Connect with platform architects
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Have questions regarding API configurations, enterprise licenses, or billing? Reach out now.
          </p>
        </div>

        {/* Contact Form Container */}
        <div className="max-w-2xl mx-auto bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!contactSubmitted ? (
              <motion.form 
                onSubmit={handleContactSubmit} 
                className="space-y-4"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Rahat Islam"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="SaaS / Carrier Inquiry"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Detailed Message</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Inquire about custom corporate pipelines, bdapps integration specs, or profile sync queries..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-teal-500/10"
                  >
                    {contactLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Dispatch Secure Message
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                className="text-center py-12 space-y-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-display">Inquiry Transmitted</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you. Your message has been routed to the SkillHire AI platform administration. A developer will respond via email shortly.
                  </p>
                </div>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="text-xs font-bold text-teal-400 hover:underline cursor-pointer"
                >
                  Send another inquiry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

    </div>
  );
}
