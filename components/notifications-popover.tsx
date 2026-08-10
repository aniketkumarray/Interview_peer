'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-context';

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`notif_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!user) return;

    // Mark single notification as read if unread
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    // Route depending on notification type
    switch (notification.type) {
      case 'message_received':
        router.push('/messages');
        break;
      case 'invitation_received':
      case 'invitation_countered':
      case 'invitation_declined':
        router.push('/invitations');
        break;
      case 'invitation_accepted':
      case 'feedback_received':
        router.push('/sessions');
        break;
      default:
        router.push('/invitations');
        break;
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'message_received':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'invitation_received':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'invitation_accepted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'invitation_countered':
        return <RefreshCw className="w-4 h-4 text-purple-400" />;
      case 'invitation_declined':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'feedback_received':
        return <Star className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-sandow-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition group"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5 text-slate-300 group-hover:text-white transition" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sandow-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,107,0,0.8)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right animate-fadeIn">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sandow-500/20 text-sandow-400 border border-sandow-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-sandow-400 hover:text-sandow-300 font-medium transition"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-88 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center justify-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mb-1" />
                <p className="font-medium text-slate-300">You're all caught up!</p>
                <p className="text-xs text-slate-500">Notifications for messages, requests, and feedback will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-white/5 transition cursor-pointer ${
                      !n.is_read ? 'bg-sandow-500/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                        {renderIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-relaxed ${
                            !n.is_read ? 'text-white font-medium' : 'text-slate-300'
                          }`}
                        >
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-sandow-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(255,107,0,0.8)]" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
