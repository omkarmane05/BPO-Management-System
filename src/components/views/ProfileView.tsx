import React from 'react';
import { motion } from 'motion/react';
import { Ticket, Clock, Settings as SettingsIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
import { User, SupportTicket, AvailabilityStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { StatusIndicator } from '../ui/StatusIndicator';

interface ProfileViewProps {
  user: User;
  allUsers: User[];
  tickets: SupportTicket[];
  onStatusUpdate: (status: AvailabilityStatus) => void;
}

export const ProfileView = ({ user, allUsers, tickets, onStatusUpdate }: ProfileViewProps) => {
  const userTickets = tickets.filter(t => t.customerId === user.id || t.agentId === user.id);
  const activeTickets = userTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a]">Identity Profile</h2>
          <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">System Credentials & Operational Status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Profile Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={user.avatar} 
                className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl mx-auto" 
                alt={user.name} 
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2">
                <StatusIndicator status={user.status} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a]">{user.name}</h3>
            <p className="text-xs text-[#64748b] font-semibold mb-3">{user.email}</p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                user.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                user.role === 'AGENT' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20' :
                'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {user.role}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                user.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                user.status === 'ON_BREAK' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-gray-50 text-gray-500 border-gray-100'
              }`}>
                {user.status.replace('_', ' ')}
              </span>
            </div>

            {user.role === 'AGENT' && (
              <div className="pt-6 border-t border-[#f1f5f9] space-y-3">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Update Duty Status</p>
                <div className="grid grid-cols-1 gap-2">
                  {(['AVAILABLE', 'ON_BREAK', 'OFFLINE'] as AvailabilityStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatusUpdate(s)}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                        user.status === s 
                          ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-lg' 
                          : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        s === 'AVAILABLE' ? 'bg-emerald-500' :
                        s === 'ON_BREAK' ? 'bg-amber-500' : 'bg-gray-400'
                      }`} />
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <SettingsIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Preferences</p>
                <h4 className="text-sm font-bold text-white">Advanced Settings</h4>
              </div>
            </div>
            <p className="text-[11px] text-blue-100/60 leading-relaxed mb-6">Modify notification frequency and interface themes.</p>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
              Configuration Menu
            </button>
          </div>
        </div>

        {/* Right Column - Activity & More Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Total Lifecycle Interaction</p>
              <h4 className="text-2xl font-bold text-[#1e293b]">{userTickets.length}</h4>
              <p className="text-[10px] text-[#94a3b8] mt-1 font-medium">Recorded service tickets</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Current Active Cycle</p>
              <h4 className="text-2xl font-bold text-[#3b82f6]">{activeTickets.length}</h4>
              <p className="text-[10px] text-[#94a3b8] mt-1 font-medium">Pending resolutions</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <h3 className="text-sm font-bold text-[#0f172a] mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3b82f6]" />
              Recent Activity Stream
            </h3>
            <div className="space-y-4">
              {activeTickets.length > 0 ? (
                activeTickets.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] group hover:border-[#3b82f6] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-all shadow-sm">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-[#3b82f6] mb-0.5">{t.id}</p>
                        <h5 className="text-[11px] font-bold text-[#1e293b] uppercase tracking-tighter truncate max-w-[200px]">{t.subject}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={t.status} />
                          <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-tighter">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e2e8f0]">
                    <CheckCircle2 className="w-6 h-6 text-[#94a3b8] opacity-20" />
                  </div>
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">No active tickets found</p>
                </div>
              )}
            </div>
          </div>

          {user.role === 'ADMIN' && (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1e293b]">Admin Management Protocols</h3>
                  <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Privileged Access controls</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="flex items-center justify-between p-4 bg-white border border-rose-100 rounded-xl hover:shadow-md transition-all group pointer-events-none opacity-50">
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-[#1e293b]">User Directory</p>
                    <p className="text-[9px] text-[#64748b]">Manage system accounts</p>
                  </div>
                </button>
                <button className="flex items-center justify-between p-4 bg-white border border-rose-100 rounded-xl hover:shadow-md transition-all group pointer-events-none opacity-50">
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-[#1e293b]">Security Logs</p>
                    <p className="text-[9px] text-[#64748b]">Audit system interactions</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
