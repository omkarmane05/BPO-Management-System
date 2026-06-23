import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Eye, Terminal, Activity, Server, Database, Globe, CheckCircle2 } from 'lucide-react';
import { User, SupportTicket, EmailLog } from '../../types';

interface SecurityViewProps {
  user: User;
  allUsers: User[];
  tickets: SupportTicket[];
  emailLogs: EmailLog[];
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  user,
  allUsers,
  tickets,
  emailLogs
}) => {
  const [activeSegment, setActiveSegment] = useState<'AUDIT' | 'SESSIONS' | 'SYSTEM'>('AUDIT');

  // Generate some "security incidents" or audit trails
  const auditEntries = [
    { id: 'SEC-001', type: 'LOGIN', user: 'Admin User', status: 'SUCCESS', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), details: 'Admin console access authorized' },
    { id: 'SEC-002', type: 'RBAC', user: 'John Agent', status: 'DENIED', ip: '10.0.4.22', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), details: 'Unauthorized attempt to access HR payroll module' },
    { id: 'SEC-003', type: 'ENCRYPTION', user: 'System', status: 'SUCCESS', ip: 'internal', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), details: 'Rotating AES-256 database encryption keys' },
    { id: 'SEC-004', type: 'MFA', user: 'Sarah Customer', status: 'SUCCESS', ip: '45.22.11.9', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), details: 'SMS 2FA Challenge validated successfully' },
    { id: 'SEC-005', type: 'BRUTE_FORCE', user: 'Unknown', status: 'BLOCKED', ip: '88.192.44.11', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), details: 'Multiple failed login attempts from novel IP' },
  ];

  return (
    <motion.div 
      key="security"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-12"
    >
      {/* Security Health Header */}
      <div className="bg-[#1e293b] rounded-2xl p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">System Integrity Status</h2>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Activity className="w-3 h-3" /> All Shields Active
                </span>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Last audit: Today, 14:22 UTC</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Threat Level</p>
              <p className="text-xs font-bold text-emerald-400">Pristine</p>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Encryption</p>
              <p className="text-xs font-bold text-sky-400">AES-256</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-[#e2e8f0] shadow-sm w-fit">
        {[
          { id: 'AUDIT', label: 'Security Audit Log', icon: <Terminal className="w-3.5 h-3.5" /> },
          { id: 'SESSIONS', label: 'Active Sessions', icon: <Globe className="w-3.5 h-3.5" /> },
          { id: 'SYSTEM', label: 'Infrastructure', icon: <Server className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSegment(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeSegment === tab.id 
                ? 'bg-[#1e293b] text-white shadow-md' 
                : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSegment === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1e293b] text-white rounded-lg">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">Consolidated Intelligence Feed</h3>
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Real-time Security Event Stream</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[10px] font-bold text-[#64748b] uppercase tracking-widest hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all">
              Export Audit Trail
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f8fafc] text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest border-b border-[#e2e8f0]">
                  <th className="px-6 py-4">Event ID</th>
                  <th className="px-6 py-4">Context</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {auditEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded border border-[#e2e8f0]">
                        {entry.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-bold text-[#1e293b] mb-1">{entry.type}</p>
                        <p className="text-[10px] text-[#64748b] italic">"{entry.details}"</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-[#475569]">{entry.user}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-[#94a3b8]" />
                        <span className="text-[10px] font-mono text-[#64748b]">{entry.ip}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter ${
                        entry.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        entry.status === 'BLOCKED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-[#94a3b8] font-medium">{new Date(entry.timestamp).toLocaleString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSegment === 'SESSIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
          {allUsers.filter(u => u.status !== 'OFFLINE').map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4 hover:border-[#3b82f6]/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} className="w-10 h-10 rounded-xl border border-[#e2e8f0]" alt={u.name} />
                  <div>
                    <h4 className="text-sm font-bold text-[#1e293b] leading-none mb-1">{u.name}</h4>
                    <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase">Active</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#f1f5f9]">
                <div>
                  <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">Session ID</p>
                  <p className="text-[10px] font-mono font-bold text-[#1e293b]">SESSION_{u.id.split('-')[0]}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">Device/OS</p>
                  <p className="text-[10px] font-bold text-[#1e293b]">Chrome/macOS</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure Context</span>
                </div>
                <button className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSegment === 'SYSTEM' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
            <h3 className="card-label mb-6">Database Security</h3>
            <div className="space-y-6">
              {[
                { label: 'Data Encryption at Rest', status: 'Enabled', type: 'AES-256' },
                { label: 'Network Transit Isolation', status: 'Active', type: 'TLS 1.3' },
                { label: 'Access Control Layer', status: 'Enforced', type: 'RBAC 2.0' },
                { label: 'Backup Integrity', status: 'Verified', type: 'Daily' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center text-[#1e293b]">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">{item.label}</p>
                      <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest">{item.type}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
            <h3 className="card-label mb-6">Threat Intelligence Summary</h3>
            <div className="space-y-6">
              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Global Reputation</p>
                  <p className="text-xl font-bold text-[#0f172a]">99.8% Clean</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl">
                  <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">DDoS Mitigation</p>
                  <p className="text-xs font-bold text-emerald-600">Active</p>
                </div>
                <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl">
                  <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">IPS/IDS Status</p>
                  <p className="text-xs font-bold text-emerald-600">Filtering</p>
                </div>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Active Watchlist</p>
                  <p className="text-[11px] text-rose-600 font-medium">3 IPs currently ratelimited due to suspicious pattern matching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
