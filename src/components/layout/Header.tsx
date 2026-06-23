import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Zap, AlertCircle, Clock } from 'lucide-react';
import { User, AppNotification } from '../../types';

interface HeaderProps {
  view: string;
  user: User;
  notification: { message: string, type: 'success' | 'alert' } | null;
  isLiveMode: boolean;
  setIsLiveMode: (val: boolean) => void;
  lastRefreshedAt: Date;
  currentTime: Date;
  allNotifications: AppNotification[];
  showNotifications: boolean;
  setShowNotifications: (val: boolean) => void;
}

export const Header = ({
  view,
  user,
  notification,
  isLiveMode,
  setIsLiveMode,
  lastRefreshedAt,
  currentTime,
  allNotifications,
  showNotifications,
  setShowNotifications
}: HeaderProps) => {
  const diffInSeconds = Math.floor((currentTime.getTime() - lastRefreshedAt.getTime()) / 1000);
  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-[#1e293b] text-white flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold uppercase tracking-widest text-[#94a3b8]">
          {view}
        </h1>
        <div className="h-4 w-px bg-[#334155] mx-2" />
        <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          CS-302 System Design
        </div>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`ml-4 flex items-center gap-2 px-3 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${
              notification.type === 'alert' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            {notification.message}
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Live Mode Toggle */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]">
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-tighter">Auto-Refresh</p>
            <p className="text-[9px] font-bold text-white/60 font-mono">
              {isLiveMode ? `Refreshed ${diffInSeconds}s ago` : 'Paused'}
            </p>
          </div>
          <button 
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              isLiveMode 
                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'bg-[#334155] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Zap className={`w-3 h-3 ${isLiveMode ? 'fill-current animate-pulse' : ''}`} />
            {isLiveMode ? 'Live' : 'Static'}
          </button>
        </div>

        <div className="relative group">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#334155] rounded-xl transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#3b82f6] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#1e293b]">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden text-[#1e293b]"
              >
                <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#0f172a]">Intelligence Feed</h4>
                  <span className="text-[9px] font-bold text-[#3b82f6] px-2 py-0.5 bg-[#3b82f6]/5 rounded-full uppercase tracking-tighter">Real-time</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {allNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-[#e2e8f0] mx-auto mb-3" />
                      <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">No active alerts</p>
                    </div>
                  ) : (
                    allNotifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition-colors ${!n.read ? 'bg-[#3b82f6]/5' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.read ? 'bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-gray-200'}`} />
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-[#0f172a] mb-0.5 uppercase tracking-tight leading-normal">{n.message}</p>
                            <p className="text-[10px] text-[#64748b] leading-relaxed mb-2">"{n.reason}"</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-[#3b82f6] uppercase tracking-tighter">{n.ticketId}</span>
                              <span className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-tighter">{new Date(n.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {allNotifications.length > 0 && (
                  <button className="w-full text-center py-3 bg-[#f8fafc] border-t border-[#e2e8f0] text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest hover:bg-white transition-all">
                    Archive All Notifications
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-[#334155]" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white tracking-tight">{user.name}</p>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none mt-0.5">{user.role}</p>
          </div>
          <img src={user.avatar} className="w-8 h-8 rounded-lg border border-[#334155] shadow-sm transform hover:scale-105 transition-transform" alt={user.name} referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
};
