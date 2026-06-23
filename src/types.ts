export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';
export type AvailabilityStatus = 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE';

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  type: 'TICKET_CREATED' | 'TICKET_ASSIGNED' | 'TICKET_RESOLVED' | 'STATUS_UPDATE' | 'ESCALATION';
  ticketId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: AvailabilityStatus;
}

export interface TicketHistoryEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: 'status' | 'assignment' | 'escalation' | 'creation';
}

export interface SupportTicket {
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
  history: TicketHistoryEntry[];
}

export interface AppNotification {
  id: string;
  ticketId: string;
  message: string;
  reason: string;
  timestamp: string;
  read: boolean;
}

export type ViewType = 'DASHBOARD' | 'TICKETS' | 'USERS' | 'REPORTS' | 'ADMIN_DASHBOARD' | 'PROFILE' | 'SECURITY';
