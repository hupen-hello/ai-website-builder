'use client';

import { useCallback, useEffect, useState } from 'react';
import CardBox from '@/app/components/shared/CardBox';
import { Icon } from '@iconify/react';

type AdminMailSettings = {
  id: string;
  email: string;
  name: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminMailResponse = {
  configured?: boolean;
  settings?: AdminMailSettings | null;
  message?: string;
};

type FormState = {
  email: string;
  name: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  email: '',
  name: '',
  enabled: true,
};

export default function AdminMailPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-mail', { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as AdminMailResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load admin mail');
      }

      const settings = data.settings;
      setConfigured(Boolean(data.configured && settings));
      if (settings) {
        setForm({
          email: settings.email || '',
          name: settings.name || '',
          enabled: settings.enabled !== false,
        });
        setUpdatedAt(settings.updatedAt || null);
      } else {
        setForm(emptyForm);
        setUpdatedAt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin mail');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin-mail', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim() || null,
          enabled: form.enabled,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as AdminMailResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save admin mail');
      }
      setSuccess(data.message || 'Admin mail saved.');
      setConfigured(true);
      if (data.settings) {
        setUpdatedAt(data.settings.updatedAt || null);
        setForm({
          email: data.settings.email || '',
          name: data.settings.name || '',
          enabled: data.settings.enabled !== false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save admin mail');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
            Notifications
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Admin mail
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Billing support and similar alerts will be sent to this inbox.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            configured
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              configured ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {configured ? 'Configured' : 'Not configured'}
        </span>
      </div>

      <CardBox className="border border-gray-100 bg-white p-0 shadow-sm dark:border-white/10 dark:bg-[#151515]">
        {loading ? (
          <div className="space-y-4 p-6 sm:p-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {error ? (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                {success}
              </div>
            ) : null}

            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              When a user submits Billing Support, an email is sent to this address
              (SMTP must also be configured and enabled).
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Admin email
                </span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="admin@cssfounder.com"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Display name
                </span>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="CSS Founder Admin"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
              </label>

              <label className="flex h-11 items-center gap-3 self-end rounded-xl border border-gray-200 px-3 sm:col-span-2 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => updateField('enabled', event.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Enable admin mail notifications
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-400">
                {updatedAt
                  ? `Last updated ${new Intl.DateTimeFormat('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Kolkata',
                    }).format(new Date(updatedAt))}`
                  : 'No admin mail saved yet'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void loadSettings()}
                  disabled={saving || loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <Icon icon="solar:refresh-linear" width={16} />
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  <Icon
                    icon={
                      saving
                        ? 'svg-spinners:ring-resize'
                        : configured
                          ? 'solar:diskette-bold'
                          : 'solar:add-circle-bold'
                    }
                    width={16}
                  />
                  {saving
                    ? 'Saving…'
                    : configured
                      ? 'Update admin mail'
                      : 'Add admin mail'}
                </button>
              </div>
            </div>
          </form>
        )}
      </CardBox>
    </div>
  );
}
