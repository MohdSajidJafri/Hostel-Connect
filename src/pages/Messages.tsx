import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';

type Conversation = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread: boolean;
};

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all messages where the current user is either sender or recipient
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
        
      if (messagesError) {
        throw messagesError;
      }
      
      if (!messages || messages.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }
      
      // Get unique user IDs from messages (excluding current user)
      const userIds = [...new Set(
        messages.map(msg => 
          msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        )
      )];
      
      // Get user profiles for these IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
        
      if (profilesError) {
        throw profilesError;
      }
      
      // Create conversation objects
      const conversationMap = new Map<string, Conversation>();
      
      for (const message of messages) {
        const otherUserId = message.sender_id === user.id 
          ? message.recipient_id 
          : message.sender_id;
          
        if (!conversationMap.has(otherUserId)) {
          const profile = profiles?.find(p => p.user_id === otherUserId);
          
          conversationMap.set(otherUserId, {
            user_id: otherUserId,
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
            last_message: message.content,
            last_message_time: message.created_at,
            unread: message.recipient_id === user.id && !message.read
          });
        }
      }
      
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };
  
  const handleDeleteConversation = async (e: React.MouseEvent, otherUserId: string) => {
    e.preventDefault(); // Prevent navigating to the conversation
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this entire conversation?')) return;
    
    if (!user) return;
    
    try {
      // Delete all messages between these two users
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setConversations(prev => prev.filter(conv => conv.user_id !== otherUserId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
        <Link to="/search" className="btn btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          New Message
        </Link>
      </div>
      
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-slate-500">Loading conversations...</p>
          </div>
        ) : conversations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {conversations.map(conversation => (
              <Link 
                key={conversation.user_id} 
                to={`/messages/${conversation.user_id}`}
                className={`block p-4 hover:bg-slate-50 transition-colors group ${conversation.unread ? 'bg-primary-50/50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full overflow-hidden flex items-center justify-center text-slate-500 shadow-inner border border-white flex-shrink-0">
                      {conversation.avatar_url ? (
                        <img 
                          src={conversation.avatar_url} 
                          alt={conversation.full_name || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-lg">
                          {conversation.full_name 
                            ? conversation.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                            : 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-lg ${conversation.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {conversation.full_name}
                      </h2>
                      <p className={`text-sm truncate max-w-[200px] sm:max-w-xs md:max-w-md ${conversation.unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs ${conversation.unread ? 'text-primary-600 font-semibold' : 'text-slate-400'}`}>
                        {formatMessageTime(conversation.last_message_time)}
                      </span>
                      {conversation.unread && (
                        <span className="w-2.5 h-2.5 bg-primary-500 rounded-full shadow-sm"></span>
                      )}
                    </div>
                    
                    {/* Delete conversation button (visible on hover) */}
                    <button
                      onClick={(e) => handleDeleteConversation(e, conversation.user_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      title="Delete conversation"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Start connecting with other residents by searching for them in the directory.</p>
            <Link to="/search" className="btn btn-primary">
              Find Residents
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
