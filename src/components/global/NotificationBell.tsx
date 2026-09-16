import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import {
  fetchNotifications,
  readIds,
  markAllRead,
  type AppNotification,
} from '@/lib/notifications';

const KIND_DOT: Record<AppNotification['kind'], string> = {
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky',
};

export default function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(() => readIds());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const unread = items.filter((i) => !read.has(i.id));

  const handleMarkAll = () => {
    markAllRead(items.map((i) => i.id));
    setRead(readIds());
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread.length > 0 ? ` (${unread.length} non lues)` : ''}`}
        aria-expanded={open}
        className={`relative rounded-lg p-2 transition-colors ${
          dark ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-navy/5'
        }`}
      >
        <Bell size={20} aria-hidden />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 text-[10px] font-bold text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-navy/10 bg-white text-navy shadow-xl sm:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-navy/10 px-4 py-3">
            <p className="text-sm font-bold">
              Notifications
              {unread.length > 0 && (
                <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-[11px] font-bold text-slate-500">
                  {unread.length} non lue{unread.length > 1 ? 's' : ''}
                </span>
              )}
            </p>
            {unread.length > 0 && (
              <button
                onClick={handleMarkAll}
                className="shrink-0 text-xs font-semibold text-sky hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BellRing size={24} className="text-slate-300" aria-hidden />
                <p className="text-sm font-semibold">Rien à signaler</p>
                <p className="text-xs text-slate-500">
                  Promesses dues, retards et emails rejetés apparaîtront ici.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-navy/5">
                {items.map((n) => {
                  const isNew = !read.has(n.id);
                  return (
                    <li key={n.id}>
                      <Link
                        to={n.link}
                        onClick={() => setOpen(false)}
                        className={`flex gap-3 px-4 py-3 transition-colors hover:bg-mist/60 ${
                          isNew ? 'bg-sky/5' : ''
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${KIND_DOT[n.kind]}`}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{n.title}</span>
                          <span className="block truncate text-xs text-slate-500">{n.detail}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
