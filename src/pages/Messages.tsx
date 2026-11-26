import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  DEMO_MESSAGES_EVENT,
  DEMO_PROFILES,
  getDemoMessages,
  saveDemoMessages,
} from '../lib/demoData';
import { getCached, setCached, invalidateCache } from '../lib/cache';
import { format, isToday, isYesterday } from 'date-fns';
import { Plus, Search as SearchIcon, Trash2, MessageSquare, ArrowRight } from 'lucide-react';

type Conversation = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

const Messages: React.FC = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const cacheKey = user ? `inbox_${user.id}` : '';
  const [conversations, setConversations] = useState<Conversation[]>(
    () => (cacheKey ? getCached<Conversation[]>(cacheKey, 30_000) || [] : [])
  );
  const [loading, setLoading] = useState(
    () => !(cacheKey && getCached<Conversation[]>(cacheKey, 30_000))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDemoConversations = () => {
    if (!user) return;
    const msgs = getDemoMessages();
    const convMap = new Map<string, Conversation>();
    for (const m of [...msgs].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const isUnread = m.recipient_id === user.id && !m.read;
      const existing = convMap.get(otherId);
      if (!existing) {
        const p = DEMO_PROFILES.find((prof) => prof.user_id === otherId);
        convMap.set(otherId, {
          user_id: otherId,
          full_name: p?.full_name || 'Resident',
          avatar_url: p?.avatar_url || null,
          last_message: m.content,
          last_message_time: m.created_at,
          unread_count: isUnread ? 1 : 0,
        });
      } else if (isUnread) {
        existing.unread_count += 1;
      }
    }
    setConversations(Array.from(convMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      loadDemoConversations();
      window.addEventListener(DEMO_MESSAGES_EVENT, loadDemoConversations);
      return () => window.removeEventListener(DEMO_MESSAGES_EVENT, loadDemoConversations);
    }

    fetchConversations();

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDemo]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      if (conversations.length === 0) {
        setLoading(true);
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, read, created_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        setConversations([]);
        setCached(cacheKey, []);
        setLoading(false);
        return;
      }

      const userIds = [
        ...new Set(
          messages.map((msg) =>
            msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
          )
        ),
      ];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const conversationMap = new Map<string, Conversation>();

      for (const message of messages) {
        const otherUserId =
          message.sender_id === user.id
            ? message.recipient_id
            : message.sender_id;
        const isUnread = message.recipient_id === user.id && !message.read;

        const existing = conversationMap.get(otherUserId);
        if (!existing) {
          const profile = profiles?.find((p) => p.user_id === otherUserId);
          conversationMap.set(otherUserId, {
            user_id: otherUserId,
            full_name: profile?.full_name || 'Resident',
            avatar_url: profile?.avatar_url || null,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: isUnread ? 1 : 0,
          });
        } else if (isUnread) {
          existing.unread_count += 1;
        }
      }

      const list = Array.from(conversationMap.values());
      setConversations(list);
      setCached(cacheKey, list);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isToday(date)) return format(date, 'h:mm a');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    otherUserId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirmDeleteId !== otherUserId) {
      setConfirmDeleteId(otherUserId);
      return;
    }
    if (!user) return;
    setErrorMsg(null);
    setConfirmDeleteId(null);

    if (isDemo) {
      const remaining = getDemoMessages().filter(
        (m) => !(m.sender_id === otherUserId || m.recipient_id === otherUserId)
      );
      saveDemoMessages(remaining);
      setConversations((prev) => prev.filter((conv) => conv.user_id !== otherUserId));
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
        );

      if (error) throw error;
      invalidateCache('inbox_');
      setConversations((prev) => prev.filter((conv) => conv.user_id !== otherUserId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setErrorMsg('Failed to delete conversation. Please try again.');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            Messages
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Direct conversations with your hostel community.
          </p>
        </div>
        <Link
          to="/search"
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>New Message</span>
        </Link>
      </div>

      {errorMsg && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Conversation List Container */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-subtle overflow-hidden">
        {conversations.length > 0 && (
          <div className="p-3 border-b border-neutral-100 relative">
            <SearchIcon
              size={15}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 transition-all"
            />
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-xs text-neutral-500">Loading messages...</span>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {filteredConversations.map((c) => {
              const hasUnread = c.unread_count > 0;
              return (
                <div
                  key={c.user_id}
                  onClick={() => navigate(`/messages/${c.user_id}`)}
                  className={`group px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                    hasUnread ? 'bg-neutral-50/70' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 flex-shrink-0">
                      {c.avatar_url ? (
                        <img
                          src={c.avatar_url}
                          alt={c.full_name || 'Resident'}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {c.full_name ? c.full_name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h2
                          className={`text-xs truncate ${
                            hasUnread ? 'font-semibold text-neutral-950' : 'font-medium text-neutral-900'
                          }`}
                        >
                          {c.full_name}
                        </h2>
                        <span className="text-[11px] text-neutral-400 flex-shrink-0">
                          {formatMessageTime(c.last_message_time)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          hasUnread ? 'font-medium text-neutral-900' : 'text-neutral-500'
                        }`}
                      >
                        {c.last_message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasUnread && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-950 text-white rounded-full leading-none">
                        {c.unread_count}
                      </span>
                    )}
                    {confirmDeleteId === c.user_id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteConversation(e, c.user_id)}
                          className="px-2 py-1 text-[11px] font-medium bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 text-[11px] text-neutral-600 hover:text-neutral-950 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleDeleteConversation(e, c.user_id)}
                        aria-label="Delete conversation"
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-200/60 rounded"
                        title="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <MessageSquare size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-950">No messages yet</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Connect with people in your hostel by finding them in the directory.
              </p>
            </div>
            <Link to="/search" className="btn btn-primary text-xs mt-2 inline-flex items-center gap-1.5">
              <span>Find Residents</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
