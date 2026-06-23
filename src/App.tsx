import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { 
  Ticket, 
  LayoutDashboard, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCircle, 
  Search, 
  Filter,
  MessageSquare,
  ChevronRight,
  TrendingUp, 
  Settings as SettingsIcon, 
  Star, 
  Download, 
  Zap, 
  Users, 
  UserPlus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';

// Modules
import { 
  User, SupportTicket, EmailLog, AppNotification, 
  Role, AvailabilityStatus, ViewType 
} from './types';
import { MOCK_USERS, INITIAL_TICKETS } from './data/mockData';

// UI Components
import { StatusBadge } from './components/ui/StatusBadge';
import { PriorityIcon } from './components/ui/PriorityIcon';
import { StatCard } from './components/ui/StatCard';
import { StatusIndicator } from './components/ui/StatusIndicator';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// View Components
import { ProfileView } from './components/views/ProfileView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { SecurityView } from './components/views/SecurityView';
import { TicketDetailModal } from './components/modals/TicketDetailModal';
import { AddTicketModal } from './components/modals/AddTicketModal';
import { EscalationModal } from './components/modals/EscalationModal';
import { BulkActionModal } from './components/modals/BulkActionModal';
import HeatmapChart from './components/HeatmapChart';

// --- Main App Component ---

export default function App() {
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [view, setView] = useState<'DASHBOARD' | 'TICKETS' | 'USERS' | 'REPORTS' | 'ADMIN_DASHBOARD' | 'PROFILE'>('DASHBOARD');
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
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setLastRefreshedAt(new Date());
      setNotification({ message: 'SYSTEM: LIVE DATA REFRESHED', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }, 30000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

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
          message: `GUARD ENFORCED: ${blockedTickets.length} ticket(s) cannot be resolved due to active blockers. Processing valid tickets only.`, 
          type: 'alert' 
        });
        setTimeout(() => setNotification(null), 6000);
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

  const handleCreateTicket = (subject: string, category: string, priority: SupportTicket['priority'], description: string, dependencyIds: string[] = []) => {
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
      dependencyIds,
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
    if (user.status !== 'AVAILABLE' && user.status !== 'ON_BREAK') {
      setNotification({ message: 'MUST BE AVAILABLE OR ON BREAK TO CLAIM TICKETS', type: 'alert' });
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

  const isCircularDependency = (targetTicketId: string, newDependencyId: string): boolean => {
    const checkRecursive = (currentId: string, idToFind: string, visited: Set<string>): boolean => {
      if (currentId === idToFind) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const ticket = tickets.find(t => t.id === currentId);
      if (!ticket || !ticket.dependencyIds) return false;

      return ticket.dependencyIds.some(depId => checkRecursive(depId, idToFind, visited));
    };

    return checkRecursive(newDependencyId, targetTicketId, new Set<string>());
  };

  const toggleDependency = (targetTicketId: string, dependencyId: string) => {
    // Prevent self-dependency
    if (targetTicketId === dependencyId) return;

    // Check for circular dependency if adding
    const targetTicket = tickets.find(t => t.id === targetTicketId);
    const isAdding = !targetTicket?.dependencyIds?.includes(dependencyId);
    
    if (isAdding && isCircularDependency(targetTicketId, dependencyId)) {
      setNotification({ 
        message: 'CIRCULAR DEPENDENCY DETECTED: CANNOT CREATE RECURSIVE BLOCKS', 
        type: 'alert' 
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

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
          message: `ACTION DENIED: ${ticket.id} is currently BLOCKED by ${blockers.length} unresolved case(s): ${blockers.map(b => b.id).join(', ')}. Please resolve blockers before finalizing.`, 
          type: 'alert' 
        });
        setTimeout(() => setNotification(null), 6000);
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

  const handleAddTicket = (subject: string, category: string, priority: SupportTicket['priority'], description: string, dependencyIds: string[]) => {
    const timestamp = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      description,
      category,
      priority,
      status: 'NEW',
      customerId: user?.id || 'CUST-001',
      customerName: user?.name || 'Walk-in Customer',
      createdAt: timestamp,
      dependencyIds: dependencyIds,
      history: [
        {
          id: Math.random().toString(36).substr(2, 9),
          action: 'Ticket Created',
          user: user?.name || 'System',
          timestamp,
          type: 'creation'
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setIsAddingTicket(false);
    setNotification({ message: 'TICKET CREATED SUCCESSFULLY', type: 'success' });
    setTimeout(() => setNotification(null), 3000);

    sendSimulatedEmail({
      recipient: user?.email || 'admin@bpo.com',
      subject: `Ticket Created: ${newTicket.id}`,
      body: `Hello ${user?.name},\n\nYour support ticket has been created successfully.\nTicket ID: ${newTicket.id}\nSubject: ${newTicket.subject}`,
      type: 'TICKET_CREATED',
      ticketId: newTicket.id
    });
  };

  const handleUserStatusUpdate = (status: AvailabilityStatus) => {
    if (!user) return;
    const prevStatus = user.status;
    const updatedUser = { ...user, status };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    // Auto-reassignment logic for agents going offline
    if (status === 'OFFLINE' && prevStatus !== 'OFFLINE' && user.role === 'AGENT') {
      const otherAvailableAgents = allUsers.filter(u => u.role === 'AGENT' && u.id !== user.id && u.status === 'AVAILABLE');
      const timestamp = new Date().toISOString();
      const reassignments: { ticketId: string; updatedTicket: SupportTicket; nextAgent?: User }[] = [];

      const newTicketsList = tickets.map(t => {
        if (t.agentId === user.id && !['RESOLVED', 'CLOSED'].includes(t.status)) {
          if (otherAvailableAgents.length > 0) {
            const nextAgent = otherAvailableAgents[Math.floor(Math.random() * otherAvailableAgents.length)];
            const historyEntry = {
              id: Math.random().toString(36).substr(2, 9),
              action: `Auto-reassigned to ${nextAgent.name} (Agent went offline)`,
              user: 'System',
              timestamp,
              type: 'assignment' as const
            };
            const updatedTicket = {
              ...t,
              agentId: nextAgent.id,
              agentName: nextAgent.name,
              status: 'ASSIGNED' as const,
              history: [...t.history, historyEntry]
            };
            reassignments.push({ ticketId: t.id, updatedTicket, nextAgent });
            return updatedTicket;
          } else {
            const historyEntry = {
              id: Math.random().toString(36).substr(2, 9),
              action: `Reverted to NEW (Assigned agent went offline, no others available)`,
              user: 'System',
              timestamp,
              type: 'status' as const
            };
            const updatedTicket = {
              ...t,
              agentId: undefined,
              agentName: undefined,
              status: 'NEW' as const,
              history: [...t.history, historyEntry]
            };
            reassignments.push({ ticketId: t.id, updatedTicket });
            return updatedTicket;
          }
        }
        return t;
      });

      if (reassignments.length > 0) {
        setTickets(newTicketsList);
        
        // Update selected ticket if it was involved
        const affectedSelected = reassignments.find(r => r.ticketId === selectedTicket?.id);
        if (affectedSelected) {
          setSelectedTicket(affectedSelected.updatedTicket);
        }

        // Side effects: Emails
        reassignments.forEach(r => {
          if (r.nextAgent) {
            sendSimulatedEmail({
              recipient: r.nextAgent.email,
              subject: `Auto-Assignment: Ticket ${r.ticketId}`,
              body: `Hello ${r.nextAgent.name},\n\nYou have been automatically assigned to ticket ${r.ticketId} because the previous agent went offline.`,
              type: 'TICKET_ASSIGNED',
              ticketId: r.ticketId
            });
          }
        });

        setNotification({ 
          message: `ACTIVE TICKETS REASSIGNED/REVERTED (AGENT OFFLINE)`, 
          type: 'alert' 
        });
        setTimeout(() => setNotification(null), 5000);
        return; // Skip the default success message below
      }
    }
    
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
      const workload = agentTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      return {
        name,
        assigned: agentTickets.length,
        resolved,
        workload,
        avgTime: (Math.random() * 4 + 2).toFixed(1) + 'h', // Simulated avg resolution time
        satisfaction: (Math.random() * 1.5 + 3.5).toFixed(1) // Simulated customer satisfaction
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [tickets, agents]);

  const availabilityTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Generate some randomized but consistent data for the last 7 days
    return days.map(day => ({
      name: day,
      Available: Math.floor(Math.random() * 20 + 40),
      OnBreak: Math.floor(Math.random() * 10 + 5),
    }));
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.text('Agent Performance Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Table data
    const tableColumn = ["Agent Name", "Assigned", "Resolved", "Workload", "Effort %", "AHT", "CSAT"];
    const tableRows = agentPerformanceData.map(agent => [
      agent.name,
      agent.assigned,
      agent.resolved,
      agent.workload,
      `${Math.round((agent.resolved / (agent.assigned || 1)) * 100)}%`,
      agent.avgTime,
      agent.satisfaction
    ]);

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 35 },
    });

    // Save PDF
    doc.save(`Agent_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    setNotification({ 
      message: 'PERFORMANCE REPORT EXPORTED SUCCESSFULLY', 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
  };

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
      <Sidebar 
        user={user!} 
        view={view} 
        setView={setView} 
        handleUserStatusUpdate={handleUserStatusUpdate} 
        handleLogout={handleLogout} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <Header 
          view={view} 
          user={user!} 
          notification={notification}
          isLiveMode={isLiveMode}
          setIsLiveMode={setIsLiveMode}
          lastRefreshedAt={lastRefreshedAt}
          currentTime={currentTime}
          allNotifications={allNotifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {view === 'PROFILE' && (
              <ProfileView 
                user={user!} 
                allUsers={allUsers}
                tickets={tickets}
                onStatusUpdate={handleUserStatusUpdate}
              />
            )}
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
                {/* Agent Duty Status & Live Mode Toggle */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
                  {user.role === 'AGENT' && (
                    <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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

                  <div className={`${user.role === 'AGENT' ? 'lg:col-span-4' : 'lg:col-span-12'} bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isLiveMode ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Zap className={`w-4 h-4 ${isLiveMode ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-[#0f172a] uppercase tracking-wider leading-none mb-1">Live Awareness</h4>
                        <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-tighter">Auto-refreshes every 30s</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsLiveMode(!isLiveMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b82f6] ${isLiveMode ? 'bg-[#10b981]' : 'bg-[#e2e8f0]'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLiveMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

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
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                        className="bg-white border border-[#e2e8f0] text-[#1e293b] text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
                      >
                        <option value="ALL">All Agents</option>
                        {agents.map(agent => (
                          <option key={agent} value={agent}>{agent}</option>
                        ))}
                      </select>

                      <div className="bg-[#f1f5f9] p-1 rounded-lg flex items-center">
                        <button 
                          onClick={() => setIsLiveMode(!isLiveMode)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            isLiveMode 
                              ? 'bg-white shadow-sm text-emerald-600' 
                              : 'text-[#64748b] hover:text-[#1e293b]'
                          }`}
                          title={isLiveMode ? `Auto-refresh active - Refreshed ${Math.floor((currentTime.getTime() - lastRefreshedAt.getTime()) / 1000)}s ago` : 'Enable Live Auto-refresh'}
                        >
                          <Zap className={`w-3 h-3 ${isLiveMode ? 'fill-current animate-pulse' : ''}`} />
                          {isLiveMode ? 'Live' : 'Static'}
                        </button>
                      </div>

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

                {/* Priority Toggle Pills */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => {
                    const isActive = filterPriority === p;
                    const config = {
                      ALL: { color: 'text-slate-600', active: 'bg-slate-800 text-white border-slate-800', dot: 'bg-slate-400', label: 'All Cases' },
                      LOW: { color: 'text-emerald-600', active: 'bg-emerald-500 text-white border-emerald-500', dot: 'bg-emerald-400', label: 'Low' },
                      MEDIUM: { color: 'text-blue-600', active: 'bg-blue-600 text-white border-blue-600', dot: 'bg-blue-400', label: 'Medium' },
                      HIGH: { color: 'text-amber-600', active: 'bg-amber-500 text-white border-amber-500', dot: 'bg-amber-400', label: 'High' },
                      URGENT: { color: 'text-rose-600', active: 'bg-rose-600 text-white border-rose-600', dot: 'bg-rose-400', label: 'Urgent' }
                    }[p as 'ALL' | SupportTicket['priority']];

                    return (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 shadow-sm ${
                          isActive 
                            ? config.active 
                            : `bg-white ${config.color} border-[#e2e8f0] hover:border-[#cbd5e1]`
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : config.dot}`} />
                        {config.label}
                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] font-black ${isActive ? 'bg-white/20' : 'bg-[#f1f5f9]'}`}>
                          {p === 'ALL' ? tickets.length : tickets.filter(t => t.priority === p).length}
                        </span>
                      </button>
                    );
                  })}
                </div>

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
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[11px] text-[#64748b] line-clamp-1">{t.description}</p>
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {t.dependencyIds && t.dependencyIds.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {getBlockers(t).length > 0 ? (
                                      <span className="bg-amber-50 text-amber-600 px-1.5 py-1 rounded text-[8px] font-bold border border-amber-100 uppercase tracking-tighter flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> Blocked by {t.dependencyIds.length}
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-50 text-emerald-600 px-1.5 py-1 rounded text-[8px] font-bold border border-emerald-100 uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                                      </span>
                                    )}
                                  </div>
                                )}
                                {tickets.some(other => other.dependencyIds?.includes(t.id)) && (
                                  <span className="bg-rose-50 text-rose-600 px-1.5 py-1 rounded text-[8px] font-bold border border-rose-100 uppercase tracking-tighter flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" /> Is Blocker
                                  </span>
                                )}
                              </div>
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
                className="space-y-6 pb-12"
              >
                {/* Team Overview Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Team Resolution Rate</p>
                    <div className="flex items-end gap-2">
                      <h4 className="text-xl font-bold text-[#1e293b]">
                        {Math.round((tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length / (tickets.length || 1)) * 100)}%
                      </h4>
                      <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Avg Team Satisfaction</p>
                    <div className="flex items-end gap-2">
                      <h4 className="text-xl font-bold text-[#3b82f6]">
                        {(agentPerformanceData.reduce((acc, curr) => acc + parseFloat(curr.satisfaction), 0) / (agentPerformanceData.length || 1)).toFixed(2)}
                      </h4>
                      <Star className="w-4 h-4 text-amber-500 mb-1 fill-amber-500" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Global Avg Response</p>
                    <div className="flex items-end gap-2">
                      <h4 className="text-xl font-bold text-[#1e293b]">3.2h</h4>
                      <Clock className="w-4 h-4 text-[#94a3b8] mb-1" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Active Agents</p>
                    <div className="flex items-end gap-2">
                      <h4 className="text-xl font-bold text-[#10b981]">
                        {allUsers.filter(u => u.role === 'AGENT' && u.status === 'AVAILABLE').length}
                      </h4>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mb-2 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Resolution Comparison */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="card-label">Volume Analysis</h3>
                        <h3 className="text-base font-bold text-[#1e293b]">Ticket Distribution by Agent</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#3b82f6] rounded-full" />
                          <span className="text-[10px] font-bold text-[#64748b] uppercase">Resolved</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#e2e8f0] rounded-full" />
                          <span className="text-[10px] font-bold text-[#64748b] uppercase">Pending</span>
                        </div>
                      </div>
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
                          <Bar dataKey="resolved" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                          <Bar dataKey="assigned" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Availability Trend Chart */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="card-label">Operational Health</h3>
                        <h3 className="text-base font-bold text-[#1e293b]">7-Day Agent Availability Trend</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#3b82f6] rounded-full" />
                          <span className="text-[10px] font-bold text-[#64748b] uppercase">Available Hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full" />
                          <span className="text-[10px] font-bold text-[#64748b] uppercase">On Break</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={availabilityTrendData}>
                          <defs>
                            <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOnBreak" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
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
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Available" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAvailable)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="OnBreak" 
                            stroke="#fbbf24" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorOnBreak)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Performance Heatmap (D3) */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                    <div className="mb-6">
                      <h3 className="card-label">Efficiency Distribution</h3>
                      <h3 className="text-base font-bold text-[#1e293b]">Performance Heatmap by Category & Shift</h3>
                    </div>
                    <div className="flex items-center justify-end gap-4 mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-[#f7fbff] border border-[#e2e8f0] rounded" />
                        <span className="text-[10px] font-bold text-[#64748b]">Low</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-[#6baed6] rounded" />
                        <span className="text-[10px] font-bold text-[#64748b]">Med</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-[#08306b] rounded" />
                        <span className="text-[10px] font-bold text-[#64748b]">High</span>
                      </div>
                    </div>
                    <HeatmapChart />
                  </div>

                  {/* CSAT Heatmap / Bar */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
                    <div className="mb-8">
                      <h3 className="card-label">Satisfaction Metrics</h3>
                      <h3 className="text-base font-bold text-[#1e293b]">Customer CSAT by Agent</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agentPerformanceData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                            width={100}
                          />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          />
                          <Bar dataKey="satisfaction" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#1e293b', fontSize: 10, fontWeight: 700 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Performance Table */}
                  <div className="lg:col-span-12 bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
                      <div>
                        <h3 className="card-label">Individual Report Cards</h3>
                        <h3 className="text-base font-bold text-[#1e293b]">Agent Performance Index</h3>
                      </div>
                      <button 
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export PDF Report
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Agent Name</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Assigned</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Resolved</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Workload</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">Effort %</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">AHT</th>
                            <th className="p-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider text-center">CSAT</th>
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
                                <div className="flex flex-col items-center">
                                  <span className="text-[11px] font-bold text-[#3b82f6]">{agent.workload}</span>
                                  <span className="text-[8px] text-[#94a3b8] font-bold uppercase tracking-tighter">Active</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-bold text-[#1e293b]">
                                    {Math.round((agent.resolved / (agent.assigned || 1)) * 100)}%
                                  </span>
                                  <div className="w-12 h-1 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#e2e8f0]">
                                    <div 
                                      className="h-full bg-[#3b82f6] rounded-full transition-all duration-1000" 
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
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className={`w-3 h-3 ${parseFloat(agent.satisfaction) >= 4.5 ? 'text-amber-500 fill-amber-500' : 'text-amber-400'}`} />
                                  <span className="text-[11px] font-bold text-[#1e293b]">{agent.satisfaction}</span>
                                </div>
                                <p className="text-[8px] text-[#94a3b8] font-bold uppercase tracking-tighter">Rating</p>
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

            {view === 'SECURITY' && user.role === 'ADMIN' && (
              <SecurityView 
                user={user!} 
                allUsers={allUsers}
                tickets={tickets}
                emailLogs={emailLogs}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Ticket Detail Modal Overlay */}
      <TicketDetailModal
        selectedTicket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        user={user!}
        allUsers={allUsers}
        tickets={tickets}
        onStatusChange={handleStatusChange}
        onAssignAgent={handleAssignAgent}
        onClaimTicket={handleClaimTicket}
        onEscalate={(id) => setEscalationPrompt(id)}
        onRateTicket={handleRateTicket}
        onToggleDependency={toggleDependency}
        onViewTicket={(t) => setSelectedTicket(t)}
      />

      {/* Add Ticket Modal */}
      <AddTicketModal
        isOpen={isAddingTicket}
        onClose={() => setIsAddingTicket(false)}
        onSubmit={handleAddTicket}
        tickets={tickets}
      />

      {/* Escalation Modal */}
      <EscalationModal
        id={escalationPrompt}
        reason={escalationReasonInput}
        onReasonChange={setEscalationReasonInput}
        onClose={() => {
          setEscalationPrompt(null);
          setEscalationReasonInput('');
          setEscalationConfirming(false);
          setEscalationValidationError(null);
        }}
        onSubmit={handleEscalate}
        isEscalating={isEscalating}
        validationError={escalationValidationError}
        confirming={escalationConfirming}
        onConfirmingChange={setEscalationConfirming}
        setValidationError={setEscalationValidationError}
      />

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={!!bulkActionModal}
        onClose={() => setBulkActionModal(null)}
        selectedTicketIds={selectedTicketIds}
        actionType={bulkActionModal?.type || null}
        actionValue={bulkActionModal?.value || null}
        allUsers={allUsers}
        onExecute={() => {
          if (bulkActionModal?.type === 'status') {
            handleBulkStatusChange(bulkActionModal.value as SupportTicket['status']);
          } else if (bulkActionModal?.type === 'assignment') {
            handleBulkAssign(bulkActionModal.value);
          }
        }}
      />
    </div>
  );
}

