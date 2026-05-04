import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
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
  Bell,
  Star,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';
type AvailabilityStatus = 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE';

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  type: 'TICKET_CREATED' | 'TICKET_ASSIGNED' | 'TICKET_RESOLVED' | 'STATUS_UPDATE' | 'ESCALATION';
  ticketId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: AvailabilityStatus;
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
  rating?: number;
  feedback?: string;
  dependencyIds?: string[];
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
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', role: 'ADMIN', avatar: 'https://picsum.photos/seed/alex/100/100', status: 'AVAILABLE' },
  { id: '2', name: 'Sam Rivera', email: 'sam@example.com', role: 'AGENT', avatar: 'https://picsum.photos/seed/sam/100/100', status: 'AVAILABLE' },
  { id: '3', name: 'Casey Smith', email: 'casey@example.com', role: 'CUSTOMER', avatar: 'https://picsum.photos/seed/casey/100/100', status: 'AVAILABLE' },
  { id: '4', name: 'Jordan Lee', email: 'jordan@example.com', role: 'AGENT', avatar: 'https://picsum.photos/seed/jordan/100/100', status: 'OFFLINE' },
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
    dependencyIds: [],
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
    dependencyIds: [],
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
    dependencyIds: [],
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
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [view, setView] = useState<'DASHBOARD' | 'TICKETS' | 'USERS' | 'REPORTS' | 'ADMIN_DASHBOARD'>('DASHBOARD');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert'} | null>(null);
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [escalationPrompt, setEscalationPrompt] = useState<string | null>(null);
  const [escalationReasonInput, setEscalationReasonInput] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationValidationError, setEscalationValidationError] = useState<string | null>(null);
  const [escalationConfirming, setEscalationConfirming] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkActionModal, setBulkActionModal] = useState<{ type: 'status' | 'assign', value: string } | null>(null);

  const toggleSelectTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (newStatus: SupportTicket['status']) => {
    // Check if any selected tickets are blocked
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      const blockedTickets = tickets.filter(t => 
        selectedTicketIds.includes(t.id) && getBlockers(t).length > 0
      );

      if (blockedTickets.length > 0) {
        setNotification({ 
          message: `BULK OPERATION PARTIALLY BLOCKED: ${blockedTickets.length} TICKET(S) HAVE UNRESOLVED DEPENDENCIES`, 
          type: 'alert' 
        });
        setTimeout(() => setNotification(null), 5000);
        // We can either stop the whole operation or filter them out.
        // Let's filter them out and proceed with the rest.
      }
    }

    const timestamp = new Date().toISOString();
    
    setTickets(prev => prev.map(t => {
      if (selectedTicketIds.includes(t.id)) {
        // Skip if blocked and trying to close
        if ((newStatus === 'RESOLVED' || newStatus === 'CLOSED') && getBlockers(t).length > 0) {
          return t;
        }

        const historyEntry = {
          id: Math.random().toString(36).substr(2, 9),
          action: `Bulk Status Change to ${newStatus}`,
          user: user?.name || 'System',
          timestamp,
          type: 'status' as const
        };
        
        // Notification for each ticket
        const customer = allUsers.find(u => u.id === t.customerId);
        if (customer) {
          sendSimulatedEmail({
            recipient: customer.email,
            subject: `Bulk Update: Ticket ${t.id}`,
            body: `Hello ${customer.name},\n\nThe status of your ticket "${t.subject}" has been updated to: ${newStatus} as part of a bulk operation.`,
            type: newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? 'TICKET_RESOLVED' : 'STATUS_UPDATE',
            ticketId: t.id
          });
        }
        
        return { ...t, status: newStatus, history: [...t.history, historyEntry] };
      }
      return t;
    }));

    setNotification({ message: `EXECUTED BULK STATUS CHANGE FOR ${selectedTicketIds.length} TICKETS`, type: 'success' });
    setSelectedTicketIds([]);
    setBulkActionModal(null);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleBulkAssign = (agentId: string) => {
    const agent = allUsers.find(u => u.id === agentId);
    if (!agent) return;
    
    const timestamp = new Date().toISOString();

    setTickets(prev => prev.map(t => {
      if (selectedTicketIds.includes(t.id)) {
        const historyEntry = {
          id: Math.random().toString(36).substr(2, 9),
          action: `Bulk Assigned to ${agent.name}`,
          user: user?.name || 'System',
          timestamp,
          type: 'assignment' as const
        };

        // Emails
        sendSimulatedEmail({
          recipient: agent.email,
          subject: `Bulk Assignment: Ticket ${t.id}`,
          body: `Hello ${agent.name},\n\nYou have been bulk-assigned to ticket ${t.id}: "${t.subject}"`,
          type: 'TICKET_ASSIGNED',
          ticketId: t.id
        });

        const customer = allUsers.find(u => u.id === t.customerId);
        if (customer) {
          sendSimulatedEmail({
            recipient: customer.email,
            subject: `Agent Assigned: Ticket ${t.id}`,
            body: `Hello ${customer.name},\n\nSupport Agent ${agent.name} has been assigned to your ticket via bulk operation.`,
            type: 'TICKET_ASSIGNED',
            ticketId: t.id
          });
        }

        return { ...t, agentId: agent.id, agentName: agent.name, status: 'ASSIGNED' as const, history: [...t.history, historyEntry] };
      }
      return t;
    }));

    setNotification({ message: `EXECUTED BULK ASSIGNMENT TO ${agent.name.toUpperCase()}`, type: 'success' });
    setSelectedTicketIds([]);
    setBulkActionModal(null);
    setTimeout(() => setNotification(null), 5000);
  };

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAgent, setFilterAgent] = useState<string>('ALL');
  const [filterCustomer, setFilterCustomer] = useState<string>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterAgentStatus, setFilterAgentStatus] = useState<string>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [depSearch, setDepSearch] = useState('');

  // Auth Handling
  const handleLogin = (role: Role) => {
    const defaultUser = allUsers.find(u => u.role === role);
    if (defaultUser) setUser(defaultUser);
    if (role === 'ADMIN') {
      setView('ADMIN_DASHBOARD');
    } else {
      setView('DASHBOARD');
    }
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

    // Email Notifications
    sendSimulatedEmail({
      recipient: user?.email || 'customer@example.com',
      subject: `Ticket Received: ${subject}`,
      body: `Hello ${user?.name || 'Customer'},\n\nWe have received your ticket "${subject}". Our team will review it shortly.\n\nTicket ID: ${newTicket.id}`,
      type: 'TICKET_CREATED',
      ticketId: newTicket.id
    });

    const admin = allUsers.find(u => u.role === 'ADMIN');
    if (admin) {
      sendSimulatedEmail({
        recipient: admin.email,
        subject: `ACTION REQUIRED: New Ticket ${newTicket.id}`,
        body: `A new ticket has been created by ${user?.name}.\n\nSubject: ${subject}\nPriority: ${priority}`,
        type: 'TICKET_CREATED',
        ticketId: newTicket.id
      });
    }

    setNotification({ message: 'TICKET CREATED & NOTIFICATIONS SENT', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEscalate = async (id: string, reason: string) => {
    setIsEscalating(true);
    try {
      // Server-side validation call
      const response = await fetch(`/api/tickets/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        setNotification({ 
          message: data.error || 'SERVER VALIDATION ERROR', 
          type: 'alert' 
        });
        setTimeout(() => setNotification(null), 5000);
        setIsEscalating(false);
        return;
      }
      
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

      const admin = allUsers.find(u => u.role === 'ADMIN');
      if (admin) {
        sendSimulatedEmail({
          recipient: admin.email,
          subject: `CRITICAL ESCALATION: ${id}`,
          body: `Ticket ${id} has been escalated by ${user?.name}.\n\nReason: ${reason}`,
          type: 'ESCALATION',
          ticketId: id
        });
      }

      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => prev ? { 
          ...prev, 
          isEscalated: true, 
          escalationReason: reason,
          history: [...prev.history, historyEntry]
        } : null);
      }

      setNotification({ 
        message: data.message || `ALERT: TICKET ${id} ESCALATED`, 
        type: 'success' 
      });
      setEscalationPrompt(null);
      setEscalationReasonInput('');
      setEscalationConfirming(false);
      setEscalationValidationError(null);
    } catch (error) {
      setNotification({ 
        message: 'NETWORK ERROR: COULD NOT CONNECT TO VALIDATION SERVER', 
        type: 'alert' 
      });
    } finally {
      setIsEscalating(false);
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAssignAgent = (ticketId: string, agentId: string) => {
    const agent = allUsers.find(u => u.id === agentId);
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

    // Email Notifications
    sendSimulatedEmail({
      recipient: agent.email,
      subject: `New Assignment: Ticket ${ticketId}`,
      body: `Hello ${agent.name},\n\nYou have been assigned to ticket ${ticketId}: "${tickets.find(t => t.id === ticketId)?.subject}"`,
      type: 'TICKET_ASSIGNED',
      ticketId: ticketId
    });

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const customer = allUsers.find(u => u.id === ticket.customerId);
      if (customer) {
        sendSimulatedEmail({
          recipient: customer.email,
          subject: `Agent Assigned: Ticket ${ticketId}`,
          body: `Hello ${customer.name},\n\nSupport Agent ${agent.name} has been assigned to your ticket.`,
          type: 'TICKET_ASSIGNED',
          ticketId: ticketId
        });
      }
    }

    setTimeout(() => setNotification(null), 5000);
  };

  const handleClaimTicket = (ticketId: string) => {
    if (!user || user.role !== 'AGENT') return;
    if (user.status !== 'AVAILABLE') {
      setNotification({ message: 'MUST BE ONLINE TO CLAIM TICKETS', type: 'alert' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const timestamp = new Date().toISOString();
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action: `Ticket claimed by Agent`,
      user: user.name,
      timestamp,
      type: 'assignment' as const
    };

    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { 
        ...t, 
        agentId: user.id, 
        status: 'ASSIGNED' as const,
        history: [...t.history, historyEntry] 
      } : t
    ));

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { 
        ...prev, 
        agentId: user!.id, 
        status: 'ASSIGNED' as const,
        history: [...prev.history, historyEntry] 
      } : null);
    }

    // Notifications
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const customer = allUsers.find(u => u.id === ticket.customerId);
      if (customer) {
        sendSimulatedEmail({
          recipient: customer.email,
          subject: `Agent Assigned: Ticket ${ticketId}`,
          body: `Hello ${customer.name},\n\nSupport Agent ${user.name} has claimed your ticket and is starting a review.`,
          type: 'TICKET_ASSIGNED',
          ticketId: ticketId
        });
      }
    }

    setNotification({ message: 'TICKET CLAIMED SUCCESSFULLY', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const getBlockers = (ticket: SupportTicket) => {
    if (!ticket.dependencyIds || ticket.dependencyIds.length === 0) return [];
    return tickets.filter(t => 
      ticket.dependencyIds?.includes(t.id) && 
      t.status !== 'RESOLVED' && 
      t.status !== 'CLOSED'
    );
  };

  const toggleDependency = (targetTicketId: string, dependencyId: string) => {
    // Prevent self-dependency
    if (targetTicketId === dependencyId) return;

    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.id === targetTicketId) {
          const currentDeps = t.dependencyIds || [];
          const newDeps = currentDeps.includes(dependencyId)
            ? currentDeps.filter(id => id !== dependencyId)
            : [...currentDeps, dependencyId];
          
          const updatedTicket = { ...t, dependencyIds: newDeps };
          
          // Update selectedTicket if it's the one being modified
          if (selectedTicket?.id === targetTicketId) {
            setSelectedTicket(updatedTicket);
          }
          
          return updatedTicket;
        }
        return t;
      });
      return updated;
    });
  };

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket['status']) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Dependency check for RESOLVED or CLOSED
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      const blockers = getBlockers(ticket);
      if (blockers.length > 0) {
        setNotification({ 
          message: `CANNOT CLOSE: BLOCKED BY ${blockers.length} TICKET(S) (${blockers.map(b => b.id).join(', ')})`, 
          type: 'alert' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }
    }

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

    // Email Notifications
    if (ticket) {
      const customer = allUsers.find(u => u.id === ticket.customerId);
      if (customer) {
        sendSimulatedEmail({
          recipient: customer.email,
          subject: `Status Update: Ticket ${ticketId}`,
          body: `Hello ${customer.name},\n\nThe status of your ticket "${ticket.subject}" has been updated to: ${newStatus}`,
          type: newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? 'TICKET_RESOLVED' : 'STATUS_UPDATE',
          ticketId: ticketId
        });
      }
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleUserStatusUpdate = (status: AvailabilityStatus) => {
    if (!user) return;
    const updatedUser = { ...user, status };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    
    setNotification({ 
      message: `AVAILABILITY UPDATED TO ${status}`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleRateTicket = (ticketId: string, rating: number, feedback: string) => {
    const timestamp = new Date().toISOString();
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action: `Customer rated ticket: ${rating} Stars`,
      user: user?.name || 'Customer',
      timestamp,
      type: 'status' as const
    };

    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, rating, feedback, history: [...t.history, historyEntry] } : t
    ));

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, rating, feedback, history: [...prev.history, historyEntry] } : null);
    }

    setNotification({ message: 'THANK YOU FOR YOUR FEEDBACK', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTicket(null);
    setView('DASHBOARD');
  };

  const sendSimulatedEmail = (log: Omit<EmailLog, 'id' | 'timestamp'>) => {
    const newLog: EmailLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setEmailLogs(prev => [newLog, ...prev]);
    
    // Also show a temporary visual feedback for the user
    setNotification({ 
      message: `EMAIL DISPATCHED TO ${log.recipient.toUpperCase()}`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
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
    // 1. Pre-filter by Search Command Syntax (is:, status:, @, etc.)
    let baseSearch = searchQuery;
    let overrideFilters = {
      status: 'ALL',
      priority: 'ALL',
      agent: 'ALL'
    };

    const statusMatch = baseSearch.match(/status:([a-zA-Z_]+)/i);
    if (statusMatch) {
      overrideFilters.status = statusMatch[1].toUpperCase();
      baseSearch = baseSearch.replace(statusMatch[0], '').trim();
    }

    const priorityMatch = baseSearch.match(/is:([a-zA-Z_]+)/i);
    if (priorityMatch) {
      overrideFilters.priority = priorityMatch[1].toUpperCase();
      baseSearch = baseSearch.replace(priorityMatch[0], '').trim();
    }

    const agentMatch = baseSearch.match(/@([a-zA-Z0-9_\s]+)/i);
    if (agentMatch) {
      overrideFilters.agent = agentMatch[1].trim();
      baseSearch = baseSearch.replace(agentMatch[0], '').trim();
    }

    const effectiveStatus = overrideFilters.status !== 'ALL' ? overrideFilters.status : filterStatus;
    const effectivePriority = overrideFilters.priority !== 'ALL' ? overrideFilters.priority : filterPriority;
    const effectiveAgent = overrideFilters.agent !== 'ALL' ? overrideFilters.agent : filterAgent;

    // 2. Perform Standard Filtering
    const preFiltered = tickets.filter(t => {
      const matchStatus = effectiveStatus === 'ALL' || t.status === effectiveStatus;
      const matchPriority = effectivePriority === 'ALL' || t.priority === effectivePriority;
      const matchAgent = effectiveAgent === 'ALL' || t.agentName === effectiveAgent;
      const matchCustomer = filterCustomer === 'ALL' || t.customerId === filterCustomer;
      
      let matchDate = true;
      if (filterDateFrom) {
        matchDate = matchDate && new Date(t.createdAt) >= new Date(filterDateFrom);
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(t.createdAt) <= toDate;
      }

      let matchAgentStatus = true;
      if (filterAgentStatus !== 'ALL') {
        if (t.agentId) {
          const agentUser = allUsers.find(u => u.id === t.agentId);
          matchAgentStatus = agentUser?.status === filterAgentStatus;
        } else {
          matchAgentStatus = false;
        }
      }

      return matchStatus && matchPriority && matchAgent && matchCustomer && matchDate && matchAgentStatus;
    });

    // 3. Fuzzy Search using Fuse.js on the pre-filtered results
    if (baseSearch === '') return preFiltered;

    const fuse = new Fuse(preFiltered, {
      keys: ['id', 'subject', 'description', 'customerName', 'agentName'],
      threshold: 0.3,
      distance: 100,
      includeScore: true
    });

    return fuse.search(baseSearch).map(result => result.item);
  }, [tickets, filterStatus, filterPriority, filterAgent, filterCustomer, filterDateFrom, filterDateTo, filterAgentStatus, searchQuery, allUsers]);

  const recentActivity = useMemo(() => {
    const allEvents = tickets.flatMap(t => t.history.map(h => ({ ...h, ticketId: t.id, ticketSubject: t.subject })));
    return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }, [tickets]);

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
            {view === 'ADMIN_DASHBOARD' && user.role === 'ADMIN' && (
              <AdminDashboardView 
                stats={stats} 
                statusData={statusData} 
                chartData={chartData} 
                agentPerformanceData={agentPerformanceData}
                allUsers={allUsers}
                tickets={tickets}
                emailLogs={emailLogs}
              />
            )}
            {view === 'DASHBOARD' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Agent Duty Status Toggle */}
                {user.role === 'AGENT' && (
                  <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={user.avatar} className="w-12 h-12 rounded-xl border-2 border-white shadow-md" alt={user.name} referrerPolicy="no-referrer" />
                        <div className="absolute -bottom-1 -right-1">
                          <StatusIndicator status={user.status} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0f172a] capitalize">Welcome back, {user.name.split(' ')[0]}</h3>
                        <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Active Duty Session</p>
                      </div>
                    </div>

                    <div className="flex bg-[#f1f5f9] p-1 rounded-xl w-full sm:w-auto">
                      {(['AVAILABLE', 'ON_BREAK', 'OFFLINE'] as AvailabilityStatus[]).map((s) => {
                        const isActive = user.status === s;
                        const config = {
                          AVAILABLE: { label: 'Available', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
                          ON_BREAK: { label: 'On Break', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
                          OFFLINE: { label: 'Offline', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' }
                        }[s];

                        return (
                          <button
                            key={s}
                            onClick={() => handleUserStatusUpdate(s)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                              isActive 
                                ? `bg-white shadow-sm ${config.color}` 
                                : 'text-[#64748b] hover:text-[#1e293b]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? config.dot : 'bg-[#cbd5e1]'}`} />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    label="Tickets" 
                    value={stats.total} 
                    icon={<Ticket className="w-4 h-4 text-[#3b82f6]" />} 
                    onClick={() => {
                      setFilterStatus('ALL');
                      setFilterPriority('ALL');
                      setView('TICKETS');
                    }}
                  />
                  <StatCard 
                    label="Resolved" 
                    value={stats.resolved} 
                    icon={<CheckCircle2 className="w-4 h-4 text-[#10b981]" />} 
                    onClick={() => {
                      setFilterStatus('RESOLVED');
                      setFilterPriority('ALL');
                      setView('TICKETS');
                    }}
                  />
                  <StatCard 
                    label="In Progress" 
                    value={stats.pending} 
                    icon={<Clock className="w-4 h-4 text-[#f59e0b]" />} 
                    onClick={() => {
                      setFilterStatus('IN_PROGRESS');
                      setFilterPriority('ALL');
                      setView('TICKETS');
                    }}
                  />
                  <StatCard 
                    label="Critical" 
                    value={stats.urgent} 
                    icon={<AlertCircle className="w-4 h-4 text-[#ef4444]" />} 
                    onClick={() => {
                      setFilterStatus('ALL');
                      setFilterPriority('URGENT');
                      setView('TICKETS');
                    }}
                  />
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
                      <div className="grid grid-cols-3 gap-3 mb-6">
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

                      <div className="pt-6 border-t border-[#f1f5f9]">
                        <h3 className="card-label mb-4">Live System Audit</h3>
                        <div className="space-y-4">
                          {recentActivity.map(event => (
                            <div key={event.id} className="flex items-start gap-3 group">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#e2e8f0] transition-all bg-opacity-10 ${
                                event.type === 'creation' ? 'bg-blue-500 text-blue-600' :
                                event.type === 'status' ? 'bg-amber-500 text-amber-600' :
                                event.type === 'assignment' ? 'bg-purple-500 text-purple-600' : 'bg-rose-500 text-rose-600'
                              }`}>
                                {event.type === 'creation' ? <PlusCircle className="w-4 h-4" /> :
                                 event.type === 'status' ? <CheckCircle2 className="w-4 h-4" /> :
                                 event.type === 'assignment' ? <UserCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-[11px] font-bold text-[#1e293b] truncate uppercase tracking-tight">{event.action}</p>
                                  <span className="text-[9px] text-[#94a3b8] font-mono">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[10px] text-[#64748b] truncate">
                                  <span className="font-bold text-[#3b82f6]">{event.ticketId}</span> • {event.user}
                                </p>
                              </div>
                            </div>
                          ))}
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
                    {user.role !== 'CUSTOMER' && (
                      <div className="flex items-center gap-2 pr-2 border-r border-[#e2e8f0]">
                        <button 
                          onClick={() => {
                            if (selectedTicketIds.length === filteredTickets.length) {
                              setSelectedTicketIds([]);
                            } else {
                              setSelectedTicketIds(filteredTickets.map(t => t.id));
                            }
                          }}
                          className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                            selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0
                              ? 'bg-[#3b82f6] border-[#3b82f6] text-white' 
                              : 'border-[#cbd5e1] bg-white hover:border-[#3b82f6]'
                          }`}
                        >
                          {selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0 && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-tighter">
                          {selectedTicketIds.length > 0 ? `${selectedTicketIds.length} Selected` : 'Select All'}
                        </span>
                      </div>
                    )}
                    <div className="relative group/search">
                      <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchQuery.includes(':') || searchQuery.includes('@') ? 'text-[#3b82f6]' : 'text-[#94a3b8]'}`} />
                      <input 
                        type="text"
                        placeholder="Search or is:urgent status:open @agent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`bg-[#f8fafc] border rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-bold text-[#1e293b] outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder-[#94a3b8] uppercase tracking-wider ${
                          searchQuery.includes(':') || searchQuery.includes('@') ? 'border-[#3b82f6]/50 w-64' : 'border-[#e2e8f0] w-48'
                        }`}
                      />
                      {(searchQuery.includes(':') || searchQuery.includes('@')) && (
                        <div className="absolute -top-8 left-0 bg-[#1e293b] text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/search:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-[#334155]">
                          PRO SEARCH ACTIVE: {searchQuery.match(/(is|status):[a-z]+/gi)?.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="w-px h-6 bg-[#e2e8f0] hidden lg:block mx-1" />

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

                      <button 
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                          showAdvancedFilters || filterCustomer !== 'ALL' || filterDateFrom || filterDateTo || filterAgentStatus !== 'ALL'
                            ? 'bg-[#3b82f6] border-[#3b82f6] text-white' 
                            : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                        }`}
                      >
                        <SettingsIcon className="w-3 h-3" />
                        <span>Filters</span>
                        {(filterCustomer !== 'ALL' || filterDateFrom || filterDateTo || filterAgentStatus !== 'ALL') && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full ml-0.5" />
                        )}
                      </button>

                      {(filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterAgent !== 'ALL' || filterCustomer !== 'ALL' || filterDateFrom !== '' || filterDateTo !== '' || filterAgentStatus !== 'ALL') && (
                        <button 
                          onClick={() => {
                            setFilterStatus('ALL');
                            setFilterPriority('ALL');
                            setFilterAgent('ALL');
                            setFilterCustomer('ALL');
                            setFilterDateFrom('');
                            setFilterDateTo('');
                            setFilterAgentStatus('ALL');
                          }}
                          className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider hover:underline px-2"
                        >
                          Reset
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

                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-[#f8fafc] border-x border-b border-[#e2e8f0] rounded-b-xl -mt-2 mb-4"
                    >
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest px-1">Customer Filter</label>
                          <select 
                            value={filterCustomer}
                            onChange={(e) => setFilterCustomer(e.target.value)}
                            className="w-full bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#3b82f6]"
                          >
                            <option value="ALL">All Customers</option>
                            {Array.from(new Set(tickets.map(t => t.customerId))).map(cId => {
                              const customer = allUsers.find(u => u.id === cId) || { name: tickets.find(t => t.customerId === cId)?.customerName || 'Unknown' };
                              return <option key={cId} value={cId}>{customer.name}</option>;
                            })}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest px-1">Agent Status Filter</label>
                          <select 
                            value={filterAgentStatus}
                            onChange={(e) => setFilterAgentStatus(e.target.value)}
                            className="w-full bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#3b82f6]"
                          >
                            <option value="ALL">Any Agent Status</option>
                            <option value="AVAILABLE">Agent Available</option>
                            <option value="ON_BREAK">Agent On Break</option>
                            <option value="OFFLINE">Agent Offline</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest px-1">Date Created (From)</label>
                          <input 
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="w-full bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#3b82f6]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest px-1">Date Created (To)</label>
                          <input 
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="w-full bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#3b82f6]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-3">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map(t => (
                      <motion.div 
                        key={t.id} 
                        layoutId={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`bg-white p-5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative group ${
                          selectedTicketIds.includes(t.id) ? 'border-[#3b82f6] bg-[#3b82f6]/5 shadow-md' : 'border-[#e2e8f0] shadow-sm hover:border-[#3b82f6]'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {user.role !== 'CUSTOMER' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleSelectTicket(t.id); }}
                              className={`w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0 ${
                                selectedTicketIds.includes(t.id) 
                                  ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-sm' 
                                  : 'border-[#cbd5e1] bg-white group-hover:border-[#3b82f6]'
                              }`}
                            >
                              {selectedTicketIds.includes(t.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <div className="w-10 h-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg flex items-center justify-center shadow-inner group-hover:border-[#3b82f6]/30">
                            <PriorityIcon priority={t.priority} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[#64748b] font-bold uppercase">{t.id}</span>
                              <h4 className="text-sm font-bold text-[#0f172a]">{t.subject}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] text-[#64748b] line-clamp-1">{t.description}</p>
                              {getBlockers(t).length > 0 && (
                                <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-bold border border-amber-100 uppercase tracking-tighter flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> Blocked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                          <div className="flex items-center gap-6 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0">
                            {user.role !== 'CUSTOMER' && (
                              <div className="flex items-center gap-1.5 p-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                {user.role === 'AGENT' && !t.agentId && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleClaimTicket(t.id); }}
                                    title="Claim Ticket"
                                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all bg-[#3b82f6] text-white shadow-sm hover:bg-[#2563eb]"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, 'IN_PROGRESS'); }}
                                  title="Mark In Progress"
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${t.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#94a3b8] hover:bg-white hover:text-amber-500'}`}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, 'RESOLVED'); }}
                                  title="Mark Resolved"
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${t.status === 'RESOLVED' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[#94a3b8] hover:bg-white hover:text-emerald-500'}`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, 'ON_HOLD'); }}
                                  title="Mark On Hold"
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${t.status === 'ON_HOLD' ? 'bg-gray-500 text-white shadow-sm' : 'text-[#94a3b8] hover:bg-white hover:text-gray-500'}`}
                                >
                                  <Filter className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
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

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                  {selectedTicketIds.length > 0 && (
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      exit={{ y: 100 }}
                      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-6 py-4 rounded-2xl shadow-2xl z-[60] flex items-center gap-6 border border-[#334155]"
                    >
                      <div className="flex items-center gap-3 pr-6 border-r border-[#334155]">
                        <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest leading-none mb-1">{selectedTicketIds.length} Selected</p>
                          <p className="text-[9px] text-[#94a3b8] font-medium">Bulk Operator Ready</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-wider">Set Status</span>
                          <div className="flex gap-1">
                            {(['IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ON_HOLD'] as SupportTicket['status'][]).map(status => (
                              <button 
                                key={status}
                                onClick={() => setBulkActionModal({ type: 'status', value: status })}
                                className="px-3 py-1.5 bg-[#334155] hover:bg-[#3b82f6] rounded text-[9px] font-bold uppercase tracking-tighter transition-all"
                              >
                                {status.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="w-px h-8 bg-[#334155]" />

                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-wider">Assign To</span>
                          <div className="flex gap-1">
                            {allUsers.filter(u => u.role === 'AGENT' && u.status === 'AVAILABLE').slice(0, 3).map(agent => (
                              <button 
                                key={agent.id}
                                onClick={() => setBulkActionModal({ type: 'assign', value: agent.id })}
                                className="px-3 py-1.5 bg-[#334155] hover:bg-[#3b82f6] rounded text-[9px] font-bold uppercase tracking-tighter transition-all flex items-center gap-2"
                              >
                                <img src={agent.avatar} className="w-3 h-3 rounded-full" alt="" />
                                {agent.name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="w-px h-8 bg-[#334155]" />

                        <button 
                          onClick={() => setSelectedTicketIds([])}
                          className="px-4 py-2 text-rose-400 hover:text-rose-300 transition-colors text-[10px] font-bold uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                                  <div className="relative">
                                    <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#3b82f6] font-bold text-[10px] border border-[#e2e8f0] group-hover:border-[#3b82f6] transition-colors">
                                      {agent.name.charAt(0)}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                      allUsers.find(u => u.name === agent.name)?.status === 'AVAILABLE' ? 'bg-emerald-500' :
                                      allUsers.find(u => u.name === agent.name)?.status === 'ON_BREAK' ? 'bg-amber-500' : 'bg-gray-400'
                                    }`} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[#1e293b]">{agent.name}</span>
                                    <span className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-tighter">
                                      {allUsers.find(u => u.name === agent.name)?.status.replace('_', ' ')}
                                    </span>
                                  </div>
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
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="card-label">Staff Management</h3>
                      <h3 className="text-sm font-bold text-[#0f172a]">Active Support Team</h3>
                    </div>
                    <button className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#2563eb] transition-all flex items-center gap-2">
                      <PlusCircle className="w-3.5 h-3.5" /> Add Agent
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allUsers.filter(u => u.role !== 'CUSTOMER').map(u => (
                      <div key={u.id} className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] relative group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={u.avatar} className="w-12 h-12 rounded-xl shadow-sm border border-white" alt={u.name} />
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                              u.status === 'AVAILABLE' ? 'bg-emerald-500' :
                              u.status === 'ON_BREAK' ? 'bg-amber-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0f172a]">{u.name}</p>
                            <p className="text-[10px] text-[#64748b] font-medium mb-1">{u.role}</p>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'AVAILABLE' ? 'bg-emerald-500' :
                                u.status === 'ON_BREAK' ? 'bg-amber-500' : 'bg-gray-400'
                              }`} />
                              <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter">{u.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-[#1e293b]">{tickets.filter(t => t.agentId === u.id && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length}</p>
                            <p className="text-[8px] text-[#94a3b8] font-bold uppercase">Active</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-[#1e293b]">{tickets.filter(t => t.agentId === u.id && (t.status === 'RESOLVED' || t.status === 'CLOSED')).length}</p>
                            <p className="text-[8px] text-[#94a3b8] font-bold uppercase">Done</p>
                          </div>
                          <button className="px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[9px] font-bold uppercase hover:bg-white hover:text-[#3b82f6] hover:border-[#3b82f6] transition-all">
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
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
                                  toggleDependency(selectedTicket.id, t.id);
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
                    
                    <div className="p-4 space-y-2">
                      {selectedTicket.dependencyIds && selectedTicket.dependencyIds.length > 0 ? (
                        selectedTicket.dependencyIds.map(depId => {
                          const depTicket = tickets.find(t => t.id === depId);
                          if (!depTicket) return null;
                          return (
                            <div key={depId} className="flex items-center justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg group">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${depTicket.status === 'RESOLVED' || depTicket.status === 'CLOSED' ? 'bg-[#10b981]' : 'bg-amber-500 animate-pulse'}`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-[#3b82f6]">{depId}</span>
                                    <span className="text-[10px] font-bold text-[#1e293b] uppercase tracking-tight">{depTicket.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <StatusBadge status={depTicket.status} />
                                    {depTicket.status === 'RESOLVED' || depTicket.status === 'CLOSED' ? (
                                      <span className="text-[8px] font-bold text-[#10b981] uppercase">Blocker Cleared</span>
                                    ) : (
                                      <span className="text-[8px] font-bold text-amber-600 uppercase">Awaiting Resolution</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => toggleDependency(selectedTicket.id, depId)}
                                className="p-1 text-[#94a3b8] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <PlusCircle className="w-4 h-4 rotate-45" />
                              </button>
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
                              onClick={() => setSelectedTicket(dep)}
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
                            onSubmit={(rating, feedback) => handleRateTicket(selectedTicket.id, rating, feedback)} 
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
                              onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
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
                  {user.role === 'CUSTOMER' && selectedTicket.status === 'RESOLVED' && (
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleStatusChange(selectedTicket.id, 'CLOSED')}
                        className="px-5 py-2.5 bg-[#10b981] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#059669] transition-all shadow-sm flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept Resolution
                      </button>
                      <button 
                        onClick={() => handleStatusChange(selectedTicket.id, 'IN_PROGRESS')}
                        className="px-5 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-amber-50 transition-all shadow-sm flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 rotate-90" /> Reopen Ticket
                      </button>
                    </div>
                  )}
                  <button 
                    className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475569] hover:bg-[#f1f5f9] transition-all shadow-sm"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Dismiss
                  </button>
                  {user.role === 'AGENT' && !selectedTicket.agentId && (
                    <button 
                      onClick={() => handleClaimTicket(selectedTicket.id)}
                      className="px-5 py-2.5 bg-[#3b82f6] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#2563eb] transition-all shadow-sm flex items-center gap-2"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Claim Ticket
                    </button>
                  )}
                  {user.role !== 'CUSTOMER' && !selectedTicket.isEscalated && (
                    <button 
                      onClick={() => setEscalationPrompt(selectedTicket.id)}
                      className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2"
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Escalate
                    </button>
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

      {/* Escalation Modal */}
      <AnimatePresence>
        {escalationPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setEscalationPrompt(null);
              setEscalationReasonInput('');
              setEscalationConfirming(false);
              setEscalationValidationError(null);
            }}
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
                  {escalationConfirming ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0f172a]">
                    {escalationConfirming ? 'Confirm Escalation' : 'Escalate Ticket'}
                  </h2>
                  <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">
                    {escalationConfirming ? 'Final Verification Step' : 'Management Intervention Required'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {!escalationConfirming ? (
                  <div>
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest block mb-2 px-1">Reason for Escalation (Mandatory)</label>
                    <textarea 
                      autoFocus
                      rows={4}
                      value={escalationReasonInput}
                      onChange={(e) => {
                        setEscalationReasonInput(e.target.value);
                        if (e.target.value.trim() && escalationValidationError) {
                          setEscalationValidationError(null);
                        }
                      }}
                      placeholder="Provide a specific justification for management review..."
                      className={`w-full bg-[#f8fafc] border ${escalationValidationError ? 'border-rose-500' : 'border-[#e2e8f0]'} rounded-xl p-4 text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-[#1e293b] placeholder-[#94a3b8] resize-none`}
                    />
                    {escalationValidationError && (
                      <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase px-1 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {escalationValidationError}
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
                      <span className="text-[11px] font-bold text-[#1e293b] uppercase tracking-tight">{escalationPrompt}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest block mb-1">Provided Justification</span>
                      <p className="text-[11px] text-[#475569] leading-relaxed italic border-l-2 border-rose-400 pl-3">
                        "{escalationReasonInput}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      if (escalationConfirming) {
                        setEscalationConfirming(false);
                      } else {
                        setEscalationPrompt(null);
                        setEscalationReasonInput('');
                        setEscalationValidationError(null);
                      }
                    }}
                    className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
                  >
                    {escalationConfirming ? 'Back' : 'Cancel'}
                  </button>
                  <button 
                    disabled={isEscalating}
                    onClick={() => {
                      if (!escalationConfirming) {
                        if (!escalationReasonInput.trim()) {
                          setEscalationValidationError('Reason is mandatory for escalation.');
                          return;
                        }
                        if (escalationReasonInput.trim().length < 10) {
                          setEscalationValidationError('Reason must be at least 10 characters.');
                          return;
                        }
                        setEscalationValidationError(null);
                        setEscalationConfirming(true);
                      } else {
                        handleEscalate(escalationPrompt, escalationReasonInput);
                      }
                    }}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isEscalating ? (
                      <>
                        <Clock className="w-3 h-3 animate-spin" /> Verifying...
                      </>
                    ) : (
                      escalationConfirming ? 'Final Confirm' : 'Proceed to Confirm'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {bulkActionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setBulkActionModal(null)}
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
                      {bulkActionModal.type === 'status' ? 'Status Update' : 'Assignment'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-[#cbd5e1]" />
                    <span className="text-[11px] font-bold text-[#1e293b] uppercase">
                      {bulkActionModal.type === 'status' 
                        ? bulkActionModal.value.replace('_', ' ') 
                        : (allUsers.find(u => u.id === bulkActionModal.value)?.name || 'Unknown')}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748b] mb-8 leading-relaxed italic border-l-2 border-[#3b82f6] pl-4">
                This operation will trigger automated email notifications and audit logs for all selected entities. Ensure the status transition aligns with organizational protocol.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setBulkActionModal(null)}
                  className="flex-1 py-3 bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f8fafc] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (bulkActionModal.type === 'status') {
                      handleBulkStatusChange(bulkActionModal.value as SupportTicket['status']);
                    } else {
                      handleBulkAssign(bulkActionModal.value);
                    }
                  }}
                  className="flex-1 py-3 bg-[#1e293b] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#0f172a] transition-all shadow-md"
                >
                  Execute Batch
                </button>
              </div>
            </motion.div>
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

function FeedbackForm({ onSubmit }: { onSubmit: (rating: number, feedback: string) => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-[11px] font-bold text-[#1e293b] uppercase tracking-wider">How was your support experience?</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star 
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating) ? 'text-amber-500 fill-amber-500' : 'text-[#e2e8f0]'
                }`} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Resolution Comments</label>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What did we do well? What could we improve?"
          rows={3}
          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#1e293b] placeholder-[#94a3b8] resize-none"
        />
      </div>

      <button 
        disabled={!rating}
        onClick={() => onSubmit(rating, feedback)}
        className="w-full py-2.5 bg-[#1e293b] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#0f172a] transition-all shadow-sm disabled:opacity-30 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Submit Evaluation
      </button>
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

function StatCard({ label, value, icon, color = 'blue', onClick }: { label: string, value: string | number, icon: React.ReactNode, color?: 'blue' | 'emerald' | 'amber' | 'rose', onClick?: () => void }) {
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
}

function StatusIndicator({ status }: { status: AvailabilityStatus }) {
  const statusColors: Record<AvailabilityStatus, string> = {
    AVAILABLE: 'bg-emerald-500',
    ON_BREAK: 'bg-amber-500',
    OFFLINE: 'bg-gray-400',
  };

  return (
    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${statusColors[status]}`} />
  );
}

function AdminDashboardView({ stats, statusData, chartData, agentPerformanceData, allUsers, tickets, emailLogs }: { 
  stats: any, 
  statusData: any, 
  chartData: any, 
  agentPerformanceData: any,
  allUsers: User[],
  tickets: SupportTicket[],
  emailLogs: EmailLog[]
}) {
  const activeAgents = allUsers.filter(u => u.role === 'AGENT');
  const [showEmailHub, setShowEmailHub] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [emailTypeFilter, setEmailTypeFilter] = useState('ALL');

  const filteredEmailLogs = useMemo(() => {
    return emailLogs.filter(log => {
      const searchLower = emailSearchQuery.toLowerCase();
      const matchSearch = emailSearchQuery === '' || 
        log.recipient.toLowerCase().includes(searchLower) || 
        log.subject.toLowerCase().includes(searchLower);
      
      const matchType = emailTypeFilter === 'ALL' || log.type === emailTypeFilter;

      return matchSearch && matchType;
    });
  }, [emailLogs, emailSearchQuery, emailTypeFilter]);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]">Command Center</h2>
          <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Operational KPI & Staffing Overview</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowEmailHub(!showEmailHub)}
             className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all border font-bold text-[10px] uppercase tracking-wider ${
               showEmailHub 
                ? 'bg-[#1e293b] text-white border-[#1e293b]' 
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
             }`}
           >
              <MessageSquare className="w-3.5 h-3.5" /> 
              {showEmailHub ? 'Dashboard' : 'Email Hub'}
           </button>
           <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">{activeAgents.filter(a => a.status === 'AVAILABLE').length} Agents Online</span>
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showEmailHub ? (
          <motion.div
            key="email-hub"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="card-label">Communication Ledger</h3>
                <h3 className="text-sm font-bold text-[#0f172a]">Recent Email Dispatches</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input 
                    type="text"
                    placeholder="Search recipient or subject..."
                    value={emailSearchQuery}
                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                    className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-bold text-[#1e293b] outline-none focus:ring-1 focus:ring-[#3b82f6] w-64 placeholder-[#94a3b8] uppercase tracking-wider transition-all"
                  />
                </div>

                <select 
                  value={emailTypeFilter}
                  onChange={(e) => setEmailTypeFilter(e.target.value)}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[10px] font-bold text-[#1e293b] outline-none focus:ring-1 focus:ring-[#3b82f6] uppercase tracking-wider cursor-pointer"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="TICKET_CREATED">Ticket Created</option>
                  <option value="TICKET_ASSIGNED">Ticket Assigned</option>
                  <option value="TICKET_RESOLVED">Ticket Resolved</option>
                  <option value="STATUS_UPDATE">Status Update</option>
                  <option value="ESCALATION">Escalation</option>
                </select>

                {(emailSearchQuery !== '' || emailTypeFilter !== 'ALL') && (
                  <button 
                    onClick={() => {
                      setEmailSearchQuery('');
                      setEmailTypeFilter('ALL');
                    }}
                    className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider hover:underline px-2"
                  >
                    Reset
                  </button>
                )}

                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-2 border-l border-[#e2e8f0]">
                  Results: {filteredEmailLogs.length}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredEmailLogs.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#e2e8f0] text-[#94a3b8]">
                    <Bell className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">
                    {emailLogs.length === 0 ? 'No communications recorded yet' : 'No matches found for active filters'}
                  </p>
                </div>
              ) : (
                filteredEmailLogs.map(log => (
                  <div key={log.id} className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] group hover:border-[#3b82f6] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                          log.type === 'ESCALATION' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                          log.type === 'TICKET_RESOLVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                          'bg-blue-50 border-blue-100 text-blue-500'
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a] group-hover:text-[#3b82f6] transition-colors">{log.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter">To: {log.recipient}</p>
                            <span className="w-1 h-1 bg-[#e2e8f0] rounded-full" />
                            <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-tighter">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-[8px] font-bold px-1.5 py-0.5 bg-white border border-[#e2e8f0] rounded text-[#64748b] uppercase">
                        {log.ticketId}
                      </div>
                    </div>
                    <div className="mt-3 bg-white p-3 rounded-lg border border-[#e2e8f0] text-[11px] text-[#475569] leading-relaxed whitespace-pre-wrap">
                      {log.body}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="main-stats" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Lifecycle" value={stats.total} icon={<Ticket className="w-4 h-4 text-[#3b82f6]" />} />
              <StatCard label="Resolution Rate" value={`${Math.round((stats.resolved/(stats.total || 1))*100)}%`} icon={<CheckCircle2 className="w-4 h-4 text-[#10b981]" />} />
              <StatCard label="Active Backlog" value={stats.pending} icon={<Clock className="w-4 h-4 text-[#f59e0b]" />} />
              <StatCard label="Critical Breach" value={stats.urgent} icon={<AlertCircle className="w-4 h-4 text-[#ef4444]" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
                  <h3 className="card-label mb-4">Agent Workload & Availability Status</h3>
                  <div className="space-y-3">
                    {activeAgents.map(agent => {
                      const agentTickets = tickets.filter(t => t.agentId === agent.id && t.status !== 'RESOLVED' && t.status !== 'CLOSED');
                      const loadPercent = Math.min((agentTickets.length / 5) * 100, 100);
                      
                      return (
                        <div key={agent.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] gap-4">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="relative">
                              <img src={agent.avatar} className="w-10 h-10 rounded-lg border border-white shadow-sm" alt={agent.name} />
                              <div className="absolute -bottom-1 -right-1">
                                <StatusIndicator status={agent.status} />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1e293b]">{agent.name}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-tighter ${
                                agent.status === 'AVAILABLE' ? 'text-emerald-600' :
                                agent.status === 'ON_BREAK' ? 'text-amber-600' : 'text-gray-400'
                              }`}>{agent.status.replace('_', ' ')}</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1 text-[9px] font-bold uppercase text-[#64748b]">
                                <span>Current Workload</span>
                                <span className={agentTickets.length > 4 ? 'text-rose-500' : 'text-[#3b82f6]'}>{agentTickets.length} / 5 Cap</span>
                              </div>
                              <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-700 ${
                                    loadPercent > 80 ? 'bg-rose-500' : loadPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${loadPercent}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right min-w-[60px]">
                              <p className="text-xs font-bold text-[#1e293b]">{agentPerformanceData.find((d: any) => d.name === agent.name)?.avgTime || '0.0h'}</p>
                              <p className="text-[8px] text-[#94a3b8] font-bold uppercase">Avg Handle</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
                  <h3 className="card-label mb-4">Volume by Class</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][index % 4]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {chartData.map((item: any, i: number) => (
                      <div key={item.name} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][i % 4] }} />
                          <span className="text-[#64748b] font-bold">{item.name}</span>
                        </div>
                        <span className="font-bold text-[#1e293b]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1e293b] p-6 rounded-xl border border-[#0f172a] shadow-lg text-white">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Efficiency Factor</p>
                        <p className="text-lg font-bold">94.2%</p>
                     </div>
                  </div>
                  <p className="text-[10px] text-blue-100/60 leading-relaxed">System-wide performance is within nominal parameters. Response times are stable.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

