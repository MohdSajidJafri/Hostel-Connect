import { Profile } from './supabase';

export type DemoMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachment_url?: string | null;
  read: boolean;
  created_at: string;
};

export type CommunityCategory = 'help' | 'group' | 'borrow' | 'marketplace' | 'notice';

export type CommunityPost = {
  id: string;
  author_id: string;
  category: CommunityCategory;
  title: string;
  description: string;
  tags: string[];
  price: string | null;
  status: 'open' | 'resolved';
  created_at: string;
  author_name?: string;
  author_room?: string | null;
};

export type DemoReport = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  created_at: string;
};

const DEMO_MESSAGES_KEY = 'hostel_connect_demo_messages';
const DEMO_BLOCKS_KEY = 'hostel_connect_demo_blocks';
const DEMO_REPORTS_KEY = 'hostel_connect_demo_reports';
const DEMO_POSTS_KEY = 'hostel_connect_demo_posts';
const DEMO_SAVED_KEY = 'hostel_connect_demo_saved';
export const DEMO_MESSAGES_EVENT = 'hostel-demo-messages-updated';

export const DEMO_ONLINE_IDS = ['demo-user-2', 'demo-user-3'];

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
    availability_status: 'Open to Mentor',
    is_verified: true,
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
    availability_status: 'Open to Connect',
    is_verified: true,
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
    availability_status: 'In Room',
    is_verified: true,
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
    availability_status: 'At Library',
    is_verified: false,
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
    availability_status: 'Open to Connect',
    is_verified: true,
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

const INITIAL_DEMO_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author_id: 'demo-user-2',
    category: 'help',
    title: 'Weekend SDE Mock Interviews (System Design + DSA)',
    description: 'Happy to take 30-min mock interviews for 2nd/3rd year residents this Saturday in Block A common room.',
    tags: ['DSA', 'Placements', 'System Design'],
    price: null,
    status: 'open',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    author_name: 'Aarav Sharma',
    author_room: 'A-102',
  },
  {
    id: 'post-2',
    author_id: 'demo-user-3',
    category: 'group',
    title: 'Smart India Hackathon Team — Need 1 Backend Dev',
    description: 'Building an AI campus assistant. We have 2 frontend/design folks and need someone comfortable with Node or FastAPI.',
    tags: ['SIH', 'Hackathon', 'Backend'],
    price: null,
    status: 'open',
    created_at: new Date(Date.now() - 18000000).toISOString(),
    author_name: 'Priya Nair',
    author_room: 'B-214',
  },
  {
    id: 'post-3',
    author_id: 'demo-user-4',
    category: 'borrow',
    title: 'Looking to borrow a scientific calculator (fx-991EX) for tomorrow',
    description: 'Have an Analog Circuits quiz at 9 AM. Will return right after 11 AM!',
    tags: ['Calculator', 'Block C'],
    price: null,
    status: 'open',
    created_at: new Date(Date.now() - 36000000).toISOString(),
    author_name: 'Rohan Verma',
    author_room: 'C-305',
  },
  {
    id: 'post-4',
    author_id: 'demo-user-5',
    category: 'marketplace',
    title: '24-inch Dell IPS Monitor + HDMI Cable',
    description: 'Graduating next month—selling my 1080p 75Hz monitor in mint condition. Pickup from D-118.',
    tags: ['Monitor', 'Electronics'],
    price: '₹4,500',
    status: 'open',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    author_name: 'Kabir Mehta',
    author_room: 'D-118',
  },
  {
    id: 'post-5',
    author_id: 'demo-user-2',
    category: 'notice',
    title: 'Hostel Wi-Fi Maintenance Tonight (1:00 AM – 2:00 AM)',
    description: 'IT team is upgrading the Block A & B access points. Expect brief 15-minute drops.',
    tags: ['Notice', 'Wi-Fi'],
    price: null,
    status: 'open',
    created_at: new Date(Date.now() - 120000000).toISOString(),
    author_name: 'Aarav Sharma',
    author_room: 'A-102',
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
    const reports = getDemoReports();
    reports.unshift({
      id: `rep-${Date.now()}`,
      reporter_id: 'demo-user-1',
      reported_user_id: reportedUserId,
      reason,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage errors
  }
}

export function getDemoReports(): DemoReport[] {
  try {
    const raw = localStorage.getItem(DEMO_REPORTS_KEY);
    return raw ? (JSON.parse(raw) as DemoReport[]) : [];
  } catch {
    return [];
  }
}

export function getDemoPosts(): CommunityPost[] {
  const raw = localStorage.getItem(DEMO_POSTS_KEY);
  if (!raw) {
    localStorage.setItem(DEMO_POSTS_KEY, JSON.stringify(INITIAL_DEMO_POSTS));
    return INITIAL_DEMO_POSTS;
  }
  try {
    return JSON.parse(raw) as CommunityPost[];
  } catch {
    return INITIAL_DEMO_POSTS;
  }
}

export function saveDemoPosts(posts: CommunityPost[]): void {
  localStorage.setItem(DEMO_POSTS_KEY, JSON.stringify(posts));
}

export function getDemoSavedContacts(): string[] {
  try {
    const raw = localStorage.getItem(DEMO_SAVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : ['demo-user-2'];
  } catch {
    return [];
  }
}

export function toggleDemoSavedContact(targetUserId: string): boolean {
  const current = getDemoSavedContacts();
  const exists = current.includes(targetUserId);
  const next = exists ? current.filter((id) => id !== targetUserId) : [...current, targetUserId];
  localStorage.setItem(DEMO_SAVED_KEY, JSON.stringify(next));
  return !exists;
}
