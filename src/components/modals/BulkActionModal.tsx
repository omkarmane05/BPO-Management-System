import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { SupportTicket, User } from '../../types';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicketIds: string[];
  actionType: 'status' | 'assignment' | null;
  actionValue: string | null;
  allUsers: User[];
  onExecute: () => void;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  selectedTicketIds,
  actionType,
  actionValue,
  allUsers,
  onExecute,
}) => {
  if (!isOpen || !actionType || !actionValue) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 border border-[#e2e8f0]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#3b82f6]/10 text-[#3b82f6] rounded-xl flex items-center justify-center border border-[#3b82f6]/20 shadow-sm">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">Confirm Bulk Action</h2>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest leading-none">Security Validation Interface</p>
            </div>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e2e8f0]">
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Targets</span>
              <span className="text-[11px] font-bold text-[#1e293b]">{selectedTicketIds.length} Tickets</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Operation</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#3b82f6] uppercase">
                  {actionType === 'status' ? 'Status Update' : 'Assignment'}
                </span>
                <ChevronRight className="w-3 h-3 text-[#cbd5e1]" />
                <span className="text-[11px] font-bold text-[#1e293b] uppercase">
                  {actionType === 'status' 
                    ? actionValue.replace('_', ' ') 
                    : (allUsers.find(u => u.id === actionValue)?.name || 'Unknown')}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#64748b] mb-8 leading-relaxed italic border-l-2 border-[#3b82f6] pl-4">
            This operation will trigger automated email notifications and audit logs for all selected entities. Ensure the status transition aligns with organizational protocol.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={onExecute}
              className="flex-1 py-3 bg-[#1e293b] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#0f172a] transition-all shadow-md"
            >
              Execute Batch
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
