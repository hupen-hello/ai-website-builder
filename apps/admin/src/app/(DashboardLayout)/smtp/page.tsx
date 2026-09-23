'use client';

import { useCallback, useEffect, useState } from 'react';
import CardBox from '@/app/components/shared/CardBox';
import { Icon } from '@iconify/react';

type SmtpSettings = {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  hasPassword: boolean;
  passwordSet: boolean;
  createdAt: string;
  updatedAt: string;
};

type SmtpResponse = {
  configured?: boolean;
  settings?: SmtpSettings | null;
  message?: string;
};

type FormState = {
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  host: '',
  port: '587',
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
  enabled: true,
};

export default function SmtpSettingsPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [configured, setConfigured] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/smtp', { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as SmtpResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load SMTP settings');
      }

      const settings = data.settings;
      setConfigured(Boolean(data.configured && settings));
      if (settings) {
        setForm({
          host: settings.host || '',
          port: String(settings.port || 587),
          secure: Boolean(settings.secure),
          username: settings.username || '',
          password: '',
          fromEmail: settings.fromEmail || '',
          fromName: settings.fromName || '',
          enabled: settings.enabled !== false,
        });
        setHasPassword(Boolean(settings.hasPassword || settings.passwordSet));
        setUpdatedAt(settings.updatedAt || null);
      } else {
        setForm(emptyForm);
        setHasPassword(false);
        setUpdatedAt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load SMTP settings');
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

  const handleCheckSmtp = async () => {
    setChecking(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: form.host.trim(),
          port: Number(form.port),
          secure: form.secure,
          username: form.username.trim(),
          password: form.password,
          fromEmail: form.fromEmail.trim(),
          fromName: form.fromName.trim() || null,
          enabled: form.enabled,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        ok?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.message || 'SMTP check failed');
      }
      setSuccess(data.message || 'SMTP is working.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SMTP check failed');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: form.host.trim(),
          port: Number(form.port),
          secure: form.secure,
          username: form.username.trim(),
          password: form.password,
          fromEmail: form.fromEmail.trim(),
          fromName: form.fromName.trim() || null,
          enabled: form.enabled,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as SmtpResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save SMTP settings');
      }
      setSuccess(data.message || 'SMTP settings saved.');
      setConfigured(true);
      if (data.settings) {
        setHasPassword(Boolean(data.settings.hasPassword || data.settings.passwordSet));
        setUpdatedAt(data.settings.updatedAt || null);
        setForm((current) => ({ ...current, password: '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save SMTP settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
            Mail settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            SMTP configuration
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add or update the mail server used for system emails.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      <CardBox className="border border-gray-100 bg-white p-0 shadow-sm dark:border-white/10 dark:bg-[#151515]">
        {loading ? (
          <div className="space-y-4 p-6 sm:p-8">
            {Array.from({ length: 4 }).map((_, index) => (
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

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  SMTP host
                </span>
                <input
                  required
                  value={form.host}
                  onChange={(event) => updateField('host', event.target.value)}
                  placeholder="smtp.gmail.com"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Port
                </span>
                <input
                  required
                  type="number"
                  min={1}
                  max={65535}
                  value={form.port}
                  onChange={(event) => {
                    const nextPort = event.target.value;
                    setForm((current) => ({
                      ...current,
                      port: nextPort,
                      secure:
                        nextPort === '465'
                          ? true
                          : nextPort === '587'
                            ? false
                            : current.secure,
                    }));
                    setSuccess('');
                    setError('');
                  }}
                  placeholder="587"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
              </label>

              <label className="flex min-h-11 items-start gap-3 self-end rounded-xl border border-gray-200 px-3 py-2.5 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={form.secure || form.port === '465'}
                  onChange={(event) => {
                    const nextPort = event.target.checked ? '465' : '587';
                    setForm((current) => ({
                      ...current,
                      secure: event.target.checked,
                      port: nextPort,
                    }));
                    setSuccess('');
                    setError('');
                  }}
                  className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Use SSL (port 465)
                  <span className="mt-0.5 block text-[11px] font-normal text-gray-400">
                    Port 587 uses encrypted STARTTLS automatically (recommended for Gmail).
                  </span>
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Username
                </span>
                <input
                  required
                  value={form.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder="mail@example.com"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Password
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder={
                    hasPassword
                      ? 'Leave blank to keep current password'
                      : 'SMTP password / app password'
                  }
                  required={!configured}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
                {hasPassword ? (
                  <span className="mt-1.5 block text-[11px] text-gray-400">
                    Password is already saved. Enter a new one only to change it.
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  From email
                </span>
                <input
                  required
                  type="email"
                  value={form.fromEmail}
                  onChange={(event) => updateField('fromEmail', event.target.value)}
                  placeholder="noreply@cssfounder.com"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-[#111] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                  From name
                </span>
                <input
                  value={form.fromName}
                  onChange={(event) => updateField('fromName', event.target.value)}
                  placeholder="CSS Founder"
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
                  Enable SMTP sending
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
                  : 'No SMTP settings saved yet'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadSettings()}
                  disabled={saving || checking || loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <Icon icon="solar:refresh-linear" width={16} />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void handleCheckSmtp()}
                  disabled={saving || checking || loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                >
                  <Icon
                    icon={
                      checking
                        ? 'svg-spinners:ring-resize'
                        : 'solar:check-circle-bold'
                    }
                    width={16}
                  />
                  {checking ? 'Checking…' : 'Check SMTP'}
                </button>
                <button
                  type="submit"
                  disabled={saving || checking || loading}
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
                      ? 'Update SMTP'
                      : 'Add SMTP'}
                </button>
              </div>
            </div>
          </form>
        )}
      </CardBox>
    </div>
  );
}
