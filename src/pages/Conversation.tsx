import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

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
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId},recipient_id=eq.${user.id}`
        }, (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          markMessageAsRead(newMessage.id);
          scrollToBottom();
        })
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
        
      if (error) {
        throw error;
      }
      
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
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setMessages(data || []);
      
      // Mark unread messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.read
      ) || [];
      
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
    
    try {
      setSending(true);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: userId,
          content: newMessage.trim(),
          read: false
        });
        
      if (error) {
        throw error;
      }
      
      // Add the new message to the UI immediately
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        sender_id: user.id,
        recipient_id: userId,
        content: newMessage.trim(),
        read: false,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
        
      if (error) {
        throw error;
      }
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>You must be logged in to view messages.</p>
      </div>
    );
  }
  
  if (!userId || !otherUserProfile) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>User not found.</p>
        <button 
          onClick={() => navigate('/messages')}
          className="mt-4 text-blue-500 hover:text-blue-700"
        >
          &larr; Back to Messages
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 h-[calc(100vh-5rem)] max-w-4xl animate-in fade-in duration-500">
      <div className="card p-0 flex flex-col h-full overflow-hidden border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-100 p-4 flex items-center gap-4 bg-white z-10 shadow-sm">
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full overflow-hidden flex items-center justify-center text-slate-500 shadow-inner flex-shrink-0">
            {otherUserProfile.avatar_url ? (
              <img 
                src={otherUserProfile.avatar_url} 
                alt={otherUserProfile.full_name || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-sm">
                {otherUserProfile.full_name 
                  ? otherUserProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                  : 'U'}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{otherUserProfile.full_name || 'Unknown User'}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Active now
            </p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map(message => {
              const isMine = message.sender_id === user.id;
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}
                >
                  <div 
                    className={`max-w-[75%] md:max-w-md rounded-2xl px-4 py-2.5 shadow-sm relative ${
                      isMine 
                        ? 'bg-primary-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${
                      isMine ? 'text-primary-100' : 'text-slate-400'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white border border-slate-200 text-red-500 rounded-full shadow-sm hover:bg-red-50 ${
                      isMine ? '-left-10' : '-right-10'
                    }`}
                    title="Delete message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <p>No messages yet. Say hi!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 bg-white">
          <div className="flex gap-2 items-end relative">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button 
              type="submit" 
              className="bg-primary-600 text-white p-3 rounded-2xl hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow active:scale-95 flex-shrink-0"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
