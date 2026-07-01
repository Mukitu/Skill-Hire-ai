import React from 'react';
import { Bell, CheckSquare, Eye, Calendar, Clock, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';

interface NotificationsProps {
  user: UserProfile;
  notifications: any[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function Notifications({ user, notifications, onMarkRead, onMarkAllRead }: NotificationsProps) {
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-400 animate-swing" />
            Your Activity Logs & Notifications
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System status reports, carrier subscription events, and AI score credentials reports are recorded here.
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <button 
            onClick={onMarkAllRead}
            className="px-3 py-1.5 bg-teal-400/10 border border-teal-400/20 text-teal-400 hover:text-white hover:bg-teal-500 rounded-lg text-xs font-bold font-mono cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800/60 text-slate-500 text-xs italic">
          Your inbox is pristine! No security, evaluation, or carrier reports recorded yet.
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-4 rounded-xl border transition-all flex justify-between items-start gap-4 relative overflow-hidden ${
                n.read 
                  ? 'bg-slate-950/40 border-slate-850 opacity-70' 
                  : 'bg-indigo-600/5 border-indigo-500/20 hover:border-indigo-500/30 shadow-indigo-500/5'
              }`}
            >
              {!n.read && (
                <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              )}
              
              <div className="pl-2.5 space-y-1.5 flex-1">
                <p className={`text-xs font-bold leading-relaxed ${n.read ? 'text-slate-300' : 'text-white'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  {n.message}
                </p>
                
                {/* Date metadata */}
                <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-mono font-semibold">
                  <Calendar className="w-3 h-3 text-slate-700" />
                  <span>
                    {new Date(n.created_at || n.date || Date.now()).toLocaleDateString()}
                  </span>
                  <span className="text-slate-800">|</span>
                  <Clock className="w-3 h-3 text-slate-700" />
                  <span>
                    {new Date(n.created_at || n.date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button 
                  onClick={() => onMarkRead(n.id)}
                  className="p-1.5 bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500 hover:text-slate-950 text-indigo-400 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer shrink-0"
                  title="Mark as read"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
