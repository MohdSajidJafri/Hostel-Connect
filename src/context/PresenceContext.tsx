import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { DEMO_ONLINE_IDS } from '../lib/demoData';

type PresenceContextType = {
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
};

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  isOnline: () => false,
});

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, isDemo } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnlineUsers(new Set());
      return;
    }

    if (isDemo) {
      setOnlineUsers(new Set([user.id, ...DEMO_ONLINE_IDS]));
      return;
    }

    const channel = supabase.channel('online-residents', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, isDemo]);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return (
    <PresenceContext.Provider value={{ onlineUsers, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePresence() {
  return useContext(PresenceContext);
}
