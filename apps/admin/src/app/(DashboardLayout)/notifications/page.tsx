'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  getCachedAvatar,
  resolveAvatarUrl,
} from '@/lib/admin-avatar';

const FRONTEND_URL = (
  process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
).replace(/\/$/, '');

const getUserAvatarSource = (avatarUrl?: string | null) => {
  if (!avatarUrl) return null;
  if (/^(https?:|data:|blob:)/i.test(avatarUrl)) return avatarUrl;
  return `${FRONTEND_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
};

type SupportAttachment = {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
};

type TicketReply = {
  id: string;
  authorRole: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  attachments?: SupportAttachment[] | null;
};

type SupportTicket = {
  id: string;
  userId: string;
  category: string;
  topic: string;
  message: string;
  status: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  replies?: TicketReply[];
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  };
};

type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  meta?: {
    ticketId?: string;
    topic?: string;
    message?: string;
    userId?: string;
  } | null;
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const;

const POLL_MS = 8000;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
};

const formatBubbleTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));

const chatDayKey = (value: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));

const formatChatDayLabel = (value: string) => {
  const key = chatDayKey(value);
  const todayKey = chatDayKey(new Date().toISOString());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = chatDayKey(yesterday.toISOString());

  if (key === todayKey) return 'Today';
  if (key === yesterdayKey) return 'Yesterday';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
};

function ChatDayDivider({ label }: { label: string }) {
  return (
    <div className="my-2.5 flex justify-center">
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm">
        {label}
      </span>
    </div>
  );
}

function parseAttachments(value: unknown): SupportAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name : '';
      const url = typeof row.url === 'string' ? row.url : '';
      if (!name || !url) return null;
      return {
        name,
        url,
        size: typeof row.size === 'number' ? row.size : undefined,
        mimeType: typeof row.mimeType === 'string' ? row.mimeType : undefined,
      };
    })
    .filter((item): item is SupportAttachment => Boolean(item));
}

/** Keep one inbox row per support ticket. */
function dedupeNotificationsByTicket(items: AppNotification[]) {
  const seen = new Set<string>();
  const result: AppNotification[] = [];
  for (const item of items) {
    const ticketId = item.meta?.ticketId?.trim();
    if (ticketId) {
      if (seen.has(ticketId)) continue;
      seen.add(ticketId);
    }
    result.push(item);
  }
  return result;
}

function statusLabel(status?: string) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'resolved') return 'Resolved';
  if (status === 'closed') return 'Closed';
  if (status === 'open') return 'Open';
  return null;
}

function notificationTone(type: string) {
  if (type === 'user_reply') {
    return {
      icon: 'solar:chat-round-dots-bold-duotone',
      chip: 'User reply',
      chipClass: 'bg-blue-50 text-blue-700',
      iconWrap: 'bg-blue-50 text-blue-700',
    };
  }
  if (type === 'billing_support') {
    return {
      icon: 'solar:bill-list-bold-duotone',
      chip: 'New request',
      chipClass: 'bg-amber-50 text-amber-700',
      iconWrap: 'bg-amber-50 text-amber-700',
    };
  }
  if (type === 'support_reply') {
    return {
      icon: 'solar:reply-bold-duotone',
      chip: 'Your reply',
      chipClass: 'bg-emerald-50 text-emerald-700',
      iconWrap: 'bg-emerald-50 text-emerald-700',
    };
  }
  return {
    icon: 'solar:bell-bing-bold-duotone',
    chip: 'Update',
    chipClass: 'bg-zinc-100 text-zinc-600',
    iconWrap: 'bg-zinc-100 text-zinc-600',
  };
}

function isImageAttachment(file: SupportAttachment) {
  if (file.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || file.url);
}

function AttachmentList({
  items,
  outgoing = false,
}: {
  items: SupportAttachment[];
  outgoing?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="mt-1.5 space-y-1.5">
      {items.map((file) => {
        if (isImageAttachment(file)) {
          return (
            <a
              key={`${file.url}-${file.name}`}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.name}
                className="max-h-52 w-full object-cover"
              />
            </a>
          );
        }
        return (
          <a
            key={`${file.url}-${file.name}`}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
              outgoing ? 'bg-black/5 text-zinc-700' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            <Icon icon="solar:paperclip-linear" width={12} />
            <span className="truncate">{file.name}</span>
          </a>
        );
      })}
    </div>
  );
}

function ChatAvatar({
  src,
  name,
  tone = 'user',
}: {
  src?: string | null;
  name: string;
  tone?: 'user' | 'admin';
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || (tone === 'admin' ? 'A' : 'U');

  return (
    <span
      className={`relative mt-0.5 grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white shadow-sm ${
        tone === 'admin' ? 'bg-white text-[#e53935]' : 'bg-blue-100 text-blue-700'
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={
            tone === 'admin'
              ? 'h-[78%] w-[78%] object-contain'
              : 'h-full w-full object-cover object-center'
          }
        />
      ) : (
        <span className="text-[10px] font-bold tracking-wide">{initials}</span>
      )}
    </span>
  );
}

function MessageTicks({ readAt }: { readAt?: string | null }) {
  const read = Boolean(readAt);
  return (
    <Icon
      icon={read ? 'solar:check-read-linear' : 'solar:check-linear'}
      width={14}
      className={read ? 'text-sky-500' : 'text-zinc-400'}
    />
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'support'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ticketByNotif, setTicketByNotif] = useState<
    Record<string, SupportTicket | null>
  >({});
  const [ticketLoadingId, setTicketLoadingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyStatus, setReplyStatus] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [userOnlineByNotif, setUserOnlineByNotif] = useState<
    Record<string, boolean>
  >({});
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const expandedIdRef = useRef<string | null>(null);
  const itemsRef = useRef<AppNotification[]>([]);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const threadScrollKeyRef = useRef<{
    expandedId: string | null;
    lastReplyId: string | null;
  }>({ expandedId: null, lastReplyId: null });

  const scrollThreadToLatest = useCallback((behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const box = threadScrollRef.current;
        if (!box) return;
        box.scrollTo({ top: box.scrollHeight, behavior });
      });
    });
  }, []);

  useEffect(() => {
    expandedIdRef.current = expandedId;
  }, [expandedId]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const cached = getCachedAvatar();
    if (cached) setAdminAvatar(resolveAvatarUrl(cached));
    void fetch('/api/auth/me')
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          avatarUrl?: string | null;
        };
        if (res.ok) {
          setAdminAvatar(resolveAvatarUrl(data.avatarUrl));
        }
      })
      .catch(() => undefined);
  }, []);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=100', {
        cache: 'no-store',
      });
      const data = (await response.json().catch(() => ({}))) as {
        items?: AppNotification[];
        unreadCount?: number;
      };
      if (response.ok) {
        const nextItems = dedupeNotificationsByTicket(
          Array.isArray(data.items) ? data.items : [],
        );
        setItems(nextItems);
        setUnreadCount(
          typeof data.unreadCount === 'number'
            ? data.unreadCount
            : nextItems.filter((item) => !item.readAt).length,
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadTicket = useCallback(async (notif: AppNotification, silent = false) => {
    const ticketId = notif.meta?.ticketId;
    if (!ticketId) return;
    if (!silent) setTicketLoadingId(notif.id);
    if (!silent) setError('');
    try {
      const response = await fetch(
        `/api/support-tickets?id=${encodeURIComponent(ticketId)}`,
        { cache: 'no-store' },
      );
      const data = (await response.json().catch(() => ({}))) as SupportTicket & {
        message?: string;
        presence?: { userOnline?: boolean };
      };
      if (!response.ok) {
        throw new Error(
          typeof data.message === 'string'
            ? data.message
            : 'Unable to load ticket',
        );
      }
      const normalized: SupportTicket = {
        ...data,
        replies: (data.replies || []).map((reply) => ({
          ...reply,
          attachments: parseAttachments(reply.attachments),
        })),
      };
      setTicketByNotif((current) => {
        const prev = current[notif.id];
        const prevReplies = prev?.replies || [];
        const nextReplies = normalized.replies || [];
        if (
          prev &&
          prev.status === normalized.status &&
          prevReplies.length === nextReplies.length &&
          prevReplies.every(
            (row, index) =>
              row.id === nextReplies[index]?.id &&
              row.body === nextReplies[index]?.body &&
              row.readAt === nextReplies[index]?.readAt,
          )
        ) {
          return current;
        }
        return { ...current, [notif.id]: normalized };
      });
      setReplyStatus((current) => ({
        ...current,
        [notif.id]: data.status || 'in_progress',
      }));
      if (typeof data.presence?.userOnline === 'boolean') {
        setUserOnlineByNotif((current) => ({
          ...current,
          [notif.id]: data.presence!.userOnline as boolean,
        }));
      }
      void fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId }),
      }).catch(() => undefined);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Unable to load ticket');
        setTicketByNotif((current) => ({ ...current, [notif.id]: null }));
      }
    } finally {
      if (!silent) setTicketLoadingId(null);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    void fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => undefined);
  }, [loadNotifications]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadNotifications(true);
      void fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => undefined);
      const currentExpanded = expandedIdRef.current;
      if (!currentExpanded) return;
      const item = itemsRef.current.find((row) => row.id === currentExpanded);
      if (item?.meta?.ticketId) void loadTicket(item, true);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadNotifications, loadTicket]);

  useEffect(() => {
    if (!expandedId) {
      threadScrollKeyRef.current = { expandedId: null, lastReplyId: null };
      return;
    }
    const ticket = ticketByNotif[expandedId];
    if (!ticket) {
      threadScrollKeyRef.current = { expandedId, lastReplyId: null };
      return;
    }
    const replies = ticket.replies || [];
    const lastReplyId = replies.length ? replies[replies.length - 1].id : 'none';
    const prev = threadScrollKeyRef.current;
    const openedNow = prev.expandedId !== expandedId;
    const firstLoad =
      prev.expandedId === expandedId && prev.lastReplyId === null;
    const newMessage =
      prev.expandedId === expandedId &&
      prev.lastReplyId !== null &&
      prev.lastReplyId !== lastReplyId;

    if (openedNow || firstLoad || newMessage) {
      scrollThreadToLatest(newMessage ? 'smooth' : 'auto');
    }
    threadScrollKeyRef.current = { expandedId, lastReplyId };
  }, [expandedId, ticketByNotif, scrollThreadToLatest]);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    void loadNotifications(true);
  };

  const markOneRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, readAt: item.readAt || new Date().toISOString() }
          : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const toggleExpand = async (item: AppNotification) => {
    const next = expandedId === item.id ? null : item.id;
    setExpandedId(next);
    if (!item.readAt) void markOneRead(item.id);
    if (next && item.meta?.ticketId) {
      await loadTicket(item);
    }
  };

  const updateTicketStatus = async (item: AppNotification, status: string) => {
    const ticket = ticketByNotif[item.id];
    if (!ticket) return;
    const previous = replyStatus[item.id] || ticket.status;
    setReplyStatus((current) => ({ ...current, [item.id]: status }));
    setTicketByNotif((current) => {
      const existing = current[item.id];
      if (!existing) return current;
      return { ...current, [item.id]: { ...existing, status } };
    });
    setError('');
    try {
      const response = await fetch('/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticket.id, status }),
      });
      const data = (await response.json().catch(() => ({}))) as SupportTicket & {
        message?: string;
        status?: string;
      };
      if (!response.ok) {
        throw new Error(
          typeof data.message === 'string'
            ? data.message
            : 'Unable to update status',
        );
      }
      if (data.status) {
        setReplyStatus((current) => ({
          ...current,
          [item.id]: data.status as string,
        }));
        setTicketByNotif((current) => {
          const existing = current[item.id];
          if (!existing) return current;
          return {
            ...current,
            [item.id]: { ...existing, status: data.status as string },
          };
        });
      }
      void loadNotifications(true);
    } catch (err) {
      setReplyStatus((current) => ({ ...current, [item.id]: previous }));
      setTicketByNotif((current) => {
        const existing = current[item.id];
        if (!existing) return current;
        return { ...current, [item.id]: { ...existing, status: previous } };
      });
      setError(err instanceof Error ? err.message : 'Unable to update status');
    }
  };

  const sendReply = async (item: AppNotification) => {
    const ticket = ticketByNotif[item.id];
    const message = (replyDraft[item.id] || '').trim();
    const files = pendingFiles[item.id] || [];
    if (!ticket || (!message && !files.length)) return;
    setSendingId(item.id);
    setError('');
    try {
      let attachments: SupportAttachment[] = [];
      if (files.length) {
        const form = new FormData();
        form.set('ticketId', ticket.id);
        files.forEach((file) => form.append('files', file));
        const uploadRes = await fetch('/api/support-tickets/upload', {
          method: 'POST',
          body: form,
        });
        const uploadData = (await uploadRes.json().catch(() => ({}))) as {
          attachments?: SupportAttachment[];
          message?: string;
        };
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'Unable to upload files');
        }
        attachments = Array.isArray(uploadData.attachments)
          ? uploadData.attachments
          : [];
      }

      const response = await fetch('/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ticket.id,
          reply: true,
          message,
          status: replyStatus[item.id] || ticket.status,
          attachments,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as SupportTicket & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(
          typeof data.message === 'string' ? data.message : 'Unable to send reply',
        );
      }
      setTicketByNotif((current) => ({
        ...current,
        [item.id]: {
          ...data,
          replies: (data.replies || []).map((reply) => ({
            ...reply,
            attachments: parseAttachments(reply.attachments),
          })),
        },
      }));
      setReplyDraft((current) => ({ ...current, [item.id]: '' }));
      setPendingFiles((current) => ({ ...current, [item.id]: [] }));
      setReplyStatus((current) => ({
        ...current,
        [item.id]: data.status || current[item.id],
      }));
      void loadNotifications(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reply');
    } finally {
      setSendingId(null);
    }
  };

  const supportCount = items.filter((item) =>
    ['billing_support', 'user_reply', 'support_reply', 'ticket_status'].includes(
      item.type,
    ),
  ).length;

  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return !item.readAt;
    if (filter === 'support') {
      return ['billing_support', 'user_reply', 'support_reply', 'ticket_status'].includes(
        item.type,
      );
    }
    return true;
  });

  const filters = [
    { id: 'all' as const, label: 'All', count: items.length },
    { id: 'unread' as const, label: 'Unread', count: unreadCount },
    { id: 'support' as const, label: 'Support', count: supportCount },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[920px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-.04em] text-zinc-950 dark:text-white">
              Notifications
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e53935]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#e53935]">
              <span
                className={`size-1.5 rounded-full ${
                  unreadCount > 0 ? 'animate-pulse bg-[#e53935]' : 'bg-[#e53935]/40'
                }`}
              />
              {unreadCount} unread
            </span>
          </div>
          <p className="mt-2 max-w-xl text-[13px] leading-5 text-zinc-500">
            Billing support requests and user replies appear here live. Open any
            item to continue the conversation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-xs font-semibold text-white transition hover:bg-[#e53935] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon icon="solar:check-read-linear" width={15} />
          Mark all read
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition ${
                active
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:border-[#e53935]/40 hover:text-[#e53935] dark:border-white/10 dark:bg-transparent'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-zinc-200/80 bg-white/80 px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            <Icon
              icon="solar:refresh-circle-linear"
              width={22}
              className="animate-spin text-[#e53935]"
            />
            <p className="mt-3 text-sm text-zinc-500">Loading inbox…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="overflow-hidden rounded-[26px] border border-zinc-200/80 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e53935]/10 text-[#e53935]">
              <Icon icon="solar:bell-bing-bold-duotone" width={22} />
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-[-.03em] text-zinc-950 dark:text-white">
              {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              {filter === 'unread'
                ? 'New billing requests and user replies will show up here automatically.'
                : 'When users send billing support requests, they appear in this inbox.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const expanded = expandedId === item.id;
            const ticket = ticketByNotif[item.id];
            const canReply = Boolean(item.meta?.ticketId);
            const files = pendingFiles[item.id] || [];
            const tone = notificationTone(item.type);
            const ticketState = statusLabel(
              replyStatus[item.id] || ticket?.status,
            );
            const userName =
              ticket?.userName ||
              ticket?.user?.name ||
              ticket?.userEmail ||
              item.meta?.topic ||
              'User';
            const userAvatar = getUserAvatarSource(ticket?.user?.avatarUrl);
            const userOnline = Boolean(userOnlineByNotif[item.id]);
            const preview =
              item.meta?.topic ||
              item.meta?.message ||
              item.body;
            const closed = (replyStatus[item.id] || ticket?.status) === 'closed';

            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-[24px] border bg-white/90 shadow-[0_14px_40px_rgba(45,40,65,0.05)] transition dark:bg-white/[0.02] ${
                  expanded
                    ? 'border-[#e53935]/30 ring-1 ring-[#e53935]/15'
                    : item.readAt
                      ? 'border-zinc-200/90 hover:border-zinc-300 dark:border-white/10'
                      : 'border-[#e53935]/20 hover:border-[#e53935]/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => void toggleExpand(item)}
                  className="flex w-full items-start gap-3.5 px-4 py-4 text-left sm:gap-4 sm:px-5"
                >
                  <span
                    className={`mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl ${tone.iconWrap}`}
                  >
                    <Icon icon={tone.icon} width={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-semibold tracking-[-.02em] text-zinc-950 dark:text-white">
                        {item.title}
                      </strong>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chipClass}`}
                      >
                        {tone.chip}
                      </span>
                      {!item.readAt ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-[13px] leading-5 text-zinc-500">
                      {preview}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      {ticketState ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 font-medium text-zinc-500 dark:bg-white/5">
                          {ticketState}
                        </span>
                      ) : null}
                      {canReply ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[#e53935]">
                          {expanded ? 'Hide conversation' : 'Open conversation'}
                          <Icon
                            icon="solar:alt-arrow-down-linear"
                            width={13}
                            className={`transition ${expanded ? 'rotate-180' : ''}`}
                          />
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {!item.readAt ? (
                    <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[#e53935] ring-4 ring-[#e53935]/10" />
                  ) : null}
                </button>

                {expanded && canReply ? (
                  <div className="overflow-hidden border-t border-zinc-200 dark:border-white/10">
                    {ticketLoadingId === item.id && !ticket ? (
                      <div className="bg-[#f0f2f5] px-4 py-8 text-center text-sm text-zinc-500">
                        Loading conversation…
                      </div>
                    ) : ticket ? (
                      <>
                        {/* WhatsApp-style header */}
                        <div className="flex items-center gap-3 bg-[#f0f2f5] px-3 py-2.5 sm:px-4">
                          <ChatAvatar
                            src={userAvatar}
                            name={userName}
                            tone="user"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {userName}
                            </p>
                            <p
                              className={`text-[11px] ${
                                userOnline ? 'text-emerald-600' : 'text-zinc-500'
                              }`}
                            >
                              {userOnline ? 'online' : 'offline'}
                              {ticket.userEmail || ticket.user?.email
                                ? ` · ${ticket.userEmail || ticket.user?.email}`
                                : ''}
                            </p>
                          </div>
                          <div className="relative shrink-0">
                            <select
                              value={
                                replyStatus[item.id] ||
                                ticket.status ||
                                'in_progress'
                              }
                              onChange={(event) =>
                                void updateTicketStatus(item, event.target.value)
                              }
                              onClick={(event) => event.stopPropagation()}
                              className="h-8 appearance-none rounded-full border-0 bg-white py-0 pl-3 pr-8 text-[11px] font-semibold text-zinc-600 shadow-sm outline-none"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <Icon
                              icon="solar:alt-arrow-down-linear"
                              width={14}
                              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                            />
                          </div>
                        </div>

                        {/* Chat wallpaper */}
                        <div
                          ref={threadScrollRef}
                          className="relative max-h-[420px] overflow-y-auto px-2.5 py-3 sm:px-4 [scrollbar-width:thin]"
                          style={{
                            backgroundColor: '#efeae2',
                            backgroundImage:
                              'radial-gradient(circle at 20% 20%, rgba(0,0,0,0.035) 0 1px, transparent 1px), radial-gradient(circle at 80% 40%, rgba(0,0,0,0.03) 0 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(0,0,0,0.025) 0 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                          }}
                        >
                          <ChatDayDivider
                            label={formatChatDayLabel(ticket.createdAt)}
                          />
                          <div className="mb-3 flex justify-center">
                            <div className="max-w-[90%] rounded-lg bg-[#ffeeba]/95 px-3 py-2 text-center text-[11px] leading-4 text-zinc-700 shadow-sm sm:max-w-[75%]">
                              <p className="font-semibold">{ticket.topic}</p>
                              <p className="mt-0.5 whitespace-pre-wrap">
                                {ticket.message}
                              </p>
                            </div>
                          </div>

                          {(ticket.replies || []).length > 0 ? (
                            <div className="space-y-1.5">
                              {ticket.replies?.map((reply, index) => {
                                const replies = ticket.replies || [];
                                const isAdmin = reply.authorRole === 'admin';
                                const attachments = parseAttachments(
                                  reply.attachments,
                                );
                                const hideBody =
                                  (!reply.body ||
                                    reply.body === 'Sent an attachment') &&
                                  attachments.length > 0;
                                const dayKey = chatDayKey(reply.createdAt);
                                const prevDayKey =
                                  index > 0
                                    ? chatDayKey(replies[index - 1].createdAt)
                                    : chatDayKey(ticket.createdAt);
                                const showDayDivider = dayKey !== prevDayKey;

                                return (
                                  <div key={reply.id}>
                                    {showDayDivider ? (
                                      <ChatDayDivider
                                        label={formatChatDayLabel(reply.createdAt)}
                                      />
                                    ) : null}
                                    <div
                                      className={`flex items-end gap-1.5 ${
                                        isAdmin ? 'justify-end' : 'justify-start'
                                      }`}
                                    >
                                    {!isAdmin ? (
                                      <ChatAvatar
                                        src={userAvatar}
                                        name={userName}
                                        tone="user"
                                      />
                                    ) : (
                                      <span className="size-9 shrink-0" />
                                    )}

                                    <div
                                      className={`relative max-w-[82%] px-2.5 pb-1.5 pt-1.5 text-[13.5px] leading-5 shadow-sm sm:max-w-[70%] ${
                                        isAdmin
                                          ? 'rounded-2xl rounded-br-md bg-[#d9fdd3] text-zinc-900'
                                          : 'rounded-2xl rounded-bl-md bg-white text-zinc-800'
                                      }`}
                                    >
                                      <span
                                        className={`absolute bottom-0 h-0 w-0 border-y-[6px] border-y-transparent ${
                                          isAdmin
                                            ? '-right-[5px] border-l-[6px] border-l-[#d9fdd3]'
                                            : '-left-[5px] border-r-[6px] border-r-white'
                                        }`}
                                      />
                                      {!isAdmin ? (
                                        <p className="mb-0.5 text-[11px] font-semibold text-[#00a884]">
                                          {userName}
                                        </p>
                                      ) : null}
                                      {attachments.length ? (
                                        <AttachmentList
                                          items={attachments}
                                          outgoing={isAdmin}
                                        />
                                      ) : null}
                                      {!hideBody ? (
                                        <p className="whitespace-pre-wrap break-words">
                                          {reply.body}
                                        </p>
                                      ) : null}
                                      <div className="-mb-0.5 mt-1 flex items-center justify-end gap-1 pl-8">
                                        <span className="text-[10px] text-zinc-500">
                                          {formatBubbleTime(reply.createdAt)}
                                        </span>
                                        {isAdmin ? (
                                          <MessageTicks readAt={reply.readAt} />
                                        ) : null}
                                      </div>
                                    </div>

                                    {isAdmin ? (
                                      <ChatAvatar
                                        src={adminAvatar}
                                        name="Admin"
                                        tone="admin"
                                      />
                                    ) : (
                                      <span className="size-9 shrink-0" />
                                    )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex justify-center py-10">
                              <p className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-zinc-500 shadow-sm">
                                No replies yet — send the first message
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Composer */}
                        {!closed ? (
                          <div className="bg-[#f0f2f5] px-2 py-2 sm:px-3">
                            {files.length ? (
                              <div className="mb-2 flex flex-wrap gap-1.5 px-1">
                                {files.map((file, index) => (
                                  <span
                                    key={`${file.name}-${index}`}
                                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-zinc-700 shadow-sm"
                                  >
                                    <Icon
                                      icon="solar:paperclip-linear"
                                      width={11}
                                    />
                                    <span className="max-w-[120px] truncate">
                                      {file.name}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label="Remove file"
                                      onClick={() =>
                                        setPendingFiles((current) => ({
                                          ...current,
                                          [item.id]: (
                                            current[item.id] || []
                                          ).filter((_, i) => i !== index),
                                        }))
                                      }
                                      className="text-zinc-400 hover:text-zinc-700"
                                    >
                                      <Icon icon="solar:close-circle-linear" width={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <div className="flex items-end gap-2">
                              <label className="mb-0.5 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-700">
                                <Icon icon="solar:paperclip-linear" width={20} />
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,image/*,application/pdf"
                                  onChange={(event) => {
                                    const next = Array.from(
                                      event.target.files || [],
                                    ).slice(0, 5);
                                    setPendingFiles((current) => ({
                                      ...current,
                                      [item.id]: [
                                        ...(current[item.id] || []),
                                        ...next,
                                      ].slice(0, 5),
                                    }));
                                    event.target.value = '';
                                  }}
                                />
                              </label>
                              <div className="min-w-0 flex-1 rounded-[24px] bg-white px-3.5 py-2 shadow-sm">
                                <textarea
                                  value={replyDraft[item.id] || ''}
                                  onChange={(event) =>
                                    setReplyDraft((current) => ({
                                      ...current,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                      event.preventDefault();
                                      void sendReply(item);
                                    }
                                  }}
                                  rows={1}
                                  placeholder="Type a message"
                                  className="max-h-28 min-h-[24px] w-full resize-none bg-transparent text-[14px] leading-6 text-zinc-800 outline-none placeholder:text-zinc-400"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={
                                  sendingId === item.id ||
                                  (!(replyDraft[item.id] || '').trim() &&
                                    !files.length)
                                }
                                onClick={() => void sendReply(item)}
                                className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white shadow-sm transition hover:bg-[#029675] disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Send"
                              >
                                {sendingId === item.id ? (
                                  <Icon
                                    icon="solar:refresh-circle-linear"
                                    width={18}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Icon
                                    icon="solar:plain-2-bold"
                                    width={18}
                                  />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#f0f2f5] px-4 py-3 text-center text-sm text-amber-800">
                            This ticket is closed.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-[#f0f2f5] px-4 py-6 text-center text-sm text-zinc-500">
                        Ticket details unavailable.
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
