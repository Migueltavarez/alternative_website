'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (!session?.user) return null;

  const typeColor: Record<string, string> = {
    job_update: 'bg-blue-500',
    message: 'bg-green-500',
    plan_expiry: 'bg-amber-500',
    system: 'bg-purple-500',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-[#2D6CB0] to-[#CC2631] text-white rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 rounded-xl glass shadow-xl py-2 z-50 max-h-[420px] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="font-semibold text-sm">Notificaciones</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map((n) => {
                  const content = (
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer',
                        !n.read && 'bg-primary/5'
                      )}
                      onClick={() => markRead(n.id)}
                    >
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', typeColor[n.type] ?? 'bg-muted-foreground')} />
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium leading-tight', !n.read && 'text-foreground')}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleDateString('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
