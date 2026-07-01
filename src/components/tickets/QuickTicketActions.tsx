import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal, 
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { SupportTicket, User } from '../../types';

interface QuickTicketActionsProps {
  ticket: SupportTicket;
  allUsers: User[];
  currentUser: User;
  onStatusChange: (ticketId: string, status: SupportTicket['status']) => void;
  onAssignAgent: (ticketId: string, agentId: string) => void;
}

export const QuickTicketActions: React.FC<QuickTicketActionsProps> = ({
  ticket,
  allUsers,
  currentUser,
  onStatusChange,
  onAssignAgent
}) => {
  const [activeMenu, setActiveMenu] = useState<'status' | 'assign' | null>(null);

  const statuses: SupportTicket['status'][] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
  const agents = allUsers.filter(u => u.role === 'AGENT');

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'status' ? null : 'status')}
          className="p-1.5 bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] hover:text-[#3b82f6] hover:border-[#3b82f6]/30 hover:bg-[#3b82f6]/5 transition-all shadow-sm"
          title="Change Status"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        <AnimatePresence>
          {activeMenu === 'status' && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute right-0 bottom-full mb-2 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-1.5 min-w-[140px] grid grid-cols-1 gap-1"
            >
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(ticket.id, s);
                    setActiveMenu(null);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    ticket.status === s 
                      ? 'bg-[#3b82f6] text-white' 
                      : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]'
                  }`}
                >
                  {s.replace('_', ' ')}
                  {ticket.status === s && <CheckCircle2 className="w-3 h-3" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentUser.role === 'ADMIN' && (
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'assign' ? null : 'assign')}
            className="p-1.5 bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] hover:text-[#10b981] hover:border-[#10b981]/30 hover:bg-[#10b981]/5 transition-all shadow-sm"
            title="Assign Agent"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {activeMenu === 'assign' && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 bottom-full mb-2 z-50 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-1.5 min-w-[160px] max-h-[200px] overflow-y-auto"
              >
                <div className="px-2 py-1.5 mb-1 border-b border-[#f1f5f9]">
                  <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest">Select Agent</p>
                </div>
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onAssignAgent(ticket.id, agent.id);
                      setActiveMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      ticket.agentId === agent.id 
                        ? 'bg-[#10b981] text-white' 
                        : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#1e293b]'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="truncate">{agent.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
