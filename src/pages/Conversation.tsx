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
    <div className="container mx-auto p-4 h-full flex flex-col">
      <div className="bg-white rounded shadow flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="text-blue-500 hover:text-blue-700"
          >
            &larr; Back
          </button>
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-xs text-gray-500">
            {otherUserProfile.avatar_url ? (
              <img 
                src={otherUserProfile.avatar_url} 
                alt={otherUserProfile.full_name || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              otherUserProfile.full_name 
                ? otherUserProfile.full_name.split(' ').map(n => n[0]).join('') 
                : 'U'
            )}
          </div>
          <h2 className="font-semibold">{otherUserProfile.full_name || 'Unknown User'}</h2>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center">
              <p>Loading messages...</p>
            </div>
          ) : messages.length > 0 ? (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                    message.sender_id === user.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
