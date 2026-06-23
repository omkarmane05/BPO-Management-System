import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

export const StatCard = ({ label, value, icon, color = 'blue', onClick }: StatCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm hover:border-[#3b82f6] transition-all group overflow-hidden relative ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg group-hover:bg-white group-hover:border-[#3b82f6] transition-all">
          {icon}
        </div>
        <div className="text-[9px] uppercase font-bold tracking-widest text-[#94a3b8]">Exercise 1</div>
      </div>
      <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1 relative z-10">{label}</p>
      <h3 className="text-2xl font-bold text-[#0f172a] tracking-tight relative z-10">{value}</h3>
      <div className="absolute bottom-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-2 translate-y-2">
        <TrendingUp className="w-16 h-16" />
      </div>
    </div>
  );
};
