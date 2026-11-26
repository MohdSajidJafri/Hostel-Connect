import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { notifyNewMessage, requestNotificationPermission } from '../lib/notifications';
import {
  DEMO_PROFILES,
  getDemoMessages,
  saveDemoMessages,
  getDemoBlockedUsers,
  toggleDemoBlockUser,
  submitDemoReport,
} from '../lib/demoData';
import { format, isToday, isYesterday } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  RotateCcw,
  Copy,
  MoreVertical,
  ShieldBan,
  Flag,
  ChevronDown,
  X,
  Search,
  Paperclip,
  Bell,
} from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachment_url?: string | null;
  read: boolean;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed';
};

type UserProfile = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 5000;

const Conversation: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();
  const { isOnline } = usePresence();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const sendTimestampsRef = useRef<number[]>([]);
  const otherNameRef = useRef<string>('Resident');

  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  useEffect(() => {
    otherNameRef.current = otherUserProfile?.full_name || 'Resident';
  }, [otherUserProfile?.full_name]);

  // Safety states
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam or unwanted messages');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const isSelf = Boolean(user && userId && user.id === userId);
  const isBlocked = isBlockedByMe || isBlockedByOther;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewBelow(false);
  }, []);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 80;
    setIsAtBottom(nearBottom);
    if (nearBottom) {
      setHasNewBelow(false);
    }
  };

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await supabase.from('messages').update({ read: true }).eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  useEffect(() => {
    if (!user || !userId || isSelf) {
      setLoading(false);
      return;
    }

    if (isDemo) {
      const other = DEMO_PROFILES.find((p) => p.user_id === userId);
      setOtherUserProfile(
        other
          ? { user_id: other.user_id, full_name: other.full_name, avatar_url: other.avatar_url }
          : null
      );
      setIsBlockedByMe(getDemoBlockedUsers().includes(userId));
      const all = getDemoMessages();
      const thread = all
        .filter(
          (m) =>
            (m.sender_id === user.id && m.recipient_id === userId) ||
            (m.sender_id === userId && m.recipient_id === user.id)
        )
        .map((m) => ({ ...m, status: 'sent' as const }));
      setMessages(thread);
      saveDemoMessages(
        all.map((m) => (m.sender_id === userId && m.recipient_id === user.id ? { ...m, read: true } : m))
      );
      setLoading(false);
      return;
    }

    const loadInitial = async () => {
      setLoading(true);
      try {
        const [{ data: prof }, { data: msgData, error: msgErr }, { data: blockData }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .eq('user_id', userId)
              .single(),
            supabase
              .from('messages')
              .select('*')
              .or(
                `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
              )
              .order('created_at', { ascending: true }),
            supabase
              .from('blocked_users')
              .select('blocker_id, blocked_id')
              .or(
                `and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`
              ),
          ]);

        if (prof) setOtherUserProfile(prof);
        if (msgErr) throw msgErr;

        setMessages((msgData || []).map((m) => ({ ...m, status: 'sent' })));
        if (blockData) {
          setIsBlockedByMe(blockData.some((b) => b.blocker_id === user.id));
          setIsBlockedByOther(blockData.some((b) => b.blocker_id === userId));
        }

        const unreadIds = (msgData || [])
          .filter((m) => m.recipient_id === user.id && !m.read)
          .map((m) => m.id);
        for (const id of unreadIds) {
          markMessageAsRead(id);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    const channelName = `chat:${[user.id, userId].sort().join(':')}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const incoming = payload.new as Message;
          if (incoming.sender_id !== userId) return;
          setOtherTyping(false);
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, { ...incoming, status: 'sent' }]
          );
          notifyNewMessage(otherNameRef.current, incoming.content);
          markMessageAsRead(incoming.id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Message;
          if (updated.recipient_id !== userId) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { userId?: string; isTyping?: boolean };
        if (data?.userId === userId) {
          setOtherTyping(Boolean(data.isTyping));
          if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = window.setTimeout(() => setOtherTyping(false), 3000);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, userId, isDemo, isSelf, markMessageAsRead]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('smooth');
    } else if (messages.length > 0) {
      setHasNewBelow(true);
    }
  }, [messages.length, otherTyping, isAtBottom, scrollToBottom]);

  const emitTyping = () => {
    if (isDemo || isBlocked || !channelRef.current || !user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping: true },
    });
  };

  const adjustComposerHeight = () => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;
    if (isDemo) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const sendMessageContent = async (
    content: string,
    existingTempId?: string,
    attachmentUrl?: string | null
  ) => {
    if (!user || !userId || isBlocked) return;

    const now = Date.now();
    sendTimestampsRef.current = sendTimestampsRef.current.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (!existingTempId && sendTimestampsRef.current.length >= RATE_LIMIT_COUNT) {
      setErrorMsg('You are sending messages too quickly. Please wait a moment.');
      return;
    }
    sendTimestampsRef.current.push(now);
    setErrorMsg(null);

    if (isDemo) {
      const demoMsg: Message = {
        id: `demo-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender_id: user.id,
        recipient_id: userId,
        content,
        attachment_url: attachmentUrl || null,
        read: false,
        created_at: new Date().toISOString(),
        status: 'sent',
      };
      const all = getDemoMessages();
      saveDemoMessages([...all, { ...demoMsg }]);
      setMessages((prev) => [...prev, demoMsg]);
      return;
    }

    const tempId = existingTempId || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      recipient_id: userId,
      content,
      attachment_url: attachmentUrl || null,
      read: false,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    if (existingTempId) {
      setMessages((prev) => prev.map((m) => (m.id === existingTempId ? { ...m, status: 'sending' } : m)));
    } else {
      setMessages((prev) => [...prev, optimisticMsg]);
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: userId,
          content,
          attachment_url: attachmentUrl || null,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data, status: 'sent' } : m))
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
      setErrorMsg('Message failed to send. You can retry directly on the message.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newMessage.trim();
    const fileToSend = attachmentFile;
    if ((!trimmed && !fileToSend) || trimmed.length > MAX_MESSAGE_LENGTH || isBlocked) return;

    setNewMessage('');
    setAttachmentFile(null);
    if (composerRef.current) {
      composerRef.current.style.height = 'auto';
    }

    let uploadedUrl: string | null = null;
    if (fileToSend) {
      try {
        uploadedUrl = await uploadAttachment(fileToSend);
      } catch {
        setErrorMsg('Failed to upload attachment.');
        return;
      }
    }

    await sendMessageContent(trimmed || `Attachment: ${fileToSend?.name}`, undefined, uploadedUrl);
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string, status?: Message['status']) => {
    setErrorMsg(null);
    if (status === 'failed') {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      return;
    }

    if (isDemo) {
      saveDemoMessages(getDemoMessages().filter((m) => m.id !== messageId));
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      return;
    }

    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      setErrorMsg('Failed to delete message.');
    }
  };

  const handleCopyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !userId) return;
    setMenuOpen(false);
    setErrorMsg(null);

    if (isDemo) {
      const nowBlocked = toggleDemoBlockUser(userId);
      setIsBlockedByMe(nowBlocked);
      setInfoMsg(nowBlocked ? 'Resident blocked. You will no longer exchange messages.' : 'Resident unblocked.');
      return;
    }

    try {
      if (isBlockedByMe) {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', userId);
        if (error) throw error;
        setIsBlockedByMe(false);
        setInfoMsg('Resident unblocked.');
      } else {
        const { error } = await supabase
          .from('blocked_users')
          .insert({ blocker_id: user.id, blocked_id: userId });
        if (error) throw error;
        setIsBlockedByMe(true);
        setInfoMsg('Resident blocked. You can unblock them at any time.');
      }
    } catch (error) {
      console.error('Error updating block status:', error);
      setErrorMsg('Unable to update block status. Please try again.');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userId) return;
    const reasonText = reportDetails.trim()
      ? `${reportReason}: ${reportDetails.trim()}`.slice(0, 500)
      : reportReason;

    try {
      setSubmittingReport(true);
      if (isDemo) {
        submitDemoReport(userId, reasonText);
      } else {
        const { error } = await supabase.from('message_reports').insert({
          reporter_id: user.id,
          reported_user_id: userId,
          reason: reasonText,
        });
        if (error) throw error;
      }
      setReportOpen(false);
      setReportDetails('');
      setInfoMsg('Report submitted. Thank you for helping keep the community safe.');
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMsg('Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  };

  const formatHeaderDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  const getDateKey = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-neutral-500">
        Please sign in to view messages.
      </div>
    );
  }

  if (isSelf) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-xs text-neutral-500">You cannot start a conversation with yourself.</p>
        <button
          onClick={() => navigate('/search')}
          className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Find Residents</span>
        </button>
      </div>
    );
  }

  if (!userId || (!loading && !otherUserProfile)) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-xs text-neutral-500">Resident not found.</p>
        <button
          onClick={() => navigate('/messages')}
          className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Back to Messages</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] max-w-4xl mx-auto flex flex-col bg-white border border-neutral-200 rounded-xl shadow-subtle overflow-hidden animate-in fade-in duration-300 relative">
      {/* Chat Header */}
      <div className="h-14 px-4 border-b border-neutral-200 bg-white flex items-center justify-between z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
            title="Back to messages"
            aria-label="Back to messages"
          >
            <ArrowLeft size={18} />
          </button>

          <Link to={`/profile/${userId}`} className="flex items-center gap-3 group min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800">
                {otherUserProfile?.avatar_url ? (
                  <img
                    src={otherUserProfile.avatar_url}
                    alt={otherUserProfile.full_name || 'Resident'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {otherUserProfile?.full_name ? otherUserProfile.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {userId && isOnline(userId) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-neutral-950 group-hover:underline truncate">
                {otherUserProfile?.full_name || 'Resident'}
              </h2>
              <span className="text-[10px] text-neutral-400 font-normal block">
                {otherTyping
                  ? 'Typing...'
                  : isBlocked
                  ? 'Blocked'
                  : userId && isOnline(userId)
                  ? 'Online · View profile'
                  : 'View profile'}
              </span>
            </div>
          </Link>
        </div>

        {/* Header Actions: Search, Notifications, Safety Menu */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => {
              setChatSearchOpen((v) => !v);
              setChatSearchQuery('');
            }}
            aria-label="Search messages in conversation"
            data-testid="chat-search-toggle"
            className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
            title="Search in conversation"
          >
            <Search size={16} />
          </button>

          {!notifEnabled && typeof Notification !== 'undefined' && (
            <button
              onClick={async () => {
                const granted = await requestNotificationPermission();
                setNotifEnabled(granted);
              }}
              aria-label="Enable desktop notifications"
              className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
              title="Enable notifications"
            >
              <Bell size={16} />
            </button>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Conversation safety options"
            data-testid="chat-safety-menu-btn"
            className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <MoreVertical size={17} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-dropdown py-1 z-30">
              <button
                onClick={handleToggleBlock}
                data-testid="block-user-btn"
                className="w-full px-3 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <ShieldBan size={14} className="text-neutral-500" />
                <span>{isBlockedByMe ? 'Unblock Resident' : 'Block Resident'}</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                data-testid="report-user-btn"
                className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Flag size={14} />
                <span>Report Resident</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {chatSearchOpen && (
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2">
          <Search size={14} className="text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Search messages in this thread..."
            data-testid="chat-search-input"
            className="flex-1 bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            autoFocus
          />
          {chatSearchQuery && (
            <button
              onClick={() => setChatSearchQuery('')}
              className="text-neutral-400 hover:text-neutral-900 p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} aria-label="Dismiss error" className="p-0.5 hover:text-red-950">
            <X size={13} />
          </button>
        </div>
      )}

      {infoMsg && (
        <div role="status" className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-700 flex items-center justify-between gap-2">
          <span>{infoMsg}</span>
          <button onClick={() => setInfoMsg(null)} aria-label="Dismiss notice" className="p-0.5 hover:text-neutral-950">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-neutral-50/40 relative"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">Loading conversation...</span>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages
              .filter(
                (m) =>
                  !chatSearchQuery.trim() ||
                  m.content.toLowerCase().includes(chatSearchQuery.toLowerCase())
              )
              .map((m, idx, visibleList) => {
              const isMine = m.sender_id === user.id;
              const prev = idx > 0 ? visibleList[idx - 1] : null;
              const prevDateKey = prev ? getDateKey(prev.created_at) : null;
              const currDateKey = getDateKey(m.created_at);
              const showDateDivider = idx === 0 || currDateKey !== prevDateKey;
              const isGrouped =
                !showDateDivider &&
                prev?.sender_id === m.sender_id &&
                new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 120000;

              return (
                <React.Fragment key={m.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] font-medium text-neutral-400 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-subtle">
                        {formatHeaderDate(m.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative ${
                      isGrouped ? 'mt-0.5' : 'mt-2.5'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-md rounded-xl px-3.5 py-2 relative shadow-subtle ${
                        isMine
                          ? m.status === 'failed'
                            ? 'bg-red-950 text-white rounded-tr-xs'
                            : 'bg-neutral-950 text-white rounded-tr-xs'
                          : 'bg-white border border-neutral-200 text-neutral-900 rounded-tl-xs'
                      }`}
                    >
                      {m.attachment_url && (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block mb-1.5"
                        >
                          <img
                            src={m.attachment_url}
                            alt="Attachment"
                            className="max-h-48 rounded-lg border border-neutral-200/40 object-cover"
                          />
                        </a>
                      )}
                      <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                        {m.content}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-neutral-400">
                        <span>{formatMessageTime(m.created_at)}</span>
                        {isMine && (
                          m.status === 'sending' ? (
                            <Clock size={11} className="text-neutral-400 inline" />
                          ) : m.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => sendMessageContent(m.content, m.id)}
                              className="inline-flex items-center gap-0.5 text-red-300 hover:text-white underline"
                            >
                              <AlertCircle size={11} />
                              <span>Retry</span>
                              <RotateCcw size={10} />
                            </button>
                          ) : m.read ? (
                            <CheckCheck size={12} className="text-sky-400 inline" />
                          ) : (
                            <Check size={12} className="text-neutral-400 inline" />
                          )
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-center ${
                        isMine ? 'mr-1.5 order-first' : 'ml-1.5'
                      }`}
                    >
                      <button
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        aria-label="Copy message"
                        className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
                        title={copiedId === m.id ? 'Copied' : 'Copy message'}
                      >
                        {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      {isMine && (
                        <button
                          onClick={() => handleDeleteMessage(m.id, m.status)}
                          aria-label="Delete message"
                          className="p-1 text-neutral-400 hover:text-red-600 rounded"
                          title="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {otherTyping && (
              <div className="flex justify-start mt-2">
                <div className="bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-500 italic shadow-subtle">
                  {otherUserProfile?.full_name?.split(' ')[0] || 'Resident'} is typing...
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-1">
            <p className="text-xs font-medium text-neutral-900">Start the conversation</p>
            <p className="text-xs text-neutral-400 max-w-xs">
              Say hello or ask a question to connect with {otherUserProfile?.full_name || 'this resident'}.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Jump to Latest Pill */}
      {hasNewBelow && !isAtBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 btn btn-primary text-[11px] py-1 px-3 rounded-full shadow-dropdown flex items-center gap-1 z-20"
        >
          <span>New messages</span>
          <ChevronDown size={13} />
        </button>
      )}

      {/* Chat Composer or Blocked Banner */}
      {isBlocked ? (
        <div
          data-testid="blocked-banner"
          className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 text-xs text-neutral-600"
        >
          <span>
            {isBlockedByMe
              ? 'You blocked this resident. Unblock to send messages.'
              : 'You cannot send messages to this resident.'}
          </span>
          {isBlockedByMe && (
            <button onClick={handleToggleBlock} className="btn btn-secondary text-xs py-1 px-2.5">
              Unblock
            </button>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-neutral-200 space-y-2"
        >
          {attachmentFile && (
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-700">
              <span className="truncate">Attached: {attachmentFile.name}</span>
              <button
                type="button"
                onClick={() => setAttachmentFile(null)}
                className="text-neutral-400 hover:text-neutral-900 p-0.5"
                aria-label="Remove attachment"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  setErrorMsg('Attachment must be under 5MB.');
                  return;
                }
                setAttachmentFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach image"
              className="p-2.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors flex-shrink-0"
              title="Attach image (max 5MB)"
            >
              <Paperclip size={15} />
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={composerRef}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  adjustComposerHeight();
                  emitTyping();
                }}
                onKeyDown={handleComposerKeyDown}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all resize-none leading-relaxed"
              />
              {newMessage.length > MAX_MESSAGE_LENGTH - 250 && (
                <span className="absolute right-2.5 bottom-1.5 text-[10px] text-neutral-400">
                  {newMessage.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() && !attachmentFile}
              aria-label="Send message"
              className="btn btn-primary p-2.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      )}

      {/* Report Resident Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-dropdown w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-950">Report Resident</h3>
              <button
                onClick={() => setReportOpen(false)}
                aria-label="Close report modal"
                className="p-1 text-neutral-400 hover:text-neutral-950 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input text-xs"
                >
                  <option value="Spam or unwanted messages">Spam or unwanted messages</option>
                  <option value="Harassment or abusive behavior">Harassment or abusive behavior</option>
                  <option value="Impersonation or fake profile">Impersonation or fake profile</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={350}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe what happened..."
                  className="input text-xs resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="btn btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  data-testid="submit-report-btn"
                  className="btn btn-primary text-xs py-1.5 px-3"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversation;
