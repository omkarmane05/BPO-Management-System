import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface EscalationModalProps {
  id: string | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: (id: string, reason: string) => void;
  isEscalating: boolean;
  validationError: string | null;
  confirming: boolean;
  onConfirmingChange: (confirming: boolean) => void;
  setValidationError: (error: string | null) => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  id,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
  isEscalating,
  validationError,
  confirming,
  onConfirmingChange,
  setValidationError,
}) => {
  if (!id) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden p-8 border border-[#e2e8f0]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center border border-rose-100 shadow-sm">
              {confirming ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">
                {confirming ? 'Confirm Escalation' : 'Escalate Ticket'}
              </h2>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">
                {confirming ? 'Final Verification Step' : 'Management Intervention Required'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {!confirming ? (
              <div>
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest block mb-2 px-1">Reason for Escalation (Mandatory)</label>
                <textarea 
                  autoFocus
                  rows={4}
                  value={reason}
                  onChange={(e) => {
                    onReasonChange(e.target.value);
                    if (e.target.value.trim() && validationError) {
                      setValidationError(null);
                    }
                  }}
                  placeholder="Provide a specific justification for management review..."
                  className={`w-full bg-[#f8fafc] border ${validationError ? 'border-rose-500' : 'border-[#e2e8f0]'} rounded-xl p-4 text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-[#1e293b] placeholder-[#94a3b8] resize-none`}
                />
                {validationError && (
                  <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase px-1 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> {validationError}
                  </p>
                )}
                <p className="mt-2 text-[9px] text-[#94a3b8] font-medium leading-relaxed">
                  Escalating a ticket will automatically bump the priority to URGENT and notify the administrative team for immediate attention.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Escalation Target</span>
                  <span className="text-[11px] font-bold text-[#1e293b] uppercase tracking-tight">{id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest block mb-1">Provided Justification</span>
                  <p className="text-[11px] text-[#475569] leading-relaxed italic border-l-2 border-rose-400 pl-3">
                    "{reason}"
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => {
                  if (confirming) {
                    onConfirmingChange(false);
                  } else {
                    onClose();
                  }
                }}
                className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
              >
                {confirming ? 'Back' : 'Cancel'}
              </button>
              <button 
                disabled={isEscalating}
                onClick={() => {
                  if (!confirming) {
                    if (!reason.trim()) {
                      setValidationError('Reason is mandatory for escalation.');
                      return;
                    }
                    if (reason.trim().length < 10) {
                      setValidationError('Reason must be at least 10 characters.');
                      return;
                    }
                    setValidationError(null);
                    onConfirmingChange(true);
                  } else {
                    onSubmit(id, reason);
                  }
                }}
                className="flex-1 py-3 bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isEscalating ? (
                  <>
                    <Clock className="w-3 h-3 animate-spin" /> Verifying...
                  </>
                ) : (
                  confirming ? 'Final Confirm' : 'Proceed to Confirm'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
