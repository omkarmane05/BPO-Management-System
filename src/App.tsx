import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Ticket, 
  Users, 
  LayoutDashboard, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCircle, 
  LogOut, 
  Search, 
  Filter,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Settings as SettingsIcon,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  agentId?: string;
  agentName?: string;
  subject: string;
  description: string;
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  category: string;
  isEscalated?: boolean;
  escalationReason?: string;
  history: {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: 'status' | 'assignment' | 'escalation' | 'creation';
  }[];
}

interface AppNotification {
  id: string;
  ticketId: string;
  message: string;
  reason: string;
  timestamp: string;
  read: boolean;
}

// --- Mock Data ---

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', role: 'ADMIN', avatar: 'https://picsum.photos/seed/alex/100/100' },
  { id: '2', name: 'Sam Rivera', email: 'sam@example.com', role: 'AGENT', avatar: 'https://picsum.photos/seed/sam/100/100' },
  { id: '3', name: 'Casey Smith', email: 'casey@example.com', role: 'CUSTOMER', avatar: 'https://picsum.photos/seed/casey/100/100' },
  { id: '4', name: 'Jordan Lee', email: 'jordan@example.com', role: 'AGENT', avatar: 'https://picsum.photos/seed/jordan/100/100' },
];

const INITIAL_TICKETS: SupportTicket[] = [
  { 
    id: 'T-1001', 
    customerId: '3', 
    customerName: 'Casey Smith', 
    agentId: '2', 
    agentName: 'Sam Rivera', 
    subject: 'Cannot login to my account', 
    description: 'Keep getting 403 error when trying to access the portal.', 
    status: 'IN_PROGRESS', 
    priority: 'HIGH', 
    createdAt: '2024-03-20T10:00:00Z',
    category: 'Authentication',
    history: [
      { id: 'h1', action: 'Ticket Created', user: 'Casey Smith', timestamp: '2024-03-20T10:00:00Z', type: 'creation' },
      { id: 'h2', action: 'Assigned to Sam Rivera', user: 'System', timestamp: '2024-03-20T10:05:00Z', type: 'assignment' },
      { id: 'h3', action: 'Status changed to IN_PROGRESS', user: 'Sam Rivera', timestamp: '2024-03-20T11:00:00Z', type: 'status' }
    ]
  },
  { 
    id: 'T-1002', 
    customerId: '3', 
    customerName: 'Casey Smith', 
    subject: 'Billing inquiry', 
    description: 'I was charged twice for the last month subscription.', 
    status: 'NEW', 
    priority: 'MEDIUM', 
    createdAt: '2024-03-21T14:30:00Z',
    category: 'Billing',
    history: [
      { id: 'h4', action: 'Ticket Created', user: 'Casey Smith', timestamp: '2024-03-21T14:30:00Z', type: 'creation' }
    ]
  },
  { 
    id: 'T-1003', 
    customerId: '3', 
    customerName: 'Casey Smith', 
    agentId: '4', 
    agentName: 'Jordan Lee', 
    subject: 'Feature request: Dark Mode', 
    description: 'Please add dark mode support to the mobile app.', 
    status: 'RESOLVED', 
    priority: 'LOW', 
    createdAt: '2024-03-18T09:15:00Z',
    category: 'Feature Request',
    history: [
      { id: 'h5', action: 'Ticket Created', user: 'Casey Smith', timestamp: '2024-03-18T09:15:00Z', type: 'creation' },
      { id: 'h6', action: 'Assigned to Jordan Lee', user: 'System', timestamp: '2024-03-18T10:00:00Z', type: 'assignment' },
      { id: 'h7', action: 'Resolved successfully', user: 'Jordan Lee', timestamp: '2024-03-19T16:00:00Z', type: 'status' }
    ]
  },
  { 
    id: 'T-1004', 
    customerId: '3', 
    customerName: 'Casey Smith', 
    agentId: '2', 
    agentName: 'Sam Rivera', 
    subject: 'Slow API response times', 
    description: 'Endpoints are taking > 2 seconds to respond today.', 
    status: 'ON_HOLD', 
    priority: 'URGENT', 
    createdAt: '2024-03-22T11:20:00Z',
    category: 'Performance',
    history: [
      { id: 'h8', action: 'Ticket Created', user: 'Casey Smith', timestamp: '2024-03-22T11:20:00Z', type: 'creation' },
      { id: 'h9', action: 'Assigned to Sam Rivera', user: 'System', timestamp: '2024-03-22T11:25:00Z', type: 'assignment' }
    ]
  },
];

// --- Components ---

const StatusBadge = ({ status }: { status: SupportTicket['status'] }) => {
  const colors: Record<SupportTicket['status'], string> = {
    NEW: 'bg-blue-100 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-purple-100 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
    ON_HOLD: 'bg-gray-100 text-gray-700 border-gray-200',
    RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const PriorityIcon = ({ priority }: { priority: SupportTicket['priority'] }) => {
  const colors: Record<SupportTicket['priority'], string> = {
    LOW: 'text-gray-400',
    MEDIUM: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-600',
  };

  return <AlertCircle className={`w-4 h-4 ${colors[priority]}`} />;
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [view, setView] = useState<'DASHBOARD' | 'TICKETS' | 'USERS' | 'REPORTS'>('DASHBOARD');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert'} | null>(null);
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [escalationPrompt, setEscalationPrompt] = useState<string | null>(null);
  const [escalationReasonInput, setEscalationReasonInput] = useState('');

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAgent, setFilterAgent] = useState<string>('ALL');

  // Auth Handling
  const handleLogin = (role: Role) => {
    const defaultUser = MOCK_USERS.find(u => u.role === role);
    if (defaultUser) setUser(defaultUser);
    setView('DASHBOARD');
  };

  const handleCreateTicket = (subject: string, category: string, priority: SupportTicket['priority'], description: string) => {
    const timestamp = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `T-${1000 + tickets.length + 1}`,
      customerId: user?.id || 'unknown',
      customerName: user?.name || 'Anonymous',
      subject,
      description,
      status: 'NEW',
      priority,
      createdAt: timestamp,
      category,
      history: [
        { id: Math.random().toString(36).substr(2, 9), action: 'Ticket Created', user: user?.name || 'Anonymous', timestamp, type: 'creation' }
      ]
    };

    setTickets([newTicket, ...tickets]);
    setIsAddingTicket(false);
    setNotification({ message: 'TICKET CREATED SUCCESSFULLY', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEscalate = (id: string, reason: string) => {
    const timestamp = new Date().toISOString();
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action: `Escalated: ${reason}`,
      user: user?.name || 'Unknown',
      timestamp,
      type: 'escalation' as const
    };

    setTickets(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        isEscalated: true, 
        escalationReason: reason,
        priority: (t.priority === 'URGENT' ? 'URGENT' : t.priority === 'HIGH' ? 'URGENT' : 'HIGH') as SupportTicket['priority'],
        history: [...t.history, historyEntry]
      } : t
    ));
    
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      ticketId: id,
      message: `TICKET ${id} ESCALATED`,
      reason: reason,
      timestamp,
      read: false
    };

    setAllNotifications(prev => [newNotif, ...prev]);

    if (selectedTicket?.id === id) {
      setSelectedTicket(prev => prev ? { 
        ...prev, 
        isEscalated: true, 
        escalationReason: reason,
        history: [...prev.history, historyEntry]
      } : null);
    }

    setNotification({ 
      message: `ALERT: TICKET ${id} ESCALATED`, 
      type: 'alert' 
    });
    setEscalationPrompt(null);
    setEscalationReasonInput('');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAssignAgent = (ticketId: string, agentId: string) => {
    const agent = MOCK_USERS.find(u => u.id === agentId);
    if (!agent) return;

    const timestamp = new Date().toISOString();
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action: `Assigned to ${agent.name}`,
      user: user?.name || 'Unknown',
      timestamp,
      type: 'assignment' as const
    };

    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { 
        ...t, 
        agentId: agent.id, 
        agentName: agent.name, 
        status: 'ASSIGNED',
        history: [...t.history, historyEntry]
      } : t
    ));

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { 
        ...prev, 
        agentId: agent.id, 
        agentName: agent.name, 
        status: 'ASSIGNED',
        history: [...prev.history, historyEntry]
      } : null);
    }

    setNotification({ 
      message: `TICKET ${ticketId} ASSIGNED TO ${agent.name.toUpperCase()}`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket['status']) => {
    const timestamp = new Date().toISOString();
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action: `Status changed to ${newStatus}`,
      user: user?.name || 'Unknown',
      timestamp,
      type: 'status' as const
    };

    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { 
        ...t, 
        status: newStatus,
        history: [...t.history, historyEntry]
      } : t
    ));

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { 
        ...prev, 
        status: newStatus,
        history: [...prev.history, historyEntry]
      } : null);
    }

    setNotification({ message: `STATUS UPDATED TO ${newStatus}`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTicket(null);
    setView('DASHBOARD');
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const pending = total - resolved;
    const urgent = tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    
    return { total, resolved, pending, urgent };
  }, [tickets]);

  const chartData = useMemo(() => {
    const categories = Array.from(new Set(tickets.map(t => t.category)));
    return categories.map(cat => ({
      name: cat,
      value: tickets.filter(t => t.category === cat).length
    }));
  }, [tickets]);

  const statusData = useMemo(() => {
    const statuses: SupportTicket['status'][] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
    return statuses.map(s => ({
      status: s,
      count: tickets.filter(t => t.status === s).length
    }));
  }, [tickets]);

  const agents = useMemo(() => {
    return Array.from(new Set(tickets.map(t => t.agentName).filter(Boolean))) as string[];
  }, [tickets]);

  const agentPerformanceData = useMemo(() => {
    return agents.map(name => {
      const agentTickets = tickets.filter(t => t.agentName === name);
      const resolved = agentTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      return {
        name,
        assigned: agentTickets.length,
        resolved,
        avgTime: (Math.random() * 4 + 2).toFixed(1) + 'h' // Simulated avg resolution time
      };
    });
  }, [tickets, agents]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      const matchPriority = filterPriority === 'ALL' || t.priority === filterPriority;
      const matchAgent = filterAgent === 'ALL' || t.agentName === filterAgent;
      return matchStatus && matchPriority && matchAgent;
    });
  }, [tickets, filterStatus, filterPriority, filterAgent]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#1e293b]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-[#3b82f6] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Ticket className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-[#0f172a] mb-1">BPO Management System</h1>
          <p className="text-center text-[#64748b] mb-8 text-xs font-medium uppercase tracking-wider">Engineering Lab Submission</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => handleLogin('ADMIN')}
              className="w-full py-3 bg-[#1e293b] text-white rounded-lg font-semibold hover:bg-[#0f172a] transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4 text-[#3b82f6]" /> Login as Administrator
            </button>
            <button 
              onClick={() => handleLogin('AGENT')}
              className="w-full py-3 bg-white border border-[#e2e8f0] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <Users className="w-4 h-4" /> Login as Support Agent
            </button>
            <button 
              onClick={() => handleLogin('CUSTOMER')}
              className="w-full py-3 bg-white border border-[#e2e8f0] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <UserCircle className="w-4 h-4" /> Login as Customer
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#f1f5f9] flex items-center justify-between">
            <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest leading-none">
              Exercise 5-9 Portfolio
            </p>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">
               <TrendingUp className="w-2.5 h-2.5" />
               <span className="text-[9px] font-bold uppercase tracking-tighter">5 Git Commits</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-[#1e293b]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col hidden md:flex">
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
          <MenuButton 
            active={view === 'DASHBOARD'} 
            onClick={() => setView('DASHBOARD')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Overview"
          />
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
              label="Staff"
            />
          )}
          <MenuButton 
            active={view === 'REPORTS'} 
            onClick={() => setView('REPORTS')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Analytics"
          />
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
              <img src={user.avatar} className="w-8 h-8 rounded-lg border border-[#e2e8f0] shadow-sm" alt={user.name} referrerPolicy="no-referrer" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-[#0f172a] leading-none mb-1">{user.name}</p>
                <p className="text-[10px] text-[#64748b] truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-2 text-[#475569] hover:bg-white hover:text-rose-600 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-transparent hover:border-[#e2e8f0]"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#1e293b] text-white flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold uppercase tracking-widest text-[#94a3b8]">
              {view}
            </h1>
            <div className="h-4 w-px bg-[#334155] mx-2" />
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              CS-302 System Design
            </div>
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`ml-4 flex items-center gap-2 px-3 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${
                  notification.type === 'alert' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {notification.message}
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 focus-within:text-[#3b82f6] transition-colors" />
              <input 
                type="text" 
                placeholder="Quick Search..." 
                className="bg-[#334155] border-transparent focus:bg-[#475569] transition-all rounded-lg pl-9 pr-4 py-1.5 text-xs w-48 outline-none text-white placeholder-white/40"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-1.5 transition-colors relative rounded-lg ${showNotifications ? 'bg-[#334155] text-[#3b82f6]' : 'text-white/60 hover:text-white'}`}
              >
                <Bell className="w-4 h-4" />
                {allNotifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#1e293b]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
                      <h3 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Notifications</h3>
                      {allNotifications.length > 0 && (
                        <button 
                          onClick={() => setAllNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                          className="text-[9px] font-bold text-[#3b82f6] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {allNotifications.length > 0 ? (
                        allNotifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition-colors cursor-pointer ${!n.read ? 'bg-[#3b82f6]/5' : ''}`}
                            onClick={() => {
                              const t = tickets.find(ticket => ticket.id === n.ticketId);
                              if (t) setSelectedTicket(t);
                              setAllNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[10px] font-bold text-[#1e293b] uppercase">{n.message}</p>
                                  <span className="text-[9px] text-[#94a3b8]">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[11px] text-[#475569] line-clamp-2 italic mb-1">"{n.reason}"</p>
                                <p className="text-[9px] text-[#64748b] font-medium uppercase">Management Notice</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-white">
                          <div className="w-10 h-10 bg-[#f8fafc] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#e2e8f0]">
                            <Bell className="w-5 h-5 text-[#94a3b8]" />
                          </div>
                          <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest">System Clear</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {view === 'DASHBOARD' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Tickets" value={stats.total} icon={<Ticket className="w-4 h-4 text-[#3b82f6]" />} />
                  <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-4 h-4 text-[#10b981]" />} />
                  <StatCard label="In Progress" value={stats.pending} icon={<Clock className="w-4 h-4 text-[#f59e0b]" />} />
                  <StatCard label="Critical" value={stats.urgent} icon={<AlertCircle className="w-4 h-4 text-[#ef4444]" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column - Main Stats */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="card-label">Exercise 6: Performance</h3>
                          <h3 className="text-sm font-bold text-[#0f172a]">Ticket Status Lifecycle</h3>
                        </div>
                        <span className="text-[10px] bg-[#f1f5f9] px-2 py-1 rounded-md text-[#64748b] font-bold">Real-time</span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="status" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: '#64748b' }}
                            />
                            <RechartsTooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '10px' }}
                            />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="card-label">Exercise 5: Operations</h3>
                        <h3 className="text-sm font-bold text-[#0f172a]">Primary Actors & Tasks</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="border-[1.5px] border-dashed border-[#cbd5e1] rounded-lg p-3 bg-[#f8fafc] text-center">
                          <p className="text-[11px] font-bold text-[#1e293b] mb-1">Customer</p>
                          <p className="text-[10px] text-[#64748b]">Raise & Track Tickets</p>
                        </div>
                        <div className="border-[1.5px] border-dashed border-[#cbd5e1] rounded-lg p-3 bg-[#f8fafc] text-center">
                          <p className="text-[11px] font-bold text-[#1e293b] mb-1">Agent</p>
                          <p className="text-[10px] text-[#64748b]">Fulfill & Close Tasks</p>
                        </div>
                        <div className="border-[1.5px] border-dashed border-[#cbd5e1] rounded-lg p-3 bg-[#f8fafc] text-center">
                          <p className="text-[11px] font-bold text-[#1e293b] mb-1">Admin</p>
                          <p className="text-[10px] text-[#64748b]">Manage Staff & Logic</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Secondary Analysis */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm h-full flex flex-col">
                      <div className="mb-4">
                        <h3 className="card-label">Categories</h3>
                        <h3 className="text-sm font-bold text-[#0f172a]">Demand Breakdown</h3>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'][index % 5]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full space-y-2 mt-4">
                          {chartData.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'][i % 5] }} />
                                <span className="text-[#64748b] font-medium">{item.name}</span>
                              </div>
                              <span className="font-bold text-[#1e293b]">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Recent Activity Mini-Grid */}
                  <div className="lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                    <h3 className="card-label mb-4">Latest Submissions</h3>
                    <div className="space-y-2">
                      {tickets.slice(0, 3).map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTicket(t)}
                          className="flex items-center justify-between p-3 hover:bg-[#f8fafc] rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-[#f1f5f9]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-[#1e293b]">{t.subject}</p>
                              <p className="text-[9px] text-[#94a3b8] uppercase tracking-wider font-bold">Category: {t.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={t.status} />
                            <ChevronRight className="w-3 h-3 text-[#cbd5e1]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Detail Footer Card */}
                  <div className="lg:col-span-4 bg-[#f1f5f9] rounded-xl border border-[#e2e8f0] p-6 relative overflow-hidden group">
                     <div className="relative z-10 h-full flex flex-col">
                        <h3 className="card-label text-[#475569]">Implementation</h3>
                        <p className="text-[11px] mt-2 text-[#475569] leading-relaxed">
                          <strong>Tech Stack:</strong> Frontend (React/Tailwind), Backend (FastAPI), Database (SQLite).
                        </p>
                        <div className="mt-auto bg-white p-3 rounded-lg border border-[#e2e8f0] font-mono text-[9px] text-[#64748b]">
                             <div className="text-blue-600">class</div> Ticket(models.Model):<br/>
                             &nbsp;&nbsp;id = UUIDField()<br/>
                             &nbsp;&nbsp;status = CharField()
                        </div>
                     </div>
                     <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/40 blur-2xl rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'TICKETS' && (
              <motion.div 
                key="tickets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm">
                   <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                      <Filter className="w-3.5 h-3.5 text-[#64748b]" />
                      <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Filters</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
                      >
                        <option value="ALL">All Status</option>
                        <option value="NEW">New</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>

                      <select 
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
                      >
                        <option value="ALL">All Priority</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>

                      <select 
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                        className="bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
                      >
                        <option value="ALL">All Agents</option>
                        {agents.map(agent => (
                          <option key={agent} value={agent}>{agent}</option>
                        ))}
                      </select>

                      {(filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterAgent !== 'ALL') && (
                        <button 
                          onClick={() => {
                            setFilterStatus('ALL');
                            setFilterPriority('ALL');
                            setFilterAgent('ALL');
                          }}
                          className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider hover:underline px-2"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                   </div>
                   <button 
                    onClick={() => setIsAddingTicket(true)}
                    className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#2563eb] transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                   >
                    <PlusCircle className="w-3.5 h-3.5" /> Raise Ticket
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map(t => (
                      <motion.div 
                        key={t.id} 
                        layoutId={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm hover:border-[#3b82f6] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg flex items-center justify-center shadow-inner">
                            <PriorityIcon priority={t.priority} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[#64748b] font-bold uppercase">{t.id}</span>
                              <h4 className="text-sm font-bold text-[#0f172a]">{t.subject}</h4>
                            </div>
                            <p className="text-[11px] text-[#64748b] line-clamp-1">{t.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0">
                          {t.isEscalated && (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">Escalated</span>
                            </div>
                          )}
                          <div className="text-right hidden lg:block">
                            <p className="text-[10px] font-bold text-[#1e293b] uppercase tracking-wide">{t.category}</p>
                            <p className="text-[9px] text-[#94a3b8] uppercase font-bold">Category</p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] font-bold text-[#1e293b] uppercase tracking-wide">{t.agentName || 'Unassigned'}</p>
                            <p className="text-[9px] text-[#94a3b8] uppercase font-bold">Assignee</p>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-[#e2e8f0] text-center shadow-sm"
                    >
                      <div className="relative mb-6">
                        <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-[#94a3b8] border border-[#e2e8f0] relative z-10">
                          <Search className="w-8 h-8 opacity-20 absolute" />
                          <Filter className="w-7 h-7" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm z-20">
                          <PlusCircle className="w-3 h-3 rotate-45" />
                        </div>
                        <div className="absolute inset-0 bg-[#3b82f6]/5 blur-2xl rounded-full scale-150 animate-pulse" />
                      </div>
                      
                      <h3 className="text-base font-bold text-[#1e293b] mb-2 uppercase tracking-tight">No tickets match your filters</h3>
                      <p className="text-[11px] text-[#64748b] max-w-[320px] mb-8 font-medium leading-relaxed">
                        We couldn't find any results for your current selection. 
                        Try <span className="text-[#3b82f6] font-bold">broadening your search</span> by adjusting the filters above, or <span className="text-[#3b82f6] font-bold">create a new ticket</span> to resolve your issue.
                        
                        <span className="block mt-4 font-mono text-[9px] bg-[#f1f5f9] px-2 py-1.5 rounded inline-block border border-[#e2e8f0]">
                          Active: {[
                            filterStatus !== 'ALL' && `Status(${filterStatus})`,
                            filterPriority !== 'ALL' && `Priority(${filterPriority})`,
                            filterAgent !== 'ALL' && `Agent(${filterAgent})`
                          ].filter(Boolean).join(' • ') || 'None'}
                        </span>
                      </p>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setFilterStatus('ALL');
                            setFilterPriority('ALL');
                            setFilterAgent('ALL');
                          }}
                          className="px-6 py-2.5 bg-[#1e293b] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#0f172a] transition-all shadow-md shadow-[#1e293b]/10 flex items-center gap-2"
                        >
                          Reset Filters
                        </button>
                        <button 
                          onClick={() => setIsAddingTicket(true)}
                          className="px-6 py-2.5 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
                        >
                          New Ticket
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'REPORTS' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Performance Chart */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                    <div className="mb-6">
                      <h3 className="card-label">Performance Metrics</h3>
                      <h3 className="text-base font-bold text-[#1e293b]">Resolved Tickets by Agent</h3>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agentPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b' }}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }}
                          />
                          <Bar dataKey="resolved" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} label={{ position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Performance Table */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#e2e8f0]">
                      <h3 className="card-label">Detailed Analysis</h3>
                      <h3 className="text-base font-bold text-[#1e293b]">Agent Performance Index</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Agent Name</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Assigned</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Resolved</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Resolution Rate</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Avg. Handle Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9]">
                          {agentPerformanceData.map((agent) => (
                            <tr key={agent.name} className="hover:bg-[#f8fafc] transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#3b82f6] font-bold text-[10px] border border-[#e2e8f0] group-hover:border-[#3b82f6] transition-colors">
                                    {agent.name.charAt(0)}
                                  </div>
                                  <span className="text-xs font-bold text-[#1e293b]">{agent.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-[11px] font-bold text-[#1e293b]">{agent.assigned}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-[11px] font-bold text-[#10b981]">{agent.resolved}</span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-bold text-[#1e293b]">
                                    {Math.round((agent.resolved / (agent.assigned || 1)) * 100)}%
                                  </span>
                                  <div className="w-16 h-1 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#e2e8f0]">
                                    <div 
                                      className="h-full bg-[#10b981] rounded-full transition-all duration-1000" 
                                      style={{ width: `${(agent.resolved / (agent.assigned || 1)) * 100}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-md">
                                  <Clock className="w-3 h-3 text-[#64748b]" />
                                  <span className="text-[10px] font-bold text-[#1e293b] font-mono">{agent.avgTime}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'USERS' && (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-[1.5px] border-dashed border-[#cbd5e1]">
                <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-[#94a3b8] mb-4 border border-[#e2e8f0]">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#1e293b] uppercase tracking-wider mb-2">USERS Section</h3>
                <p className="text-[#64748b] text-[11px] text-center max-w-sm font-medium">
                  This module is documented in the Exercise portfolio and scheduled for full production deployment in the next sprint.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Ticket Detail Modal Overlay */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
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
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-1 hover:bg-white rounded-lg transition-colors text-[#94a3b8] border border-transparent hover:border-[#e2e8f0]"
                  >
                    <PlusCircle className="w-5 h-5 rotate-45" />
                  </button>
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
                              onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                            >
                              <option value="" disabled>Select Support Agent...</option>
                              {MOCK_USERS.filter(u => u.role === 'AGENT').map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name} (Support)</option>
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
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as SupportTicket['status'])}
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
                  <button 
                    className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475569] hover:bg-[#f1f5f9] transition-all shadow-sm"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Dismiss
                  </button>
                  {user.role !== 'CUSTOMER' && !selectedTicket.isEscalated && (
                    <div className="flex gap-2">
                       {escalationPrompt === selectedTicket.id ? (
                         <div className="flex gap-2 items-center bg-white border border-[#e2e8f0] p-1 rounded-lg">
                           <input 
                            autoFocus
                            value={escalationReasonInput}
                            onChange={(e) => setEscalationReasonInput(e.target.value)}
                            placeholder="Reason for escalation..."
                            className="bg-transparent text-[10px] px-2 outline-none w-48 text-[#1e293b]"
                           />
                           <button 
                            disabled={!escalationReasonInput.trim()}
                            onClick={() => handleEscalate(selectedTicket.id, escalationReasonInput)}
                            className="px-3 py-1.5 bg-rose-500 text-white rounded text-[9px] font-bold uppercase transition-colors disabled:opacity-50"
                           >
                            Confirm
                           </button>
                           <button 
                            onClick={() => setEscalationPrompt(null)}
                            className="px-3 py-1.5 bg-[#f1f5f9] text-[#64748b] rounded text-[9px] font-bold uppercase"
                           >
                            Cancel
                           </button>
                         </div>
                       ) : (
                        <button 
                          onClick={() => setEscalationPrompt(selectedTicket.id)}
                          className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2"
                        >
                          <TrendingUp className="w-3.5 h-3.5" /> Escalate
                        </button>
                       )}
                    </div>
                  )}
                  {user.role !== 'CUSTOMER' && (
                    <button className="px-5 py-2.5 bg-[#1e293b] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#0f172a] transition-all shadow-sm">
                      Modify Status
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Ticket Modal */}
      <AnimatePresence>
        {isAddingTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsAddingTicket(false)}
          >
            <ModalContent
              onClose={() => setIsAddingTicket(false)}
              onSubmit={handleCreateTicket}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalContent({ onClose, onSubmit }: { onClose: () => void, onSubmit: (subject: string, category: string, priority: SupportTicket['priority'], description: string) => void }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [description, setDescription] = useState('');

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden p-10 border border-[#e2e8f0]"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold text-[#0f172a] mb-1">New Service Ticket</h2>
      <p className="text-[11px] text-[#64748b] mb-8 font-medium uppercase tracking-wider">Exercise 2: System Interaction</p>
      
      <div className="space-y-6">
        <div>
          <label className="card-label block mb-2">Subject</label>
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
            <label className="card-label block mb-2">Category</label>
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
            <label className="card-label block mb-2">Priority</label>
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
          <label className="card-label block mb-2">Detailed Case Notes</label>
          <textarea 
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the technical constraints..."
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none resize-none text-[#1e293b] placeholder-[#94a3b8]"
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
          >
            Abort
          </button>
          <button 
            disabled={!subject || !description}
            onClick={() => onSubmit(subject, category, priority, description)}
            className="flex-1 py-3 bg-[#3b82f6] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#2563eb] transition-all shadow-sm disabled:opacity-50"
          >
            Formal Submission
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Helper Components ---

function MenuButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
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
}

function StatCard({ label, value, icon, color = 'blue' }: { label: string, value: number, icon: React.ReactNode, color?: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm hover:border-[#3b82f6] transition-all group overflow-hidden relative">
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
}
