'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-context';
import { UserProfile } from '@/types';

interface ChatDialogProps {
  peer: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDialog({ peer, isOpen, onClose }: ChatDialogProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const supabase = createClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peer.id}),and(sender_id.eq.${peer.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${user.id}_${peer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new;
          // Only add if it belongs to this conversation
          if (
            (msg.sender_id === user.id && msg.receiver_id === peer.id) ||
            (msg.sender_id === peer.id && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user, peer.id, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // optimistic clear

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: peer.id,
        content: msgText,
      });
      
    if (error) {
      console.error('Failed to send message', error);
      // fallback handling could go here
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-sandow-500/20 flex items-center justify-center border border-sandow-500/30">
              <User className="w-5 h-5 text-sandow-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">{peer.name}</h3>
              <p className="text-xs text-slate-400">{peer.targetRole}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-sandow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Send className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No messages yet.</p>
              <p className="text-xs text-slate-500">Send a message to start coordinating!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div 
                  key={msg.id || idx} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine 
                        ? 'bg-sandow-500 text-white rounded-tr-sm' 
                        : 'bg-white/10 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/5">
          <div className="relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sandow-500 transition"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-sandow-500 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sandow-400 transition"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
