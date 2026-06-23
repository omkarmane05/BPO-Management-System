import React from 'react';
import { motion } from 'motion/react';

interface MenuButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const MenuButton = ({ active, icon, label, onClick }: MenuButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-[#1e293b] text-white shadow-md shadow-[#1e293b]/10' 
          : 'text-gray-500 hover:bg-[#f1f5f9] hover:text-[#1e293b]'
      }`}
    >
      <span className={active ? 'text-[#3b82f6]' : 'text-[#94a3b8] group-hover:text-[#64748b]'}>{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="active-nav" className="ml-auto w-1 h-3 bg-[#3b82f6] rounded-full" />}
    </button>
  );
};
