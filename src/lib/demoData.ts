import { Profile } from './supabase';

export type DemoMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

const DEMO_MESSAGES_KEY = 'hostel_connect_demo_messages';
const DEMO_BLOCKS_KEY = 'hostel_connect_demo_blocks';
const DEMO_REPORTS_KEY = 'hostel_connect_demo_reports';
export const DEMO_MESSAGES_EVENT = 'hostel-demo-messages-updated';

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-p-2',
    user_id: 'demo-user-2',
    full_name: 'Aarav Sharma',
    avatar_url: null,
    year_of_study: 4,
    expertise: 'System Design · Go · Distributed Systems',
    domain: 'B.Tech CSE',
    room_number: 'A-102',
    contact_info: '+91 98111 22334',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'demo-p-3',
    user_id: 'demo-user-3',
    full_name: 'Priya Nair',
    avatar_url: null,
    year_of_study: 3,
    expertise: 'UI/UX · Figma · React',
    domain: 'B.Tech IT',
    room_number: 'B-214',
    contact_info: '+91 98222 33445',
    created_at: '2026-08-12T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'demo-p-4',
    user_id: 'demo-user-4',
    full_name: 'Rohan Verma',
    avatar_url: null,
    year_of_study: 2,
    expertise: 'Embedded C · VLSI · Robotics',
    domain: 'B.Tech ECE',
    room_number: 'C-305',
    contact_info: '+91 98333 44556',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'demo-p-5',
    user_id: 'demo-user-5',
    full_name: 'Kabir Mehta',
    avatar_url: null,
    year_of_study: 4,
    expertise: 'CAD · Thermodynamics · Formula Student',
    domain: 'B.Tech Mechanical',
    room_number: 'D-118',
    contact_info: '+91 98444 55667',
    created_at: '2026-08-18T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'demo-p-6',
    user_id: 'demo-user-6',
    full_name: 'Ananya Gupta',
    avatar_url: null,
    year_of_study: 1,
    expertise: 'AutoCAD · Structural Analysis',
    domain: 'B.Tech Civil',
    room_number: 'A-019',
    contact_info: '+91 98555 66778',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: null,
  },
];

const INITIAL_DEMO_MESSAGES: DemoMessage[] = [
  {
    id: 'demo-msg-1',
    sender_id: 'demo-user-2',
    recipient_id: 'demo-user-1',
    content: 'Hey! Welcome to the hostel. Let me know if you need help with system design or placements.',
    read: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-msg-2',
    sender_id: 'demo-user-3',
    recipient_id: 'demo-user-1',
    content: 'Are you joining the hackathon team tonight?',
    read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function getDemoMessages(): DemoMessage[] {
  const raw = localStorage.getItem(DEMO_MESSAGES_KEY);
  if (!raw) {
    localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(INITIAL_DEMO_MESSAGES));
    return INITIAL_DEMO_MESSAGES;
  }
  try {
    return JSON.parse(raw) as DemoMessage[];
  } catch {
    return INITIAL_DEMO_MESSAGES;
  }
}

export function saveDemoMessages(messages: DemoMessage[]): void {
  localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(messages));
  window.dispatchEvent(new CustomEvent(DEMO_MESSAGES_EVENT));
}

export function getDemoUnreadCount(userId: string): number {
  return getDemoMessages().filter((m) => m.recipient_id === userId && !m.read).length;
}

export function getDemoBlockedUsers(): string[] {
  try {
    const raw = localStorage.getItem(DEMO_BLOCKS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleDemoBlockUser(targetUserId: string): boolean {
  const current = getDemoBlockedUsers();
  const isBlocked = current.includes(targetUserId);
  const next = isBlocked
    ? current.filter((id) => id !== targetUserId)
    : [...current, targetUserId];
  localStorage.setItem(DEMO_BLOCKS_KEY, JSON.stringify(next));
  return !isBlocked;
}

export function submitDemoReport(reportedUserId: string, reason: string): void {
  try {
    const raw = localStorage.getItem(DEMO_REPORTS_KEY);
    const reports = raw ? (JSON.parse(raw) as Array<{ reportedUserId: string; reason: string; createdAt: string }>) : [];
    reports.push({ reportedUserId, reason, createdAt: new Date().toISOString() });
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage errors in demo mode
  }
}
