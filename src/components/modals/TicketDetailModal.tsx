import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Download, 
  Users, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  LogOut, 
  UserPlus, 
  TrendingUp, 
  Search,
  FileJson,
  FileText
} from 'lucide-react';
import { SupportTicket, User, AvailabilityStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityIcon } from '../ui/PriorityIcon';
import { FeedbackForm } from '../forms/FeedbackForm';

interface TicketDetailModalProps {
  selectedTicket: SupportTicket | null;
  onClose: () => void;
  user: User;
  allUsers: User[];
  tickets: SupportTicket[];
  onStatusChange: (ticketId: string, status: SupportTicket['status']) => void;
  onAssignAgent: (ticketId: string, agentId: string) => void;
  onClaimTicket: (ticketId: string) => void;
  onEscalate: (ticketId: string) => void;
  onRateTicket: (ticketId: string, rating: number, feedback: string) => void;
  onToggleDependency: (ticketId: string, depId: string) => void;
  onViewTicket: (ticket: SupportTicket) => void;
}

export function TicketDetailModal({ 
  selectedTicket, 
  onClose, 
  user, 
  allUsers, 
  tickets,
  onStatusChange,
  onAssignAgent,
  onClaimTicket,
  onEscalate,
  onRateTicket,
  onToggleDependency,
  onViewTicket
}: TicketDetailModalProps) {
  const [depSearch, setDepSearch] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);

  if (!selectedTicket) return null;

  const exportHistory = (format: 'json' | 'text') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Ticket-History-${selectedTicket.id}-${timestamp}`;
    
    let content = '';
    let mimeType = '';
    let suffix = '';

    if (format === 'json') {
      content = JSON.stringify(selectedTicket, null, 2);
      mimeType = 'application/json';
      suffix = 'json';
    } else {
      content = `TICKET REPORT: ${selectedTicket.id}\n`;
      content += `====================================\n`;
      content += `Subject: ${selectedTicket.subject}\n`;
      content += `Status: ${selectedTicket.status}\n`;
      content += `Priority: ${selectedTicket.priority}\n`;
      content += `Category: ${selectedTicket.category}\n`;
      content += `Created At: ${new Date(selectedTicket.createdAt).toLocaleString()}\n`;
      content += `Customer: ${selectedTicket.customerName} (${selectedTicket.customerId})\n`;
      content += `Agent: ${selectedTicket.agentName || 'Unassigned'} (${selectedTicket.agentId || 'N/A'})\n\n`;
      content += `DESCRIPTION:\n`;
      content += `${selectedTicket.description}\n\n`;
      content += `HISTORY:\n`;
      selectedTicket.history.forEach(entry => {
        content += `[${new Date(entry.timestamp).toLocaleString()}] ${entry.action} by ${entry.user}\n`;
      });
      if (selectedTicket.rating) {
        content += `\nFEEDBACK:\nRating: ${selectedTicket.rating}/5\nComments: ${selectedTicket.feedback || 'None'}\n`;
      }
      mimeType = 'text/plain';
      suffix = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${suffix}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  return (
    <AnimatePresence>
      {selectedTicket && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 bg-[#f8fafc] border-b border-[#e2e8f0]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#3b82f6] bg-[#3b82f6]/5 border border-[#3b82f6]/20 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                    {selectedTicket.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#0f172a]">{selectedTicket.subject}</h2>
                    <span className="text-[10px] text-[#94a3b8] font-mono border border-[#e2e8f0] px-1.5 py-0.5 rounded leading-none">{selectedTicket.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportOptions(!showExportOptions)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#3b82f6]/30 hover:bg-[#3b82f6]/5 text-[#64748b] hover:text-[#3b82f6] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      title="Export History"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    
                    <AnimatePresence>
                      {showExportOptions && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-10 py-2 w-32"
                        >
                          <button 
                            onClick={() => exportHistory('json')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f8fafc] transition-all uppercase tracking-wider"
                          >
                            <FileJson className="w-3.5 h-3.5" /> JSON
                          </button>
                          <button 
                            onClick={() => exportHistory('text')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f8fafc] transition-all uppercase tracking-wider"
                          >
                            <FileText className="w-3.5 h-3.5" /> Plain Text
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-white rounded-lg transition-colors text-[#94a3b8] border border-transparent hover:border-[#e2e8f0]"
                  >
                    <PlusCircle className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-center text-[11px] text-[#64748b] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTicket.status} />
                  {selectedTicket.isEscalated && (
                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[8px] flex items-center gap-1 shadow-sm animate-pulse">
                      <AlertCircle className="w-2.5 h-2.5" /> ESCALATED
                    </span>
                  )}
                </div>
                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1.5">
                  <PriorityIcon priority={selectedTicket.priority} />
                  <span className="text-[#1e293b]">{selectedTicket.priority} Priority</span>
                </div>
                <span className="opacity-30">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 opacity-60" />
                  <span>Opened {new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {selectedTicket.isEscalated && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">Escalation Reason (Internal Only)</h5>
                    <p className="text-xs font-medium text-rose-600 leading-relaxed italic">
                      "{selectedTicket.escalationReason || 'Marked as urgent for management review.'}"
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="card-label mb-3">Case Narrative</h4>
                <div className="bg-[#f8fafc] p-6 rounded-xl text-[13px] text-[#475569] border border-[#e2e8f0] leading-relaxed italic relative">
                  <MessageSquare className="w-4 h-4 absolute top-4 right-4 opacity-10" />
                  "{selectedTicket.description}"
                </div>
              </div>

              {/* System Dependencies Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="card-label">System Dependencies</h4>
                  <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">Execution Order Enforced</span>
                </div>
                
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input 
                        type="text"
                        placeholder="Search for blockers to add..."
                        value={depSearch}
                        onChange={(e) => setDepSearch(e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg pl-8 pr-4 py-1.5 text-[10px] font-bold text-[#1e293b] outline-none focus:ring-1 focus:ring-[#3b82f6] placeholder-[#94a3b8] uppercase tracking-wider"
                      />
                    </div>
                    
                    {depSearch && (
                      <div className="mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                        {tickets
                          .filter(t => t.id !== selectedTicket.id && !selectedTicket.dependencyIds?.includes(t.id) && (t.id.toLowerCase().includes(depSearch.toLowerCase()) || t.subject.toLowerCase().includes(depSearch.toLowerCase())))
                          .map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                onToggleDependency(selectedTicket.id, t.id);
                                setDepSearch('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-[#f8fafc] flex items-center justify-between border-b last:border-0 border-[#f1f5f9]"
                            >
                              <div>
                                <span className="text-[8px] font-bold text-[#3b82f6] mr-2">{t.id}</span>
                                <span className="text-[10px] font-bold text-[#1e293b] uppercase tracking-tight">{t.subject}</span>
                              </div>
                              <PlusCircle className="w-3 h-3 text-[#3b82f6]" />
                            </button>
                          ))}
                        {tickets.filter(t => t.id !== selectedTicket.id && !selectedTicket.dependencyIds?.includes(t.id) && (t.id.toLowerCase().includes(depSearch.toLowerCase()) || t.subject.toLowerCase().includes(depSearch.toLowerCase()))).length === 0 && (
                          <div className="p-3 text-[10px] text-[#94a3b8] font-medium text-center italic">No candidate tickets found</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3 relative pr-6">
                    {/* Connection Line */}
                    {selectedTicket.dependencyIds && selectedTicket.dependencyIds.length > 1 && (
                      <div className="absolute left-[27px] top-6 bottom-12 w-[1.5px] bg-gradient-to-b from-amber-200 to-[#e2e8f0]" />
                    )}
                    
                    {selectedTicket.dependencyIds && selectedTicket.dependencyIds.length > 0 ? (
                      selectedTicket.dependencyIds.map(depId => {
                        const depTicket = tickets.find(t => t.id === depId);
                        if (!depTicket) return null;
                        const isCleared = depTicket.status === 'RESOLVED' || depTicket.status === 'CLOSED';
                        return (
                          <div key={depId} className="flex items-center justify-between p-3 bg-white border border-[#e2e8f0] rounded-xl group relative z-10 hover:border-amber-200 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0 ${isCleared ? 'bg-[#10b981]' : 'bg-amber-500 animate-pulse'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-[#3b82f6] px-1.5 py-0.5 bg-[#3b82f6]/5 rounded">{depId}</span>
                                  <span className={`text-[10px] font-bold uppercase tracking-tight ${isCleared ? 'text-[#64748b] line-through' : 'text-[#1e293b]'}`}>{depTicket.subject}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <StatusBadge status={depTicket.status} />
                                  {isCleared ? (
                                    <span className="text-[8px] font-bold text-[#10b981] uppercase flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Path Unlocked
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-bold text-amber-600 uppercase flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" /> Active Blocker
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => onViewTicket(depTicket)}
                                className="text-[9px] font-bold text-[#3b82f6] uppercase tracking-wider bg-[#3b82f6]/5 hover:bg-[#3b82f6]/10 px-3 py-1.5 rounded-lg transition-all"
                              >
                                View Context
                              </button>
                              <button 
                                onClick={() => onToggleDependency(selectedTicket.id, depId)}
                                className="p-1.5 text-[#94a3b8] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-100 rounded-lg hover:bg-rose-50"
                                title="Unlink Dependency"
                              >
                                <PlusCircle className="w-4 h-4 rotate-45" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-[10px] text-[#94a3b8] font-medium italic">No active dependencies linked to this case.</p>
                        <p className="text-[8px] text-[#cbd5e1] mt-1 font-bold uppercase tracking-widest">Add blockers above to enforce execution order</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dependent Tickets Section */}
              {tickets.filter(t => t.dependencyIds?.includes(selectedTicket.id)).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="card-label">Dependent Tickets</h4>
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Blocked by this Case</span>
                  </div>
                  <div className="space-y-2">
                     {tickets.filter(t => t.dependencyIds?.includes(selectedTicket.id)).map(dep => (
                       <div key={dep.id} className="flex items-center justify-between p-3 bg-white border border-[#e2e8f0] rounded-lg shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-rose-500">{dep.id}</span>
                                <span className="text-[10px] font-bold text-[#1e293b] uppercase tracking-tight">{dep.subject}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StatusBadge status={dep.status} />
                                <span className="text-[8px] font-bold text-[#64748b] uppercase">Will be unblocked upon resolution</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => onViewTicket(dep)}
                            className="text-[9px] font-bold text-[#3b82f6] uppercase hover:underline"
                          >
                            View Ticket
                          </button>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* Rating & Feedback Section */}
              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-[#f8fafc] px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-[#1e293b] uppercase tracking-widest flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500" /> Service Experience Resolution
                    </h4>
                    {selectedTicket.rating && (
                      <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase tracking-tighter">
                        Feedback Recorded
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {selectedTicket.rating ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= selectedTicket.rating! ? 'text-amber-500 fill-amber-500' : 'text-[#e2e8f0]'}`} 
                            />
                          ))}
                        </div>
                        <div className="bg-[#f1f5f9] p-4 rounded-lg italic text-xs text-[#475569]">
                          "{selectedTicket.feedback || 'No comments provided.'}"
                        </div>
                      </div>
                    ) : (
                      user.role === 'CUSTOMER' ? (
                        <FeedbackForm 
                          onSubmit={(rating, feedback) => onRateTicket(selectedTicket.id, rating, feedback)} 
                        />
                      ) : (
                        <div className="flex items-center justify-center py-6 text-[11px] text-[#94a3b8] font-medium italic">
                          Waiting for customer evaluation...
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="card-label mb-3">Originating Customer</h4>
                    <div className="flex items-center gap-3 p-3 bg-white border border-[#e2e8f0] rounded-lg shadow-sm">
                      <div className="w-9 h-9 rounded-lg bg-[#3b82f6] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {selectedTicket.customerName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0f172a] tracking-tight">{selectedTicket.customerName}</p>
                        <p className="text-[10px] text-[#64748b] font-mono">Cust-ID: {selectedTicket.customerId}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="card-label mb-3">Assigned Agent</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-3 bg-white border border-[#e2e8f0] rounded-lg shadow-sm">
                        {selectedTicket.agentName ? (
                          <>
                            <div className="w-9 h-9 rounded-lg bg-[#10b981] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {selectedTicket.agentName[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#0f172a] tracking-tight">{selectedTicket.agentName}</p>
                              <p className="text-[10px] text-[#64748b] font-mono">Agent-ID: {selectedTicket.agentId}</p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 p-1">
                            <div className="w-9 h-9 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] border-dashed flex items-center justify-center text-[#94a3b8]">
                              <Users className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-medium text-[#94a3b8] italic">Waiting for assignment</span>
                          </div>
                        )}
                      </div>

                      {user.role === 'ADMIN' && (
                        <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                          <label className="text-[9px] font-bold text-[#64748b] uppercase mb-2 block tracking-widest">Administrator Action: Reassign</label>
                          <select 
                            className="w-full bg-white border border-[#e2e8f0] rounded-lg p-2 text-[11px] font-bold text-[#1e293b] outline-none hover:border-[#3b82f6] transition-colors cursor-pointer"
                            value={selectedTicket.agentId || ''}
                            onChange={(e) => onAssignAgent(selectedTicket.id, e.target.value)}
                          >
                            <option value="" disabled>Select Support Agent...</option>
                            {allUsers.filter(u => u.role === 'AGENT').map(agent => (
                              <option key={agent.id} value={agent.id} className={agent.status !== 'AVAILABLE' ? 'text-[#94a3b8]' : ''}>
                                {agent.name} — Status: {agent.status.replace('_', ' ')} {agent.status !== 'AVAILABLE' ? '⚠️' : '✅'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f1f5f9]">
                <h4 className="card-label mb-4 text-[#1e293b] flex items-center gap-2">
                  <Clock className="w-4 h-4 opacity-40" /> Ticket History & Audit Trail
                </h4>
                <div className="space-y-3">
                  {selectedTicket.history.slice().reverse().map((entry, idx) => (
                    <div key={entry.id} className="relative pl-6 pb-2 last:pb-0">
                      {idx !== selectedTicket.history.length - 1 && (
                        <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#e2e8f0]" />
                      )}
                      <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        entry.type === 'creation' ? 'bg-blue-500' :
                        entry.type === 'status' ? 'bg-amber-500' :
                        entry.type === 'assignment' ? 'bg-purple-500' : 'bg-rose-500'
                      }`} />
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 group hover:border-[#cbd5e1] transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-[#1e293b] tracking-tight">{entry.action}</span>
                          <span className="text-[9px] font-mono text-[#94a3b8]">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#64748b] font-medium">Modified by:</span>
                          <span className="text-[10px] font-bold text-[#475569]">{entry.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#f1f5f9]">
                <h4 className="card-label mb-4">System metadata</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <p className="text-[9px] font-bold text-[#94a3b8] uppercase mb-1">Source</p>
                    <p className="text-[10px] font-bold text-[#1e293b]">Web Portal</p>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <p className="text-[9px] font-bold text-[#94a3b8] uppercase mb-1">SLA Tier</p>
                    <p className="text-[10px] font-bold text-[#1e293b]">Enterprise</p>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <p className="text-[9px] font-bold text-[#94a3b8] uppercase mb-1">Last Update</p>
                    <p className="text-[10px] font-bold text-[#1e293b]">8 hours ago</p>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <p className="text-[9px] font-bold text-[#94a3b8] uppercase mb-1">Resolution Time</p>
                    <p className="text-[10px] font-bold text-[#1e293b]">Est. 24h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#f8fafc] border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Read Only Mode</span>
              </div>
              <div className="flex gap-3">
                {user.role !== 'CUSTOMER' && (
                  <div className="relative group/status flex gap-2">
                    <select 
                      className="px-5 py-2.5 bg-[#1e293b] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#0f172a] transition-all shadow-sm outline-none cursor-pointer appearance-none pr-8"
                      value={selectedTicket.status}
                      onChange={(e) => onStatusChange(selectedTicket.id, e.target.value as SupportTicket['status'])}
                    >
                      <option value="NEW">Set NEW</option>
                      <option value="ASSIGNED">Set ASSIGNED</option>
                      <option value="IN_PROGRESS">Set IN_PROGRESS</option>
                      <option value="ON_HOLD">Set ON_HOLD</option>
                      <option value="RESOLVED">Set RESOLVED</option>
                      <option value="CLOSED">Set CLOSED</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white opacity-40">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                )}
                {user.role === 'CUSTOMER' && selectedTicket.status === 'RESOLVED' && (
                  <div className="flex gap-2">
                     <button 
                      onClick={() => onStatusChange(selectedTicket.id, 'CLOSED')}
                      className="px-5 py-2.5 bg-[#10b981] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#059669] transition-all shadow-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept Resolution
                    </button>
                    <button 
                      onClick={() => onStatusChange(selectedTicket.id, 'IN_PROGRESS')}
                      className="px-5 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-amber-50 transition-all shadow-sm flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 rotate-90" /> Reopen Ticket
                    </button>
                  </div>
                )}
                <button 
                  className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475569] hover:bg-[#f1f5f9] transition-all shadow-sm"
                  onClick={onClose}
                >
                  Dismiss
                </button>
                {user.role === 'AGENT' && !selectedTicket.agentId && (
                  <button 
                    onClick={() => onClaimTicket(selectedTicket.id)}
                    className="px-5 py-2.5 bg-[#3b82f6] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#2563eb] transition-all shadow-sm flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Claim Ticket
                  </button>
                )}
                {user.role !== 'CUSTOMER' && !selectedTicket.isEscalated && (
                  <button 
                    onClick={() => onEscalate(selectedTicket.id)}
                    className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Escalate
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
