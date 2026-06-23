import React from 'react';
import { Ticket, LayoutDashboard, Users, TrendingUp, UserCircle, LogOut, Shield } from 'lucide-react';
import { User, AvailabilityStatus, ViewType } from '../../types';
import { MenuButton } from './MenuButton';

interface SidebarProps {
  user: User;
  view: ViewType;
  setView: (view: ViewType) => void;
  handleUserStatusUpdate: (status: AvailabilityStatus) => void;
  handleLogout: () => void;
}

export const Sidebar = ({
  user,
  view,
  setView,
  handleUserStatusUpdate,
  handleLogout
}: SidebarProps) => {
  return (
    <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col hidden md:flex h-screen shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center text-white shadow-sm">
          <Ticket className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-[#0f172a] text-sm tracking-tight leading-none mb-1">BPO Connect</h2>
          <p className="text-[9px] uppercase tracking-wider text-[#64748b] font-bold">{user.role} PORTAL</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {user.role === 'ADMIN' ? (
          <MenuButton 
            active={view === 'ADMIN_DASHBOARD'} 
            onClick={() => setView('ADMIN_DASHBOARD')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Admin Dashboard"
          />
        ) : (
          <MenuButton 
            active={view === 'DASHBOARD'} 
            onClick={() => setView('DASHBOARD')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Overview"
          />
        )}
        
        <MenuButton 
          active={view === 'TICKETS'} 
          onClick={() => setView('TICKETS')}
          icon={<Ticket className="w-4 h-4" />}
          label="Tickets"
        />
        {user.role === 'ADMIN' && (
          <MenuButton 
            active={view === 'USERS'} 
            onClick={() => setView('USERS')}
            icon={<Users className="w-4 h-4" />}
            label="Staff Management"
          />
        )}
        <MenuButton 
          active={view === 'REPORTS'} 
          onClick={() => setView('REPORTS')}
          icon={<TrendingUp className="w-4 h-4" />}
          label="Analytics"
        />
        <MenuButton 
          active={view === 'PROFILE'} 
          onClick={() => setView('PROFILE')}
          icon={<UserCircle className="w-4 h-4" />}
          label="My Profile"
        />
        {user.role === 'ADMIN' && (
          <MenuButton 
            active={view === 'SECURITY'} 
            onClick={() => setView('SECURITY')}
            icon={<Shield className="w-4 h-4" />}
            label="Security & Audit"
          />
        )}
      </nav>

      <div className="p-3 mt-auto space-y-3">
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">Git History</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1e293b] rounded flex items-center justify-center text-white">
              <span className="text-[10px] font-bold font-mono">05</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[#1e293b] leading-tight">Master Branch</p>
              <p className="text-[9px] text-[#64748b]">5 Validated Commits</p>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <img src={user.avatar} className="w-8 h-8 rounded-lg border border-[#e2e8f0] shadow-sm" alt={user.name} referrerPolicy="no-referrer" />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                user.status === 'AVAILABLE' ? 'bg-emerald-500' :
                user.status === 'ON_BREAK' ? 'bg-amber-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-[#0f172a] leading-none mb-1">{user.name}</p>
              <div className="flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full ${
                  user.status === 'AVAILABLE' ? 'bg-emerald-500' :
                  user.status === 'ON_BREAK' ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
                <p className="text-[9px] text-[#64748b] truncate uppercase font-bold tracking-tighter">{user.status.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {user.role === 'AGENT' && (
            <div className="mb-3 space-y-1">
              <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1 mb-1">Set Availability</p>
              <div className="grid grid-cols-3 gap-1">
                {(['AVAILABLE', 'ON_BREAK', 'OFFLINE'] as AvailabilityStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUserStatusUpdate(s)}
                    className={`py-1 rounded text-[8px] font-bold transition-all border ${
                      user.status === s 
                        ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm' 
                        : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]'
                    }`}
                  >
                    {s === 'ON_BREAK' ? 'BREAK' : s.replace('AVAILABLE', 'ONLINE').replace('OFFLINE', 'OFF')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="w-full py-2 text-[#475569] hover:bg-white hover:text-rose-600 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-transparent hover:border-[#e2e8f0]"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};
