import { User, SupportTicket } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', role: 'ADMIN', avatar: 'https://picsum.photos/seed/alex/100/100', status: 'AVAILABLE' },
  { id: '2', name: 'Sam Rivera', email: 'sam@example.com', role: 'AGENT', avatar: 'https://picsum.photos/seed/sam/100/100', status: 'AVAILABLE' },
  { id: '3', name: 'Casey Smith', email: 'casey@example.com', role: 'CUSTOMER', avatar: 'https://picsum.photos/seed/casey/100/100', status: 'AVAILABLE' },
  { id: '4', name: 'Jordan Lee', email: 'jordan@example.com', role: 'AGENT', avatar: 'https://picsum.photos/seed/jordan/100/100', status: 'OFFLINE' },
];

export const INITIAL_TICKETS: SupportTicket[] = [
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
    dependencyIds: ['T-1001'],
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
    dependencyIds: ['T-1001', 'T-1002'],
    history: [
      { id: 'h8', action: 'Ticket Created', user: 'Casey Smith', timestamp: '2024-03-22T11:20:00Z', type: 'creation' },
      { id: 'h9', action: 'Assigned to Sam Rivera', user: 'System', timestamp: '2024-03-22T11:25:00Z', type: 'assignment' }
    ]
  },
];
