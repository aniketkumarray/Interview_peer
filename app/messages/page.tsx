'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Briefcase, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck,
  Users
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/components/auth-context';
import { createClient } from '@/lib/supabase/client';
import { getPeerBuddies, getChatHistory, sendMessageAction, PeerBuddy, ChatMessage } from '@/app/actions/chat';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPeerId = searchParams.get('peerId');
  const { user } = useAuth();

  const [buddies, setBuddies] = useState<PeerBuddy[]>([]);
  const [activePeerId, setActivePeerId] = useState<string | null>(initialPeerId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingBuddies, setLoadingBuddies] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(!!initialPeerId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load PeerBuddies on mount
  useEffect(() => {
    async function loadBuddies() {
      try {
        const data = await getPeerBuddies();
        setBuddies(data);
        if (!activePeerId && data.length > 0) {
          setActivePeerId(data[0].peer.id);
        }
      } catch (err) {
        console.error('Failed to load PeerBuddies:', err);
      } finally {
        setLoadingBuddies(false);
      }
    }
    loadBuddies();
  }, []);

  // Load active conversation & subscribe to real-time updates
  useEffect(() => {
    if (!activePeerId || !user) return;

    let isMounted = true;
    setLoadingChat(true);

    async function loadHistory() {
      try {
        const history = await getChatHistory(activePeerId!);
        if (isMounted) {
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        if (isMounted) setLoadingChat(false);
      }
    }

    loadHistory();

    // Subscribe to incoming realtime messages
    const channel = supabase
      .channel(`chat_room_${user.id}_${activePeerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === user.id && msg.receiver_id === activePeerId) ||
            (msg.sender_id === activePeerId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [
                ...prev,
                {
                  id: msg.id,
                  senderId: msg.sender_id,
                  receiverId: msg.receiver_id,
                  content: msg.content,
                  createdAt: msg.created_at,
                },
              ];
            });

            // Update last message in buddies list
            setBuddies((prev) =>
              prev.map((b) =>
                b.peer.id === activePeerId
                  ? {
                      ...b,
                      lastMessage: {
                        content: msg.content,
                        createdAt: msg.created_at,
                        senderId: msg.sender_id,
                      },
                    }
                  : b
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activePeerId, user, supabase]);

  const activeBuddy = buddies.find((b) => b.peer.id === activePeerId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activePeerId || sending) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const newMsg = await sendMessageAction(activePeerId, text);
      setMessages((prev) => [...prev, newMsg]);

      // Update buddy last message in list
      setBuddies((prev) =>
        prev.map((b) =>
          b.peer.id === activePeerId
            ? {
                ...b,
                lastMessage: {
                  content: newMsg.content,
                  createdAt: newMsg.createdAt,
                  senderId: newMsg.senderId,
                },
              }
            : b
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredBuddies = buddies.filter(
    (b) =>
      b.peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.peer.targetRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sandow-500/15 border border-sandow-500/30 text-sandow-400 text-xs font-semibold mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>PeerBuddies Chat</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Direct Messaging</h1>
          </div>
        </div>

        {/* Messaging Interface */}
        {loadingBuddies ? (
          <div className="flex-1 glass-panel rounded-[2rem] border border-white/10 p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-sandow-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 text-sm font-medium">Loading PeerBuddies...</p>
          </div>
        ) : buddies.length === 0 ? (
          <div className="flex-1 glass-panel rounded-[2rem] border border-white/10 p-8 sm:p-16 text-center flex flex-col items-center justify-center min-h-[450px] bg-white/5">
            <div className="w-16 h-16 rounded-full bg-sandow-500/20 border border-sandow-500/30 flex items-center justify-center text-sandow-400 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No PeerBuddies Yet</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              Direct Messaging unlocks automatically when an invitation is accepted between you and another practice partner.
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="px-6 py-3 rounded-full bg-sandow-500 hover:bg-sandow-400 text-white font-bold text-xs shadow-[0_0_20px_-5px_rgba(255,107,0,0.5)] transition"
            >
              Discover Practice Partners →
            </button>
          </div>
        ) : (
          <div className="flex-1 glass-panel rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden flex h-[650px]">
            {/* Sidebar: PeerBuddies List */}
            <div
              className={`w-full md:w-80 border-r border-white/10 flex flex-col shrink-0 ${
                mobileShowChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search Box */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search PeerBuddies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sandow-500"
                  />
                </div>
              </div>

              {/* Buddy List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {filteredBuddies.map(({ peer, lastMessage }) => {
                  const isSelected = peer.id === activePeerId;
                  return (
                    <button
                      key={peer.id}
                      onClick={() => {
                        setActivePeerId(peer.id);
                        setMobileShowChat(true);
                      }}
                      className={`w-full p-4 flex items-center gap-3 text-left transition ${
                        isSelected
                          ? 'bg-sandow-500/15 border-l-4 border-l-sandow-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/50 flex items-center justify-center">
                        {peer.avatarUrl ? (
                          <img src={peer.avatarUrl} alt={peer.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-sandow-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-xs text-white truncate">{peer.name}</span>
                          {lastMessage && (
                            <span className="text-[10px] text-slate-500">
                              {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {lastMessage ? (
                            <span>{lastMessage.senderId === user?.id ? 'You: ' : ''}{lastMessage.content}</span>
                          ) : (
                            <span className="italic text-slate-500">{peer.targetRole}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content: Chat Window */}
            <div
              className={`flex-1 flex flex-col bg-black/30 ${
                !mobileShowChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {activeBuddy ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMobileShowChat(false)}
                        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/50 flex items-center justify-center">
                        {activeBuddy.peer.avatarUrl ? (
                          <img src={activeBuddy.peer.avatarUrl} alt={activeBuddy.peer.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-sandow-400" />
                        )}
                      </div>

                      <div>
                        <h2 className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{activeBuddy.peer.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-sandow-500/20 text-sandow-400 text-[10px] font-semibold border border-sandow-500/30">
                            PeerBuddy
                          </span>
                        </h2>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="w-3 h-3 text-sandow-400" />
                          <span>{activeBuddy.peer.targetRole}</span>
                          <span>•</span>
                          <span>{activeBuddy.peer.timezone}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/peers/${activeBuddy.peer.id}`)}
                      className="text-xs font-semibold text-sandow-400 hover:text-sandow-300 underline"
                    >
                      View Profile
                    </button>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {loadingChat ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-6 h-6 border-2 border-sandow-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs">Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <Sparkles className="w-8 h-8 text-sandow-400/60 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Say hello to {activeBuddy.peer.name}!</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                          Coordinate your upcoming mock interview schedule, share documents, or discuss prep topics.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                                isMe
                                  ? 'bg-sandow-500 text-white rounded-tr-none'
                                  : 'bg-black/60 border border-white/10 text-slate-200 rounded-tl-none'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={`Message ${activeBuddy.peer.name}...`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sandow-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || sending}
                      className="px-5 py-2.5 rounded-xl bg-sandow-500 hover:bg-sandow-400 text-white text-xs font-bold transition shadow-lg disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                  Select a PeerBuddy from the sidebar to view chat history.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-sandow-500 border-t-transparent rounded-full animate-spin mb-4" />
          Loading messages...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
