import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, PlusCircle } from 'lucide-react';
import { SupportTicket } from '../../types';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: string, category: string, priority: SupportTicket['priority'], description: string, dependencyIds: string[]) => void;
  tickets: SupportTicket[];
}

export function AddTicketModal({ isOpen, onClose, onSubmit, tickets }: AddTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [description, setDescription] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [depSearch, setDepSearch] = useState('');

  const toggleDependency = (id: string) => {
    setSelectedDependencies(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onSubmit(subject, category, priority, description, selectedDependencies);
    // Reset form after submission is handled by parent or here if needed
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden p-10 border border-[#e2e8f0] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto pr-2 custom-scrollbar">
              <h2 className="text-xl font-bold text-[#0f172a] mb-1">New Service Ticket</h2>
              <p className="text-[11px] text-[#64748b] mb-8 font-medium uppercase tracking-wider">Formal Ticket Registration</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Protocol Timeout Error"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] placeholder-[#94a3b8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] appearance-none cursor-pointer"
                    >
                      <option>Technical Support</option>
                      <option>Billing Issue</option>
                      <option>Account Sync</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Priority</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] appearance-none cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Detailed Case Notes</label>
                  <textarea 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the technical constraints..."
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none resize-none text-[#1e293b] placeholder-[#94a3b8]"
                  />
                </div>

                <div className="pt-4 border-t border-[#f1f5f9]">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] block mb-2">Link Source Dependencies (Optional)</label>
                  <div className="relative mb-4">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input 
                      type="text"
                      value={depSearch}
                      onChange={(e) => setDepSearch(e.target.value)}
                      placeholder="Search for blockers..."
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 p-3 text-[11px] font-bold uppercase tracking-wider focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] placeholder-[#94a3b8]"
                    />
                    
                    {depSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {tickets
                          .filter(t => !selectedDependencies.includes(t.id) && (t.id.toLowerCase().includes(depSearch.toLowerCase()) || t.subject.toLowerCase().includes(depSearch.toLowerCase())))
                          .map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                toggleDependency(t.id);
                                setDepSearch('');
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-[#f8fafc] border-b last:border-0 border-[#f1f5f9] flex items-center justify-between group"
                            >
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#3b82f6]">{t.id}</span>
                                <span className="text-[11px] font-bold text-[#1e293b] uppercase tracking-tighter">{t.subject}</span>
                              </div>
                              <PlusCircle className="w-4 h-4 text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedDependencies.map(depId => {
                      const depTicket = tickets.find(t => t.id === depId);
                      return (
                        <div key={depId} className="flex items-center gap-2 bg-[#f1f5f9] border border-[#e2e8f0] px-3 py-1.5 rounded-lg group">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-[#3b82f6]">{depId}</span>
                            <span className="text-[9px] font-bold text-[#475569] uppercase tracking-tighter max-w-[120px] truncate">{depTicket?.subject}</span>
                          </div>
                          <button 
                            onClick={() => toggleDependency(depId)}
                            className="p-1 text-[#94a3b8] hover:text-rose-500 transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5 rotate-45" />
                          </button>
                        </div>
                      );
                    })}
                    {selectedDependencies.length === 0 && (
                      <p className="text-[10px] text-[#94a3b8] italic font-medium">No initial blockers selected.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-[#f1f5f9]">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
                >
                  Abort
                </button>
                <button 
                  disabled={!subject || !description}
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-[#3b82f6] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#2563eb] transition-all shadow-sm disabled:opacity-50"
                >
                  Formal Submission
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
