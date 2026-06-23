import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Clock, CheckCircle2, AlertCircle, MessageSquare, TrendingUp, Search, Bell } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, SupportTicket, EmailLog } from '../../types';
import { StatCard } from '../ui/StatCard';
import { StatusIndicator } from '../ui/StatusIndicator';

interface AdminDashboardViewProps {
  stats: any;
  statusData: any;
  chartData: any;
  agentPerformanceData: any;
  allUsers: User[];
  tickets: SupportTicket[];
  emailLogs: EmailLog[];
}

export const AdminDashboardView = ({ 
  stats, 
  statusData, 
  chartData, 
  agentPerformanceData, 
  allUsers, 
  tickets, 
  emailLogs 
}: AdminDashboardViewProps) => {
  const activeAgents = allUsers.filter(u => u.role === 'AGENT');
  const [showEmailHub, setShowEmailHub] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [emailTypeFilter, setEmailTypeFilter] = useState('ALL');

  const filteredEmailLogs = useMemo(() => {
    return emailLogs.filter(log => {
      const searchLower = emailSearchQuery.toLowerCase();
      const matchSearch = emailSearchQuery === '' || 
        log.recipient.toLowerCase().includes(searchLower) || 
        log.subject.toLowerCase().includes(searchLower);
      
      const matchType = emailTypeFilter === 'ALL' || log.type === emailTypeFilter;

      return matchSearch && matchType;
    });
  }, [emailLogs, emailSearchQuery, emailTypeFilter]);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]">Command Center</h2>
          <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Operational KPI & Staffing Overview</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowEmailHub(!showEmailHub)}
             className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all border font-bold text-[10px] uppercase tracking-wider ${
               showEmailHub 
                ? 'bg-[#1e293b] text-white border-[#1e293b]' 
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
             }`}
           >
              <MessageSquare className="w-3.5 h-3.5" /> 
              {showEmailHub ? 'Dashboard' : 'Email Hub'}
           </button>
           <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">{activeAgents.filter(a => a.status === 'AVAILABLE').length} Agents Online</span>
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showEmailHub ? (
          <motion.div
            key="email-hub"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">Communication Ledger</p>
                <h3 className="text-sm font-bold text-[#0f172a]">Recent Email Dispatches</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input 
                    type="text"
                    placeholder="Search recipient..."
                    value={emailSearchQuery}
                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                    className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-bold text-[#1e293b] outline-none focus:ring-1 focus:ring-[#3b82f6] w-64 placeholder-[#94a3b8] uppercase tracking-wider transition-all"
                  />
                </div>

                <select 
                  value={emailTypeFilter}
                  onChange={(e) => setEmailTypeFilter(e.target.value)}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[10px] font-bold text-[#1e293b] outline-none focus:ring-1 focus:ring-[#3b82f6] uppercase tracking-wider cursor-pointer"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="TICKET_CREATED">Ticket Created</option>
                  <option value="TICKET_ASSIGNED">Ticket Assigned</option>
                  <option value="TICKET_RESOLVED">Ticket Resolved</option>
                  <option value="STATUS_UPDATE">Status Update</option>
                  <option value="ESCALATION">Escalation</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredEmailLogs.length === 0 ? (
                <div className="py-20 text-center text-[#94a3b8]">
                   <Bell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                   <p className="text-[11px] font-bold uppercase tracking-widest">No communications found</p>
                </div>
              ) : (
                filteredEmailLogs.map(log => (
                  <div key={log.id} className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] group hover:border-[#3b82f6] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                          log.type === 'ESCALATION' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                          log.type === 'TICKET_RESOLVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                          'bg-blue-50 border-blue-100 text-blue-500'
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a] group-hover:text-[#3b82f6] transition-colors">{log.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter">To: {log.recipient}</p>
                            <span className="w-1 h-1 bg-[#e2e8f0] rounded-full" />
                            <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-tighter">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 bg-white p-3 rounded-lg border border-[#e2e8f0] text-[11px] text-[#475569] leading-relaxed">
                      {log.body}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="main-stats" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Lifecycle" value={stats.total} icon={<Ticket className="w-4 h-4 text-[#3b82f6]" />} />
              <StatCard label="Resolution Rate" value={`${Math.round((stats.resolved/(stats.total || 1))*100)}%`} icon={<CheckCircle2 className="w-4 h-4 text-[#10b981]" />} />
              <StatCard label="Active Backlog" value={stats.pending} icon={<Clock className="w-4 h-4 text-[#f59e0b]" />} />
              <StatCard label="Critical Breach" value={stats.urgent} icon={<AlertCircle className="w-4 h-4 text-[#ef4444]" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
                  <h3 className="card-label mb-4">Agent Workload & Availability Status</h3>
                  <div className="space-y-3">
                    {activeAgents.map(agent => {
                      const agentTickets = tickets.filter(t => t.agentId === agent.id && t.status !== 'RESOLVED' && t.status !== 'CLOSED');
                      const loadPercent = Math.min((agentTickets.length / 5) * 100, 100);
                      
                      return (
                        <div key={agent.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] gap-4">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="relative">
                              <img src={agent.avatar} className="w-10 h-10 rounded-lg border border-white shadow-sm" alt={agent.name} />
                              <div className="absolute -bottom-1 -right-1">
                                <StatusIndicator status={agent.status} />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1e293b]">{agent.name}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-tighter ${
                                agent.status === 'AVAILABLE' ? 'text-emerald-600' :
                                agent.status === 'ON_BREAK' ? 'text-amber-600' : 'text-gray-400'
                              }`}>{agent.status.replace('_', ' ')}</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1 text-[9px] font-bold uppercase text-[#64748b]">
                                <span>Current Workload</span>
                                <span className={agentTickets.length > 4 ? 'text-rose-500' : 'text-[#3b82f6]'}>{agentTickets.length} / 5 Cap</span>
                              </div>
                              <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-700 ${
                                    loadPercent > 80 ? 'bg-rose-500' : loadPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${loadPercent}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right min-w-[60px]">
                              <p className="text-xs font-bold text-[#1e293b]">{agentPerformanceData.find((d: any) => d.name === agent.name)?.avgTime || '0.0h'}</p>
                              <p className="text-[8px] text-[#94a3b8] font-bold uppercase">Avg Handle</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
                  <h3 className="card-label mb-4">Volume by Class</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][index % 4]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {chartData.map((item: any, i: number) => (
                      <div key={item.name} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][i % 4] }} />
                          <span className="text-[#64748b] font-bold">{item.name}</span>
                        </div>
                        <span className="font-bold text-[#1e293b]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
