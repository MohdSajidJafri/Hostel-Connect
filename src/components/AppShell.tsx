import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { DEMO_MESSAGES_EVENT, getDemoUnreadCount } from '../lib/demoData';
import {
  Home,
  Search,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { profile, user, isDemo, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    if (isDemo) {
      const syncDemo = () => setUnreadCount(getDemoUnreadCount(user.id));
      syncDemo();
      window.addEventListener(DEMO_MESSAGES_EVENT, syncDemo);
      return () => window.removeEventListener(DEMO_MESSAGES_EVENT, syncDemo);
    }

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);
      setUnreadCount(count ?? 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, isDemo]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K / Cmd+K listener to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(globalSearch.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Community', path: '/community', icon: Users },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex">
      {/* Desktop Slim Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-neutral-200 bg-white sticky top-0 h-screen z-30 flex-shrink-0">
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center border-b border-neutral-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-neutral-950 text-white rounded-md flex items-center justify-center font-bold text-xs tracking-wider group-hover:bg-neutral-800 transition-colors">
              H
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-950">
              Hostel Connect
            </span>
          </Link>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-medium'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="flex-1">{item.label}</span>
                    {item.path === '/messages' && unreadCount > 0 && (
                      <span
                        data-testid="sidebar-unread-badge"
                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-950 text-white rounded-full leading-none"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Secondary / Footer Actions */}
        <div className="p-3 border-t border-neutral-100 space-y-1">
          <Link
            to="/profile/edit"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
          >
            <Settings size={15} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
          >
            <ShieldAlert size={15} strokeWidth={1.8} />
            <span>Safety Reports</span>
          </Link>
          <a
            href="mailto:support@hostelconnect.internal"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
          >
            <HelpCircle size={15} strokeWidth={1.8} />
            <span>Help & Support</span>
          </a>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 transition-colors text-left"
          >
            <LogOut size={15} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area + TopBar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-neutral-200 bg-white sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile Header Left: Hamburger + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-neutral-950 text-white rounded flex items-center justify-center font-bold text-xs">
                H
              </div>
              <span className="font-semibold text-sm tracking-tight text-neutral-950">Hostel Connect</span>
            </Link>
          </div>

          {/* Desktop Global Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleGlobalSearchSubmit} className="w-full relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search residents, expertise, courses, rooms..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-12 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-0.5 text-[10px] text-neutral-400 font-mono bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">
                <span>⌘</span>
                <span>K</span>
              </div>
            </form>
          </div>

          {/* TopBar Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/messages"
              className="relative p-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
              title="Messages"
              aria-label="Messages"
            >
              <MessageSquare size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neutral-950 ring-2 ring-white" />
              )}
            </Link>
            
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-2 border-l border-neutral-200 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-700">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-neutral-800 max-w-[120px] truncate">
                {profile?.full_name || 'Profile'}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Slide-Out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer Panel */}
            <div className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col shadow-dropdown border-r border-neutral-200 z-10">
              <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-neutral-950 text-white rounded flex items-center justify-center font-bold text-xs">
                    H
                  </div>
                  <span className="font-semibold text-sm tracking-tight text-neutral-950">Hostel Connect</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 text-neutral-500 hover:text-neutral-950 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3">
                <form onSubmit={handleGlobalSearchSubmit} className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search residents..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:border-neutral-900"
                  />
                </form>
              </div>

              <nav className="flex-1 px-3 py-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-neutral-100 text-neutral-950 font-medium'
                            : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                        }`
                      }
                    >
                      <Icon size={17} />
                      <span className="flex-1">{item.label}</span>
                      {item.path === '/messages' && unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-950 text-white rounded-full leading-none">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-neutral-100 space-y-1">
                <Link
                  to="/profile/edit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <a
                  href="mailto:support@hostelconnect.internal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-neutral-600 hover:bg-neutral-50 text-left"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Container */}
        <main className="flex-1 bg-white p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
