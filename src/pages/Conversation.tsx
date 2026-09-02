import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, Send, Trash2, CheckCheck } from 'lucide-react';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

type UserProfile = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const Conversation: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);

  // Fetch messages and user profile
  useEffect(() => {
    if (user && userId) {
      fetchMessages();
      fetchUserProfile();

      // Real-time subscription for new messages
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${userId},recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const incomingMsg = payload.new as Message;
            setMessages((prev) => [...prev, incomingMsg]);
            markMessageAsRead(incomingMsg.id);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setOtherUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchMessages = async () => {
    if (!user || !userId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages =
        data?.filter((msg) => msg.recipient_id === user.id && !msg.read) || [];

      for (const msg of unreadMessages) {
        markMessageAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !userId) return;

    const trimmedContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: userId,
        content: trimmedContent,
        read: false,
      });

      if (error) throw error;

      // Add optimistic message to the UI
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        sender_id: user.id,
        recipient_id: userId,
        content: trimmedContent,
        read: false,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message.');
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

  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-neutral-500">
        Please sign in to view messages.
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
    <div className="h-[calc(100vh-6.5rem)] max-w-4xl mx-auto flex flex-col bg-white border border-neutral-200 rounded-xl shadow-subtle overflow-hidden animate-in fade-in duration-300">
      {/* Chat Header */}
      <div className="h-14 px-4 border-b border-neutral-200 bg-white flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
            title="Back to messages"
          >
            <ArrowLeft size={18} />
          </button>

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

          <div>
            <h2 className="text-xs font-semibold text-neutral-950">
              {otherUserProfile?.full_name || 'Resident'}
            </h2>
            <span className="text-[10px] text-neutral-400 font-normal">
              Active in residence
            </span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50/40">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">Loading conversation...</span>
          </div>
        ) : messages.length > 0 ? (
          <>
            {/* Minimal Date Header */}
            <div className="flex justify-center my-2">
              <span className="text-[11px] font-medium text-neutral-400 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-subtle">
                {formatHeaderDate(messages[0]?.created_at || new Date().toISOString())}
              </span>
            </div>

            {messages.map((m) => {
              const isMine = m.sender_id === user.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-md rounded-xl px-3.5 py-2 relative shadow-subtle ${
                      isMine
                        ? 'bg-neutral-950 text-white rounded-tr-xs'
                        : 'bg-white border border-neutral-200 text-neutral-900 rounded-tl-xs'
                    }`}
                  >
                    <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                      {m.content}
                    </p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMine ? 'text-neutral-400' : 'text-neutral-400'
                      }`}
                    >
                      <span>{formatMessageTime(m.created_at)}</span>
                      {isMine && (
                        <CheckCheck size={12} className="text-neutral-400 inline" />
                      )}
                    </div>
                  </div>

                  {/* Delete Button on Hover */}
                  <button
                    onClick={() => handleDeleteMessage(m.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-400 hover:text-neutral-900 self-center ${
                      isMine ? 'mr-1.5 order-first' : 'ml-1.5'
                    }`}
                    title="Delete message"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
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

      {/* Chat Composer */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn btn-primary p-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default Conversation;

