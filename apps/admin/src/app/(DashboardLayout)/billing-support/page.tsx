'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CardBox from '@/app/components/shared/CardBox';
import { Icon } from '@iconify/react';

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
  updatedAt: string;
  replies?: Array<{
    id: string;
    authorRole: string;
    body: string;
    createdAt: string;
    attachments?: Array<{
      name: string;
      url: string;
      size?: number;
      mimeType?: string;
    }> | null;
  }>;
  user?: {
    id: string;
    name: string | null;
    email: string;
    status?: string;
    phone?: string | null;
    address?: string | null;
  };
};

type TicketStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

type TicketsResponse = {
  tickets: SupportTicket[];
  stats: TicketStats;
  message?: string;
};

const emptyStats: TicketStats = {
  total: 0,
  open: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const;

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

const statusTone = (status: string) => {
  if (status === 'open') return 'bg-amber-50 text-amber-700';
  if (status === 'in_progress') return 'bg-blue-50 text-blue-700';
  if (status === 'resolved') return 'bg-emerald-50 text-emerald-700';
  return 'bg-zinc-100 text-zinc-600';
};

const statusLabel = (status: string) =>
  STATUS_OPTIONS.find((item) => item.value === status)?.label || status;

export default function BillingSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replySending, setReplySending] = useState(false);

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('category', 'billing');
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/support-tickets${query}`, {
        cache: 'no-store',
      });
      const data = (await response.json().catch(() => ({}))) as TicketsResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load support tickets');
      }
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setStats(data.stats || emptyStats);
    } catch (err) {
      setTickets([]);
      setStats(emptyStats);
      setError(err instanceof Error ? err.message : 'Unable to load tickets');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTickets();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadTickets]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadTickets(true);
      if (!selected?.id) return;
      void fetch(`/api/support-tickets?id=${encodeURIComponent(selected.id)}`, {
        cache: 'no-store',
      })
        .then(async (response) => {
          const data = (await response.json().catch(() => ({}))) as SupportTicket;
          if (response.ok) setSelected(data);
        })
        .catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [loadTickets, selected?.id]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    setError('');
    try {
      const response = await fetch('/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = (await response.json().catch(() => ({}))) as SupportTicket & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status');
      }
      setTickets((current) =>
        current.map((ticket) => (ticket.id === id ? { ...ticket, ...data } : ticket)),
      );
      setSelected((current) =>
        current?.id === id ? { ...current, ...data } : current,
      );
      void loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket);
    setReplyText('');
    setReplyFiles([]);
    setError('');
    try {
      const response = await fetch(
        `/api/support-tickets?id=${encodeURIComponent(ticket.id)}`,
        { cache: 'no-store' },
      );
      const data = (await response.json().catch(() => ({}))) as SupportTicket & {
        message?: string;
      };
      if (response.ok) {
        setSelected(data);
      }
    } catch {
      // keep list row data
    }
  };

  const sendReply = async () => {
    if (!selected || (!replyText.trim() && !replyFiles.length)) return;
    setReplySending(true);
    setError('');
    try {
      let attachments: Array<{
        name: string;
        url: string;
        size?: number;
        mimeType?: string;
      }> = [];
      if (replyFiles.length) {
        const form = new FormData();
        form.set('ticketId', selected.id);
        replyFiles.forEach((file) => form.append('files', file));
        const uploadRes = await fetch('/api/support-tickets/upload', {
          method: 'POST',
          body: form,
        });
        const uploadData = (await uploadRes.json().catch(() => ({}))) as {
          attachments?: typeof attachments;
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
          id: selected.id,
          reply: true,
          message: replyText.trim(),
          status:
            selected.status === 'open' ? 'in_progress' : selected.status,
          attachments,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as SupportTicket & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message || 'Unable to send reply');
      }
      setSelected(data);
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === data.id ? { ...ticket, ...data } : ticket,
        ),
      );
      setReplyText('');
      setReplyFiles([]);
      void loadTickets(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reply');
    } finally {
      setReplySending(false);
    }
  };

  const statCards = useMemo(
    () => [
      { label: 'Total', value: stats.total, icon: 'solar:inbox-line-linear' },
      { label: 'Open', value: stats.open, icon: 'solar:alarm-linear' },
      {
        label: 'In progress',
        value: stats.inProgress,
        icon: 'solar:refresh-circle-linear',
      },
      {
        label: 'Resolved',
        value: stats.resolved,
        icon: 'solar:check-circle-linear',
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Billing Support</h1>
        <p className="mt-1 text-sm text-darklink">
          Messages submitted from the user Billing support form.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <CardBox key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-darklink">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-dark">{card.value}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-xl bg-lightprimary text-primary">
                <Icon icon={card.icon} height={22} />
              </span>
            </div>
          </CardBox>
        ))}
      </div>

      <CardBox className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Icon
              icon="solar:magnifer-linear"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-darklink"
              height={16}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search topic, message, name, or email"
              className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-darklink">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Topic</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-darklink">
                    Loading support tickets…
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-darklink">
                    No billing support messages yet.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-dark">
                        {ticket.userName || ticket.user?.name || '—'}
                      </p>
                      <p className="text-xs text-darklink">
                        {ticket.userEmail || ticket.user?.email || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark">{ticket.topic}</td>
                    <td className="max-w-xs px-4 py-3 text-sm text-darklink">
                      <span className="line-clamp-2">{ticket.message}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(ticket.status)}`}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-darklink">
                      {formatDateTime(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void openTicket(ticket)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-dark transition hover:border-primary hover:text-primary"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBox>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <button
            type="button"
            aria-label="Close ticket details"
            className="absolute inset-0"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-darklink">
                  Billing support
                </p>
                <h2 className="mt-1 text-lg font-semibold text-dark">{selected.topic}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid size-8 place-items-center rounded-full text-darklink hover:bg-muted"
                aria-label="Close"
              >
                <Icon icon="solar:close-circle-linear" height={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-muted/40 p-4 text-sm">
              <p>
                <span className="text-darklink">From:</span>{' '}
                <strong className="text-dark">
                  {selected.userName || selected.user?.name || '—'}
                </strong>
              </p>
              <p>
                <span className="text-darklink">Email:</span>{' '}
                <a
                  href={`mailto:${selected.userEmail || selected.user?.email || ''}`}
                  className="font-medium text-primary"
                >
                  {selected.userEmail || selected.user?.email || '—'}
                </a>
              </p>
              {selected.user?.phone?.trim() ? (
                <p>
                  <span className="text-darklink">Phone:</span>{' '}
                  <a
                    href={`tel:${selected.user.phone.trim()}`}
                    className="font-medium text-primary"
                  >
                    {selected.user.phone.trim()}
                  </a>
                </p>
              ) : null}
              {selected.user?.address?.trim() ? (
                <p>
                  <span className="text-darklink">Address:</span>{' '}
                  <strong className="font-medium text-dark whitespace-pre-wrap">
                    {selected.user.address.trim()}
                  </strong>
                </p>
              ) : null}
              <p>
                <span className="text-darklink">Received:</span>{' '}
                {formatDateTime(selected.createdAt)}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-darklink">
                Original message
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-white p-4 text-sm leading-6 text-dark">
                {selected.message}
              </p>
            </div>

            {(selected.replies || []).length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-darklink">
                  Thread
                </p>
                {selected.replies?.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-xl px-3.5 py-3 text-sm ${
                      reply.authorRole === 'admin'
                        ? 'bg-primary/10 text-dark'
                        : 'bg-muted/50 text-dark'
                    }`}
                  >
                    <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-darklink">
                      <span>{reply.authorRole === 'admin' ? 'Admin' : 'User'}</span>
                      <span>{formatDateTime(reply.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-6">{reply.body}</p>
                    {Array.isArray(reply.attachments) && reply.attachments.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {reply.attachments.map((file) => (
                          <a
                            key={`${file.url}-${file.name}`}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-medium text-primary"
                          >
                            <Icon icon="solar:paperclip-linear" height={12} />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-darklink">
                Reply
              </p>
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={4}
                placeholder="Write a reply to the user…"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              {replyFiles.length ? (
                <div className="flex flex-wrap gap-2">
                  {replyFiles.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"
                    >
                      {file.name}
                      <button
                        type="button"
                        onClick={() =>
                          setReplyFiles((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        className="text-darklink hover:text-dark"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-dark hover:bg-muted">
                  <Icon icon="solar:paperclip-linear" height={16} />
                  Attach
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,image/*,application/pdf"
                    onChange={(event) => {
                      const next = Array.from(event.target.files || []).slice(0, 5);
                      setReplyFiles((current) =>
                        [...current, ...next].slice(0, 5),
                      );
                      event.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={
                    replySending || (!replyText.trim() && !replyFiles.length)
                  }
                  onClick={() => void sendReply()}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {replySending ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-xs font-semibold text-darklink">Status</label>
              <select
                value={selected.status}
                disabled={updatingId === selected.id}
                onChange={(event) =>
                  void updateStatus(selected.id, event.target.value)
                }
                className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
