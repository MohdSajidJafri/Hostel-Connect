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
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="bg-white rounded shadow">
        {loading ? (
          <div className="p-4 text-center">
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length > 0 ? (
          conversations.map(conversation => (
            <Link 
              key={conversation.user_id} 
              to={`/messages/${conversation.user_id}`}
              className={`block border-b last:border-b-0 p-4 hover:bg-gray-50 ${conversation.unread ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-xs text-gray-500">
                    {conversation.avatar_url ? (
                      <img 
                        src={conversation.avatar_url} 
                        alt={conversation.full_name || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      conversation.full_name 
                        ? conversation.full_name.split(' ').map(n => n[0]).join('') 
                        : 'U'
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{conversation.full_name}</h2>
                    <p className="text-sm text-gray-600 truncate max-w-xs">{conversation.last_message}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatMessageTime(conversation.last_message_time)}
                  {conversation.unread && (
                    <span className="ml-2 w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start a conversation by searching for residents.
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
