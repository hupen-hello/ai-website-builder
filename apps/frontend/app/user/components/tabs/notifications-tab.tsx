"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Headphones,
  Inbox,
  Loader2,
  MessageCircle,
  Paperclip,
  ReceiptText,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import type { DashboardTab } from "../sidebar";

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
    reply?: string;
    service?: string | null;
    status?: string;
    formName?: string | null;
    formSection?: string | null;
    leadId?: string;
    siteTitle?: string;
  } | null;
};

const POLL_MS = 8000;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
};

function parseAttachments(value: unknown): SupportAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name : "";
      const url = typeof row.url === "string" ? row.url : "";
      if (!name || !url) return null;
      return {
        name,
        url,
        size: typeof row.size === "number" ? row.size : undefined,
        mimeType: typeof row.mimeType === "string" ? row.mimeType : undefined,
      };
    })
    .filter((item): item is SupportAttachment => Boolean(item));
}

/** One inbox row per support ticket (older reply notifs are dropped). */
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

function cleanLeadFormLabel(formName?: string | null, formSection?: string | null) {
  const name = formName?.trim() || "";
  const isMarketing =
    !name ||
    name.length > 40 ||
    /conversation|our team|get in touch|contact us|reach out|let'?s talk|clear conversation/i.test(
      name,
    );
  if (!isMarketing) return name;

  const section = formSection?.trim() || "";
  if (/^contact/i.test(section)) return "Contact form";
  if (/^form/i.test(section)) return "Form";
  return section || "Contact form";
}

function getLeadPreview(item: AppNotification) {
  const body = (item.body || "").trim();
  let contact = body || "New form submission";

  const formName = item.meta?.formName?.trim();
  if (formName && contact.startsWith(formName)) {
    const rest = contact.slice(formName.length).replace(/^[:\s·\-–—]+/, "").trim();
    if (rest) contact = rest;
  } else {
    const colonIdx = contact.indexOf(":");
    if (colonIdx > 0 && colonIdx < contact.length - 1) {
      const prefix = contact.slice(0, colonIdx).trim();
      const rest = contact.slice(colonIdx + 1).trim();
      if (
        rest &&
        (prefix.length > 40 ||
          /conversation|our team|get in touch|contact us|reach out/i.test(prefix))
      ) {
        contact = rest;
      }
    }
  }

  const formLabel = cleanLeadFormLabel(
    item.meta?.formName,
    item.meta?.formSection,
  );
  if (formLabel && !contact.toLowerCase().startsWith(formLabel.toLowerCase())) {
    return `${formLabel} · ${contact}`;
  }
  return contact;
}

function getSubmittedContent(item: AppNotification) {
  const topic = item.meta?.topic?.trim() || "";
  const message = item.meta?.message?.trim() || "";
  const reply = item.meta?.reply?.trim() || "";
  if (topic || message || reply) {
    return { topic, message, reply };
  }

  const body = item.body || "";
  const topicMatch = body.match(/^Topic:\s*(.+?)(?:\n\n([\s\S]+))?$/);
  if (topicMatch) {
    return {
      topic: topicMatch[1]?.trim() || "",
      message: topicMatch[2]?.trim() || "",
      reply: "",
    };
  }

  const adminReplySplit = body.split(/:\n\n/);
  if (item.type === "support_reply" && adminReplySplit.length > 1) {
    return {
      topic: "",
      message: "",
      reply: adminReplySplit.slice(1).join(":\n\n").trim(),
    };
  }

  return { topic: "", message: body, reply: "" };
}

function notificationTone(type: string) {
  if (type === "support_reply") {
    return {
      icon: MessageCircle,
      chip: "Support reply",
      chipClass: "bg-blue-50 text-blue-700",
      iconWrap: "bg-blue-50 text-blue-700",
    };
  }
  if (type === "ticket_status") {
    return {
      icon: CheckCheck,
      chip: "Status update",
      chipClass: "bg-emerald-50 text-emerald-700",
      iconWrap: "bg-emerald-50 text-emerald-700",
    };
  }
  if (type === "billing_support") {
    return {
      icon: ReceiptText,
      chip: "Your request",
      chipClass: "bg-amber-50 text-amber-700",
      iconWrap: "bg-amber-50 text-amber-700",
    };
  }
  if (type === "website_lead") {
    return {
      icon: Inbox,
      chip: "New lead",
      chipClass: "bg-violet-50 text-violet-700",
      iconWrap: "bg-violet-50 text-violet-700",
    };
  }
  return {
    icon: Bell,
    chip: "Update",
    chipClass: "bg-zinc-100 text-zinc-600",
    iconWrap: "bg-zinc-100 text-zinc-600",
  };
}

function statusLabel(status?: string) {
  if (status === "in_progress") return "In progress";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  if (status === "open") return "Open";
  return null;
}

function isImageAttachment(file: SupportAttachment) {
  if (file.mimeType?.startsWith("image/")) return true;
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
        const image = isImageAttachment(file);
        if (image) {
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
              outgoing
                ? "bg-black/5 text-zinc-700"
                : "bg-zinc-100 text-zinc-700"
            }`}
          >
            <Paperclip size={12} />
            <span className="truncate">{file.name}</span>
          </a>
        );
      })}
    </div>
  );
}

function MessageTicks({ readAt }: { readAt?: string | null }) {
  const read = Boolean(readAt);
  return (
    <span
      className={`inline-flex items-center ${
        read ? "text-sky-500" : "text-zinc-500/70"
      }`}
      title={read ? "Read" : "Sent"}
    >
      {read ? (
        <CheckCheck size={15} strokeWidth={2.5} />
      ) : (
        <Check size={15} strokeWidth={2.5} />
      )}
    </span>
  );
}

function formatBubbleTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function chatDayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatChatDayLabel(value: string) {
  const key = chatDayKey(value);
  const todayKey = chatDayKey(new Date().toISOString());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = chatDayKey(yesterday.toISOString());

  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function ChatDayDivider({ label }: { label: string }) {
  return (
    <div className="my-2.5 flex justify-center">
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm">
        {label}
      </span>
    </div>
  );
}

function PresencePill({ online, label }: { online: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        online
          ? "bg-emerald-50 text-emerald-700"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          online ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />
      {label} · {online ? "Online" : "Offline"}
    </span>
  );
}

function ChatAvatar({
  src,
  name,
  tone = "user",
}: {
  src?: string | null;
  name: string;
  tone?: "user" | "support";
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || (tone === "support" ? "S" : "U");

  return (
    <span
      className={`relative mt-0.5 grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white shadow-sm ${
        tone === "support" ? "bg-white text-zinc-600" : "bg-blue-100 text-blue-700"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={
            tone === "support"
              ? "h-[78%] w-[78%] object-contain"
              : "h-full w-full object-cover"
          }
        />
      ) : (
        <span className="text-[10px] font-bold tracking-wide">{initials}</span>
      )}
    </span>
  );
}

export default function NotificationsTab({
  onNavigate,
}: {
  onNavigate: (tab: DashboardTab) => void;
}) {
  const { user } = useUserAuth();
  const userAvatar = user?.avatarUrl || null;
  const userName = user?.name || user?.email || "You";
  const supportAvatar = "/logo.png";
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "support" | "leads">(
    "all",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [repliesByTicket, setRepliesByTicket] = useState<
    Record<string, TicketReply[]>
  >({});
  const [ticketStatus, setTicketStatus] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [sendingTicketId, setSendingTicketId] = useState<string | null>(null);
  const [replyError, setReplyError] = useState("");
  const [supportOnline, setSupportOnline] = useState(false);
  const expandedIdRef = useRef<string | null>(null);
  const itemsRef = useRef<AppNotification[]>([]);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const threadScrollKeyRef = useRef<{
    expandedId: string | null;
    lastReplyId: string | null;
  }>({ expandedId: null, lastReplyId: null });

  useEffect(() => {
    expandedIdRef.current = expandedId;
  }, [expandedId]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const scrollThreadToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = threadScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const box = threadScrollRef.current;
        if (!box) return;
        box.scrollTo({ top: box.scrollHeight, behavior });
      });
    });
  }, []);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/user/notifications?limit=100", {
        credentials: "include",
        cache: "no-store",
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
          typeof data.unreadCount === "number"
            ? data.unreadCount
            : nextItems.filter((item) => !item.readAt).length,
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadTicketThread = useCallback(async (ticketId: string) => {
    if (!ticketId) return;
    try {
      const response = await fetch(
        `/api/user/support/tickets/${encodeURIComponent(ticketId)}`,
        { credentials: "include", cache: "no-store" },
      );
      const data = (await response.json().catch(() => ({}))) as {
        replies?: TicketReply[];
        status?: string;
        presence?: { supportOnline?: boolean };
      };
      if (response.ok) {
        const replies = Array.isArray(data.replies)
          ? data.replies.map((reply) => ({
              ...reply,
              attachments: parseAttachments(reply.attachments),
            }))
          : [];
        setRepliesByTicket((current) => {
          const prev = current[ticketId];
          if (
            prev &&
            prev.length === replies.length &&
            prev.every(
              (row, index) =>
                row.id === replies[index]?.id &&
                row.body === replies[index]?.body &&
                row.readAt === replies[index]?.readAt,
            )
          ) {
            return current;
          }
          return { ...current, [ticketId]: replies };
        });
        if (typeof data.status === "string") {
          setTicketStatus((current) => ({
            ...current,
            [ticketId]: data.status as string,
          }));
        }
        if (typeof data.presence?.supportOnline === "boolean") {
          setSupportOnline(data.presence.supportOnline);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const pulsePresence = useCallback(async () => {
    try {
      const response = await fetch("/api/user/presence", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        supportOnline?: boolean;
      };
      if (response.ok && typeof data.supportOnline === "boolean") {
        setSupportOnline(data.supportOnline);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    void pulsePresence();
  }, [loadNotifications, pulsePresence]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadNotifications(true);
      void pulsePresence();
      const currentExpanded = expandedIdRef.current;
      if (!currentExpanded) return;
      const item = itemsRef.current.find((row) => row.id === currentExpanded);
      if (item?.meta?.ticketId) void loadTicketThread(item.meta.ticketId);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadNotifications, loadTicketThread, pulsePresence]);

  useEffect(() => {
    if (!expandedId) return;
    const item = items.find((row) => row.id === expandedId);
    const ticketId = item?.meta?.ticketId;
    if (ticketId) void loadTicketThread(ticketId);
  }, [expandedId, items, loadTicketThread]);

  // Scroll to latest only on open or when a new message arrives — not on every poll.
  useEffect(() => {
    if (!expandedId) {
      threadScrollKeyRef.current = { expandedId: null, lastReplyId: null };
      return;
    }

    const item = items.find((row) => row.id === expandedId);
    const ticketId = item?.meta?.ticketId;
    if (!ticketId) return;

    const thread = repliesByTicket[ticketId];
    if (thread === undefined) {
      threadScrollKeyRef.current = { expandedId, lastReplyId: null };
      return;
    }

    const lastReplyId = thread.length ? thread[thread.length - 1].id : "none";
    const prev = threadScrollKeyRef.current;
    const openedNow = prev.expandedId !== expandedId;
    const firstLoad =
      prev.expandedId === expandedId && prev.lastReplyId === null;
    const newMessage =
      prev.expandedId === expandedId &&
      prev.lastReplyId !== null &&
      prev.lastReplyId !== lastReplyId;

    if (openedNow || firstLoad || newMessage) {
      scrollThreadToLatest(newMessage ? "smooth" : "auto");
    }

    threadScrollKeyRef.current = { expandedId, lastReplyId };
  }, [expandedId, repliesByTicket, items, scrollThreadToLatest]);

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.readAt);
    if (filter === "support") {
      return items.filter((item) =>
        ["billing_support", "support_reply", "ticket_status", "user_reply"].includes(
          item.type,
        ),
      );
    }
    if (filter === "leads") {
      return items.filter((item) => item.type === "website_lead");
    }
    return items;
  }, [filter, items]);

  const markAllRead = async () => {
    await fetch("/api/user/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    void loadNotifications(true);
  };

  const openItem = async (item: AppNotification) => {
    setReplyError("");

    if (!item.readAt) {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? { ...row, readAt: row.readAt || new Date().toISOString() }
            : row,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    if (item.type === "website_lead") {
      setExpandedId(null);
      onNavigate("Websites Lead");
      return;
    }

    if (!item.meta?.ticketId) {
      setExpandedId(null);
      return;
    }

    setExpandedId((current) => (current === item.id ? null : item.id));
  };

  const sendReply = async (ticketId: string) => {
    const message = (replyDraft[ticketId] || "").trim();
    const files = pendingFiles[ticketId] || [];
    if ((!message && !files.length) || sendingTicketId) return;
    setSendingTicketId(ticketId);
    setReplyError("");
    try {
      let attachments: SupportAttachment[] = [];
      if (files.length) {
        const form = new FormData();
        form.set("ticketId", ticketId);
        files.forEach((file) => form.append("files", file));
        const uploadRes = await fetch("/api/user/support/upload", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const uploadData = (await uploadRes.json().catch(() => ({}))) as {
          attachments?: SupportAttachment[];
          message?: string;
        };
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || "Unable to upload files");
        }
        attachments = Array.isArray(uploadData.attachments)
          ? uploadData.attachments
          : [];
      }

      const response = await fetch(
        `/api/user/support/tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, attachments }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        replies?: TicketReply[];
        status?: string;
      };
      if (!response.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Unable to send reply",
        );
      }
      const replies = Array.isArray(data.replies)
        ? data.replies.map((reply) => ({
            ...reply,
            attachments: parseAttachments(reply.attachments),
          }))
        : [];
      setRepliesByTicket((current) => ({ ...current, [ticketId]: replies }));
      if (typeof data.status === "string") {
        setTicketStatus((current) => ({
          ...current,
          [ticketId]: data.status as string,
        }));
      }
      setReplyDraft((current) => ({ ...current, [ticketId]: "" }));
      setPendingFiles((current) => ({ ...current, [ticketId]: [] }));
      void loadNotifications(true);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Unable to send reply");
    } finally {
      setSendingTicketId(null);
    }
  };

  const filters = [
    { id: "all" as const, label: "All", count: items.length },
    { id: "unread" as const, label: "Unread", count: unreadCount },
    {
      id: "leads" as const,
      label: "Leads",
      count: items.filter((item) => item.type === "website_lead").length,
    },
    {
      id: "support" as const,
      label: "Support",
      count: items.filter((item) =>
        ["billing_support", "support_reply", "ticket_status", "user_reply"].includes(
          item.type,
        ),
      ).length,
    },
  ];

  return (
    <section className="relative min-h-full overflow-hidden px-4 py-7 sm:px-6 sm:py-9 lg:px-9">
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-blue-100/55 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 size-80 rounded-full bg-sky-100/45 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[920px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-[-.04em] text-zinc-950">
                Notifications
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                <span
                  className={`size-1.5 rounded-full ${
                    unreadCount > 0 ? "animate-pulse bg-blue-500" : "bg-blue-300"
                  }`}
                />
                {unreadCount} unread
              </span>
              <PresencePill online={supportOnline} label="Support" />
            </div>
            <p className="mt-2 max-w-xl text-[13px] leading-5 text-zinc-500">
              Website form leads and billing support updates appear here. Open a
              lead to review the submission, or open support to continue the chat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("Websites Lead")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 text-xs font-medium text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100"
            >
              <Inbox size={15} /> Websites Lead
            </button>
            <button
              type="button"
              onClick={() => onNavigate("Billing")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              <Headphones size={15} /> Billing support
            </button>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition ${
                  active
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-blue-200 hover:text-blue-700"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-[26px] border border-zinc-200/80 bg-white/80 px-6 py-16 text-center shadow-[0_18px_50px_rgba(45,40,65,0.05)]">
              <Loader2 className="animate-spin text-blue-600" size={22} />
              <p className="mt-3 text-sm text-zinc-500">Loading your inbox…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="overflow-hidden rounded-[26px] border border-zinc-200/80 bg-[linear-gradient(160deg,#f7faff_0%,#ffffff_55%,#f4fbf8_100%)] px-6 py-16 text-center shadow-[0_18px_50px_rgba(45,40,65,0.05)]">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Sparkles size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-.03em] text-zinc-950">
                {filter === "unread"
                  ? "You're all caught up"
                  : filter === "leads"
                    ? "No lead notifications"
                    : filter === "support"
                      ? "No support updates"
                      : "No notifications yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                {filter === "unread"
                  ? "New leads and billing replies will show up here automatically."
                  : filter === "leads"
                    ? "When someone submits a form on your published website, the lead appears here."
                    : filter === "support"
                      ? "Billing support updates and admin replies appear in this filter."
                      : "Website form leads and billing support updates appear in this inbox."}
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate(filter === "leads" ? "Websites Lead" : "Billing")
                }
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                {filter === "leads" ? "Go to Websites Lead" : "Go to Billing"}
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const submitted = getSubmittedContent(item);
              const expanded = expandedId === item.id;
              const ticketId = item.meta?.ticketId;
              const isLead = item.type === "website_lead";
              const isSupportThread = Boolean(ticketId);
              const thread = ticketId ? repliesByTicket[ticketId] || [] : [];
              const status = ticketId ? ticketStatus[ticketId] : undefined;
              const canReply = Boolean(ticketId) && status !== "closed";
              const files = ticketId ? pendingFiles[ticketId] || [] : [];
              const tone = notificationTone(item.type);
              const Icon = tone.icon;
              const preview = isLead
                ? getLeadPreview(item)
                : submitted.topic ||
                  submitted.reply ||
                  submitted.message ||
                  item.body;
              const ticketState = statusLabel(status);

              return (
                <article
                  key={item.id}
                  className={`overflow-hidden rounded-[24px] border bg-white/90 shadow-[0_14px_40px_rgba(45,40,65,0.05)] transition ${
                    expanded
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : item.readAt
                        ? "border-zinc-200/90 hover:border-zinc-300"
                        : "border-blue-100 hover:border-blue-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void openItem(item)}
                    className="flex w-full items-start gap-3.5 px-4 py-4 text-left sm:gap-4 sm:px-5"
                  >
                    <span
                      className={`mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl ${tone.iconWrap}`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-semibold tracking-[-.02em] text-zinc-950">
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 font-medium text-zinc-500">
                            {ticketState}
                          </span>
                        ) : null}
                        {isLead ? (
                          <span className="inline-flex items-center gap-1 font-medium text-violet-600">
                            View lead
                          </span>
                        ) : isSupportThread ? (
                          <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                            {expanded
                              ? "Hide conversation"
                              : "Open conversation"}
                            <ChevronDown
                              size={13}
                              className={`transition ${expanded ? "rotate-180" : ""}`}
                            />
                          </span>
                        ) : null}
                      </span>
                    </span>

                    {!item.readAt ? (
                      <span className="mt-2 size-2.5 shrink-0 rounded-full bg-rose-500 ring-4 ring-rose-50" />
                    ) : null}
                  </button>

                  {expanded && isSupportThread ? (
                    <div className="overflow-hidden border-t border-zinc-200">
                      {/* WhatsApp-style chat header */}
                      <div className="flex items-center gap-3 bg-[#f0f2f5] px-3 py-2.5 sm:px-4">
                        <ChatAvatar
                          src={supportAvatar}
                          name="Support team"
                          tone="support"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            Support team
                          </p>
                          <p
                            className={`text-[11px] ${
                              supportOnline
                                ? "text-emerald-600"
                                : "text-zinc-500"
                            }`}
                          >
                            {supportOnline ? "online" : "offline"}
                          </p>
                        </div>
                        {ticketState ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-500 shadow-sm">
                            {ticketState}
                          </span>
                        ) : null}
                      </div>

                      {/* Chat wallpaper + messages */}
                      <div
                        ref={threadScrollRef}
                        className="relative max-h-[420px] overflow-y-auto px-2.5 py-3 sm:px-4 [scrollbar-width:thin]"
                        style={{
                          backgroundColor: "#efeae2",
                          backgroundImage:
                            "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.035) 0 1px, transparent 1px), radial-gradient(circle at 80% 40%, rgba(0,0,0,0.03) 0 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(0,0,0,0.025) 0 1px, transparent 1px)",
                          backgroundSize: "28px 28px",
                        }}
                      >
                        {submitted.message ? (
                          <>
                            <ChatDayDivider
                              label={formatChatDayLabel(item.createdAt)}
                            />
                            <div className="mb-3 flex justify-center">
                              <div className="max-w-[90%] rounded-lg bg-[#ffeeba]/95 px-3 py-2 text-center text-[11px] leading-4 text-zinc-700 shadow-sm sm:max-w-[75%]">
                                {submitted.topic ? (
                                  <p className="font-semibold">
                                    {submitted.topic}
                                  </p>
                                ) : null}
                                <p className="mt-0.5 whitespace-pre-wrap">
                                  {submitted.message}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : null}

                        {thread.length > 0 ? (
                          <div className="space-y-1.5">
                            {thread.map((reply, index) => {
                              const isAdmin = reply.authorRole === "admin";
                              const attachments = parseAttachments(
                                reply.attachments,
                              );
                              const hideBody =
                                (!reply.body ||
                                  reply.body === "Sent an attachment") &&
                                attachments.length > 0;
                              const dayKey = chatDayKey(reply.createdAt);
                              const prevDayKey =
                                index > 0
                                  ? chatDayKey(thread[index - 1].createdAt)
                                  : submitted.message
                                    ? chatDayKey(item.createdAt)
                                    : null;
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
                                      isAdmin ? "justify-start" : "justify-end"
                                    }`}
                                  >
                                  {isAdmin ? (
                                    <ChatAvatar
                                      src={supportAvatar}
                                      name="Support team"
                                      tone="support"
                                    />
                                  ) : (
                                    <span className="size-9 shrink-0" />
                                  )}

                                  <div
                                    className={`relative max-w-[82%] px-2.5 pb-1.5 pt-1.5 text-[13.5px] leading-5 shadow-sm sm:max-w-[70%] ${
                                      isAdmin
                                        ? "rounded-2xl rounded-bl-md bg-white text-zinc-800"
                                        : "rounded-2xl rounded-br-md bg-[#d9fdd3] text-zinc-900"
                                    }`}
                                  >
                                    {/* bubble tail */}
                                    <span
                                      className={`absolute bottom-0 h-0 w-0 border-y-[6px] border-y-transparent ${
                                        isAdmin
                                          ? "-left-[5px] border-r-[6px] border-r-white"
                                          : "-right-[5px] border-l-[6px] border-l-[#d9fdd3]"
                                      }`}
                                    />

                                    {isAdmin ? (
                                      <p className="mb-0.5 text-[11px] font-semibold text-[#00a884]">
                                        Support team
                                      </p>
                                    ) : null}
                                    {attachments.length ? (
                                      <AttachmentList
                                        items={attachments}
                                        outgoing={!isAdmin}
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
                                      {!isAdmin ? (
                                        <MessageTicks readAt={reply.readAt} />
                                      ) : null}
                                    </div>
                                  </div>

                                  {!isAdmin ? (
                                    <ChatAvatar
                                      src={userAvatar}
                                      name={userName}
                                      tone="user"
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
                              No replies yet — wait for support
                            </p>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp-style composer */}
                      {ticketId && canReply ? (
                        <div className="bg-[#f0f2f5] px-2 py-2 sm:px-3">
                          {files.length ? (
                            <div className="mb-2 flex flex-wrap gap-1.5 px-1">
                              {files.map((file, index) => (
                                <span
                                  key={`${file.name}-${index}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-zinc-700 shadow-sm"
                                >
                                  <Paperclip size={11} />
                                  <span className="max-w-[120px] truncate">
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Remove file"
                                    onClick={() =>
                                      setPendingFiles((current) => ({
                                        ...current,
                                        [ticketId]: (
                                          current[ticketId] || []
                                        ).filter((_, i) => i !== index),
                                      }))
                                    }
                                    className="text-zinc-400 hover:text-zinc-700"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {replyError && expandedId === item.id ? (
                            <p className="mb-1.5 px-2 text-xs text-rose-600">
                              {replyError}
                            </p>
                          ) : null}
                          <div className="flex items-end gap-2">
                            <label className="mb-0.5 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-700">
                              <Paperclip size={20} />
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
                                    [ticketId]: [
                                      ...(current[ticketId] || []),
                                      ...next,
                                    ].slice(0, 5),
                                  }));
                                  event.target.value = "";
                                }}
                              />
                            </label>
                            <div className="min-w-0 flex-1 rounded-[24px] bg-white px-3.5 py-2 shadow-sm">
                              <textarea
                                value={replyDraft[ticketId] || ""}
                                onChange={(event) =>
                                  setReplyDraft((current) => ({
                                    ...current,
                                    [ticketId]: event.target.value,
                                  }))
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" &&
                                    !event.shiftKey
                                  ) {
                                    event.preventDefault();
                                    void sendReply(ticketId);
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
                                sendingTicketId === ticketId ||
                                (!(replyDraft[ticketId] || "").trim() &&
                                  !files.length)
                              }
                              onClick={() => void sendReply(ticketId)}
                              className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white shadow-sm transition hover:bg-[#029675] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Send"
                            >
                              {sendingTicketId === ticketId ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <SendHorizontal size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : ticketId && status === "closed" ? (
                        <div className="bg-[#f0f2f5] px-4 py-3 text-center text-sm text-amber-800">
                          This ticket is closed. Start a new request from Billing
                          support if you still need help.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
