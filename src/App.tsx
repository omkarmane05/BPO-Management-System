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
    category: 'Authentication'
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
    category: 'Billing'
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
    category: 'Feature Request'
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
    category: 'Performance'
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

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAgent, setFilterAgent] = useState<string>('ALL');

  // Auth Handling
  const handleLogin = (role: Role) => {
    const defaultUser = MOCK_USERS.find(u => u.role === role);
    if (defaultUser) setUser(defaultUser);
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
          
          <div className="mt-8 pt-6 border-t border-[#f1f5f9]">
            <p className="text-[10px] text-center text-[#94a3b8] font-bold uppercase tracking-widest leading-none">
              Exercise 5-9 Portfolio
            </p>
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

        <div className="p-3 mt-auto">
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
            <button className="p-1.5 text-white/60 hover:text-white transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
            </button>
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
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-[#e2e8f0] text-center">
                      <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center text-[#94a3b8] mb-4">
                        <Filter className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[#1e293b]">No tickets match your filters</h3>
                      <p className="text-[10px] text-[#64748b] mt-1 uppercase font-bold tracking-wider">Try adjusting your selection or clear all filters</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(view === 'USERS' || view === 'REPORTS') && (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-[1.5px] border-dashed border-[#cbd5e1]">
                <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-[#94a3b8] mb-4 border border-[#e2e8f0]">
                  {view === 'USERS' ? <Users className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
                </div>
                <h3 className="text-base font-bold text-[#1e293b] uppercase tracking-wider mb-2">{view} Section</h3>
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
                    </div>
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
                  <button 
                    className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475569] hover:bg-[#f1f5f9] transition-all shadow-sm"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Dismiss
                  </button>
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
                    placeholder="e.g. Protocol Timeout Error"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] placeholder-[#94a3b8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="card-label block mb-2">Category</label>
                    <select className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] appearance-none cursor-pointer">
                      <option>Technical Support</option>
                      <option>Billing Issue</option>
                      <option>Account Sync</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="card-label block mb-2">Priority</label>
                    <select className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none text-[#1e293b] appearance-none cursor-pointer">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="card-label block mb-2">Detailed Case Notes</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe the technical constraints..."
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none resize-none text-[#1e293b] placeholder-[#94a3b8]"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddingTicket(false)}
                    className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={() => setIsAddingTicket(false)}
                    className="flex-1 py-3 bg-[#3b82f6] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#2563eb] transition-all shadow-sm"
                  >
                    Formal Submission
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
