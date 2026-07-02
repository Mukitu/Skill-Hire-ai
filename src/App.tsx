import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Star, LogOut, Shield, Award, Cpu, StarHalf, Sparkles, HelpCircle, UserCheck } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { UserProfile } from './types';
import HeroLanding from './components/HeroLanding';
import CandidateDashboard from './components/CandidateDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import AdminDashboard from './components/AdminDashboard';
import SubscriptionPage from './components/SubscriptionPage';
import BillingModal from './components/BillingModal';
import PublicProfile from './components/public/PublicProfile';
import VerifyCertificate from './components/public/VerifyCertificate';
import { isSupabaseConfigured } from './lib/supabaseClient';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    openBilling,
    appLoading,
    setCurrentUser,
    setOpenBilling,
    setAppLoading,
    signOut,
    syncProfile
  } = useAppStore();

  // Load auth state from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('skillhire_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as UserProfile;
        // Fetch fresh profile state from backend
        fetch(`/api/auth/profile/${u.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'success') {
              setCurrentUser(data.user);
              localStorage.setItem('skillhire_user', JSON.stringify(data.user));
            } else {
              setCurrentUser(u);
            }
          })
          .catch(() => {
            setCurrentUser(u);
          })
          .finally(() => {
            setAppLoading(false);
          });
      } catch (e) {
        localStorage.removeItem('skillhire_user');
        setAppLoading(false);
      }
    } else {
      setAppLoading(false);
    }
  }, [setCurrentUser, setAppLoading]);

  // Handle redirects on login/role changes
  useEffect(() => {
    if (!appLoading && currentUser) {
      const path = location.pathname;
      if (path === '/' || path === '') {
        if (currentUser.role === 'candidate') {
          if (currentUser.subscribed) {
            navigate('/candidate/assessments', { replace: true });
          } else {
            navigate('/subscription', { replace: true });
          }
        } else if (currentUser.role === 'company') {
          navigate('/company/candidates', { replace: true });
        } else if (currentUser.role === 'admin') {
          navigate('/admin', { replace: true });
        }
      }
    }
  }, [currentUser, appLoading, location.pathname, navigate]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'candidate') {
      if (user.subscribed) {
        navigate('/candidate/assessments');
      } else {
        navigate('/subscription');
      }
    } else if (user.role === 'company') {
      navigate('/company/candidates');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleUnsubscribe = async () => {
    if (!currentUser || !currentUser.phone) return;
    const confirmCancel = window.confirm("Are you sure you want to stop your daily SkillHire AI subscription? (This will remove your premium credentials immediately)");
    if (!confirmCancel) return;

    try {
      const res = await fetch('/api/bdapps/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentUser.phone, userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        await syncProfile();
        alert("Successfully unsubscribed from Robi/Airtel 3 BDT/day plan.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (appLoading) {
    return (
      <div id="app-loading" className="min-h-screen flex items-center justify-center bg-[#0A0C10] text-teal-400">
        <div className="text-center space-y-4">
          <Cpu className="w-12 h-12 animate-spin mx-auto text-teal-400" />
          <h3 className="text-sm font-semibold tracking-wide uppercase font-display">Initializing SkillHire AI Core...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col justify-between selection:bg-teal-500/20 selection:text-teal-300">
      
      {/* Decorative top ambient lines */}
      <div className="absolute top-0 left-1/4 right-1/4 h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/3 right-1/3 h-64 bg-gradient-to-b from-teal-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Global Header */}
      <header id="main-header" className="border-b border-slate-800 bg-[#0D1117] backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/10">
                <Cpu className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white tracking-tight font-display">
                    SkillHire<span className="text-teal-400">.AI</span>
                  </span>
                  {isSupabaseConfigured ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-bold font-mono">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Supabase SQL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 font-bold font-mono" title="Local file JSON persistence backup active">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      Dev Engine
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-500 tracking-wider uppercase font-semibold">
                  Career Intelligence Platform
                </div>
              </div>
            </div>
          </div>

          {/* User auth state / Controls */}
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 capitalize font-mono">{currentUser.role} Account</span>
              </div>

              {/* Subscribe/Cancel Status indicator */}
              {currentUser.role === 'candidate' && (
                currentUser.subscribed ? (
                  <button
                    onClick={handleUnsubscribe}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all cursor-pointer group"
                    title="Click to simulated cancel (unsubscribe) carrier billing"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover:bg-red-400" />
                    Premium active (daily charge)
                  </button>
                ) : (
                  <button
                    onClick={() => setOpenBilling(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold transition-all cursor-pointer animate-pulse"
                  >
                    <Star className="w-3 h-3 fill-indigo-400/20" />
                    Unlock Premium
                  </button>
                )
              )}

              {/* Signout icon */}
              <button
                onClick={handleSignOut}
                className="p-2 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800/80 cursor-pointer"
                title="Sign out profile"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 hidden md:flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              bdapps Robi-Airtel Subscription Gateway Enabled
            </div>
          )}

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        <Routes>
          <Route 
            path="/" 
            element={
              currentUser ? (
                currentUser.role === 'candidate' ? (
                  currentUser.subscribed ? (
                    <Navigate to="/candidate/assessments" replace />
                  ) : (
                    <Navigate to="/subscription" replace />
                  )
                ) : currentUser.role === 'company' ? (
                  <Navigate to="/company/dashboard" replace />
                ) : (
                  <Navigate to="/admin" replace />
                )
              ) : (
                <HeroLanding 
                  onLoginSuccess={handleLoginSuccess} 
                  currentUser={currentUser}
                  onLogout={handleSignOut}
                />
              )
            } 
          />

          <Route 
            path="/subscription" 
            element={
              currentUser && currentUser.role === 'candidate' ? (
                currentUser.subscribed ? (
                  <Navigate to="/candidate/assessments" replace />
                ) : (
                  <SubscriptionPage />
                )
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          <Route 
            path="/candidate" 
            element={
              currentUser && currentUser.role === 'candidate' ? (
                currentUser.subscribed ? (
                  <Navigate to="/candidate/assessments" replace />
                ) : (
                  <Navigate to="/subscription" replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route 
            path="/candidate/:tab" 
            element={
              currentUser && currentUser.role === 'candidate' ? (
                currentUser.subscribed ? (
                  <CandidateDashboard 
                    user={currentUser} 
                    onOpenSubscribe={() => setOpenBilling(true)} 
                  />
                ) : (
                  <Navigate to="/subscription" replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route 
            path="/company" 
            element={
              currentUser && currentUser.role === 'company' ? (
                <Navigate to="/company/dashboard" replace />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route 
            path="/company/:tab" 
            element={
              currentUser && currentUser.role === 'company' ? (
                <CompanyDashboard user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route 
            path="/admin" 
            element={
              currentUser && currentUser.role === 'admin' ? (
                <AdminDashboard adminUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Public Portals (accessible without session validation) */}
          <Route path="/public/profile/:id" element={<PublicProfile />} />
          <Route path="/verify/certificate/:hash" element={<VerifyCertificate />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </main>

      {/* Global Footer */}
      <footer id="main-footer" className="border-t border-slate-800 bg-[#0D1117] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 SkillHire AI Corp. All rights reserved.</p>
          <div className="flex gap-4 text-[11px] font-mono">
            <span>PLATFORM: V2.4.0-STABLE</span>
            <span className="text-slate-600">|</span>
            <span>DB: CLOUD SQL/FIRESTORE</span>
            <span className="text-slate-600">|</span>
            <span>AI: GEMINI-3.5-FLASH</span>
          </div>
        </div>
      </footer>

      {/* Billing flow overlay */}
      {openBilling && currentUser && (
        <BillingModal 
          user={currentUser}
          onClose={() => setOpenBilling(false)}
          onSuccess={(updatedUser) => setCurrentUser(updatedUser)}
        />
      )}

    </div>
  );
}
