"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";

type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  meta?: {
    topic?: string;
    message?: string;
    formName?: string | null;
    formSection?: string | null;
  } | null;
};

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

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

export default function UserNotificationsBell({
  onNavigateHref,
  onViewAll,
}: {
  onNavigateHref?: (href: string) => void;
  onViewAll?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/user/notifications?limit=20", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as {
        items?: AppNotification[];
        unreadCount?: number;
      };
      if (!response.ok) return;
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnreadCount(
        typeof data.unreadCount === "number" ? data.unreadCount : 0,
      );
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-user-notifications]")) setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/user/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  };

  const openItem = async (item: AppNotification) => {
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
    setOpen(false);
    if (item.href && onNavigateHref) onNavigateHref(item.href);
    else if (item.href) window.location.href = item.href;
    else onViewAll?.();
  };

  return (
    <div data-user-notifications className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-blue-200 hover:text-blue-700"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_55px_rgba(39,32,56,0.16)]">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-950">Notifications</p>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-600 disabled:opacity-40"
            >
              <CheckCheck size={12} /> Mark all as read
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-400">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-400">
                No notifications yet.
              </p>
            ) : (
              items.map((item) => {
                const topic = item.meta?.topic?.trim();
                const message = item.meta?.message?.trim();
                const preview =
                  item.type === "website_lead"
                    ? getLeadPreview(item)
                    : message
                      ? topic
                        ? `${topic} — ${message}`
                        : message
                      : item.body;
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openItem(item)}
                  className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-3 text-left transition last:border-0 hover:bg-zinc-50 ${
                    item.readAt ? "opacity-70" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                      item.type === "website_lead"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {item.type === "website_lead" ? (
                      <Inbox size={15} />
                    ) : (
                      <Bell size={15} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <strong className="truncate text-xs text-zinc-950">
                        {item.title}
                      </strong>
                      <span className="shrink-0 text-[10px] text-zinc-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-zinc-500">
                      {preview}
                    </span>
                  </span>
                  {!item.readAt ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" />
                  ) : null}
                </button>
              );
              })
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2.5 text-center">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onViewAll?.();
              }}
              className="text-xs font-semibold text-blue-700 transition hover:text-blue-800"
            >
              View All Notifications
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
