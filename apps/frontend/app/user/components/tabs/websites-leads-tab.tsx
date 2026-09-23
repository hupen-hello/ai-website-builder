"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Eye,
  Globe2,
  Inbox,
  Loader2,
  Mail,
  Search,
  X,
} from "lucide-react";

export type WebsiteLead = {
  id: string;
  siteId: string;
  siteTitle: string;
  siteSlug: string;
  formName: string;
  formSection: string;
  formPage: string | null;
  fields: Record<string, string>;
  createdAt: string;
};

function formatLeadDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function leadSummary(fields: Record<string, string>) {
  const preferred = [
    "name",
    "your_name",
    "email",
    "your_email",
    "phone",
    "message",
  ];
  for (const key of preferred) {
    const match = Object.entries(fields).find(([fieldKey]) =>
      fieldKey.toLowerCase().includes(key),
    );
    if (match?.[1]) return match[1];
  }
  return Object.values(fields)[0] || "New lead";
}

function leadContactHint(fields: Record<string, string>) {
  const email = Object.entries(fields).find(([key]) =>
    key.toLowerCase().includes("email"),
  )?.[1];
  const phone = Object.entries(fields).find(([key]) =>
    key.toLowerCase().includes("phone"),
  )?.[1];
  return email || phone || null;
}

function isMarketingFormLabel(value: string) {
  const name = value.trim();
  if (!name) return true;
  if (name.length > 40) return true;
  return /conversation|our team|get in touch|contact us|reach out|let'?s talk|clear conversation/i.test(
    name,
  );
}

/** Clean form label for UI — skips section marketing headlines. */
function displayFormLabel(formName: string, formSection: string) {
  const name = formName?.trim() || "";
  if (!isMarketingFormLabel(name)) return name;

  const section = formSection?.trim() || "";
  if (/^contact/i.test(section)) return "Contact form";
  if (/^form/i.test(section)) return "Form";
  if (section) return section;
  return "Contact form";
}

export default function WebsitesLeadsTab() {
  const [leads, setLeads] = useState<WebsiteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<WebsiteLead | null>(null);

  useEffect(() => {
    let active = true;

    const loadLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/user/leads/mine", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.message || "Unable to load leads");
        }
        if (active) {
          setLeads(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setLeads([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load leads",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLeads();
    return () => {
      active = false;
    };
  }, []);

  const websiteOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const lead of leads) {
      map.set(lead.siteSlug, lead.siteTitle);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesWebsite =
        websiteFilter === "all" || lead.siteSlug === websiteFilter;
      if (!matchesWebsite) return false;
      if (!query) return true;

      const haystack = [
        lead.siteTitle,
        lead.siteSlug,
        lead.formName,
        lead.formSection,
        lead.formPage ?? "",
        ...Object.entries(lead.fields).flatMap(([key, value]) => [
          key,
          value,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [leads, searchQuery, websiteFilter]);

  const isFiltering =
    Boolean(searchQuery.trim()) || websiteFilter !== "all";

  return (
    <section className="relative min-h-full overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <div className="pointer-events-none absolute -left-16 top-8 size-64 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1320px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-violet-700 shadow-sm">
              <Inbox size={12} /> Form leads
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Websites Lead
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-5 text-zinc-500 sm:text-sm">
              All submissions from your published website forms — see which
              site, form, and page each lead came from.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Total leads
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-950">
              {loading ? "—" : leads.length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              {isFiltering ? "Matching" : "Showing"}
            </p>
            <p className="mt-1 text-lg font-bold text-blue-700">
              {loading ? "—" : filteredLeads.length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Websites
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-950">
              {loading ? "—" : websiteOptions.length}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(24,39,75,.07)]">
          <div className="border-b border-zinc-100 bg-gradient-to-r from-violet-50/60 via-white to-blue-50/40 px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">
              Filter leads
            </p>
          </div>
          <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:p-4">
            <label className="relative flex h-11 min-w-0 flex-1 items-center">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 text-zinc-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, form, website..."
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
              />
            </label>
            <div className="relative sm:w-56">
              <Globe2
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <select
                value={websiteFilter}
                onChange={(event) => setWebsiteFilter(event.target.value)}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-9 text-sm font-medium text-zinc-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
              >
                <option value="all">All websites</option>
                {websiteOptions.map(([slug, title]) => (
                  <option key={slug} value={slug}>
                    {title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 sm:text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">All leads</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {loading
                  ? "Loading submissions..."
                  : isFiltering
                    ? `${filteredLeads.length} match your filters`
                    : `${leads.length} submission${leads.length === 1 ? "" : "s"} across your sites`}
              </p>
            </div>
            {!loading && filteredLeads.length > 0 ? (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
                {filteredLeads.length} shown
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-2.5 px-4 py-14">
              <Loader2 size={28} className="animate-spin text-violet-600" />
              <p className="text-sm text-zinc-500">Loading leads...</p>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <thead className="border-b border-zinc-100 bg-white text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Website</th>
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredLeads.map((lead) => {
                    const contact = leadContactHint(lead.fields);

                    return (
                      <tr
                        key={lead.id}
                        className="text-sm text-zinc-600 transition hover:bg-violet-50/30"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                              <Globe2 size={16} />
                            </span>
                            <div className="min-w-0">
                              <strong className="block text-sm font-semibold text-zinc-900">
                                {lead.siteTitle}
                              </strong>
                              <a
                                href={`/published/${encodeURIComponent(lead.siteSlug)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-0.5 inline-block truncate text-xs text-blue-700 hover:underline"
                              >
                                /published/{lead.siteSlug}
                              </a>
                              {lead.formPage ? (
                                <p className="mt-0.5 text-xs text-zinc-400">
                                  Page: {lead.formPage}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <strong className="block text-sm font-semibold text-zinc-900">
                            {displayFormLabel(lead.formName, lead.formSection)}
                          </strong>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {lead.formSection}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-zinc-800">
                            {leadSummary(lead.fields)}
                          </p>
                          {contact ? (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                              <Mail size={12} className="shrink-0" />
                              <span className="truncate">{contact}</span>
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-zinc-500">
                          {formatLeadDate(lead.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            aria-label={`View lead from ${lead.siteTitle}`}
                            className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid place-items-center px-6 py-12 text-center">
              <Inbox size={28} className="text-zinc-300" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-zinc-700">
                {isFiltering ? "No matching leads" : "No leads yet"}
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                {isFiltering
                  ? "Try another website or search term."
                  : "Leads from your published website forms will appear here."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-600 text-white">
            <Mail size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Form submissions inbox
            </p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              Each row is one form submission. Open a lead to see every field
              the visitor submitted.
            </p>
          </div>
        </div>
      </div>

      {selectedLead ? (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close lead details"
            onClick={() => setSelectedLead(null)}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-details-title"
            className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,.3)]"
          >
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-violet-700">
                    <Inbox size={10} /> Lead details
                  </span>
                  <h3
                    id="lead-details-title"
                    className="mt-2 text-lg font-bold tracking-tight text-zinc-950"
                  >
                    {leadSummary(selectedLead.fields)}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedLead.siteTitle} ·{" "}
                    {displayFormLabel(
                      selectedLead.formName,
                      selectedLead.formSection,
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5">
                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Website
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {selectedLead.siteTitle}
                    </p>
                    <a
                      href={`/published/${encodeURIComponent(selectedLead.siteSlug)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-block text-xs text-blue-700 hover:underline"
                    >
                      /published/{selectedLead.siteSlug}
                    </a>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Form
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {displayFormLabel(
                        selectedLead.formName,
                        selectedLead.formSection,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {selectedLead.formSection}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Received
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {formatLeadDate(selectedLead.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <dl className="mt-4 space-y-2.5">
                {Object.entries(selectedLead.fields).map(([key, value]) => (
                  <div
                    key={`${selectedLead.id}-${key}`}
                    className="rounded-xl border border-zinc-100 bg-white px-3.5 py-3"
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      {formatFieldLabel(key)}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-zinc-800">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-t border-zinc-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="h-10 w-full rounded-xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
