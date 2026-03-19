'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, MousePointerClick, TrendingUp, Eye, Trash2, Users, CalendarDays, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferStat {
  id: string;
  title: string;
  company: string;
  salary: string | null;
  shortUrl: string | null;
  type: string | null;
  clicks: number;
}

interface MessageStat {
  messageId: string;
  date: string | null;
  sentAt: string | null;
  offers: OfferStat[];
  totalClicks: number;
  avgClicks: number;
  views: number | null;
}

interface Summary {
  totalClicks: number;
  totalOffers: number;
  globalAvgClicks: number;
  globalAvgViews: number | null;
  messagesSent: number;
  bestDay: { sentAt: string | null; totalClicks: number } | null;
  subscribers: number | null;
}

interface AnalyticsData {
  sections: MessageStat[];
  summary: Summary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Europe/Madrid',
  });
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-ES');
}

function formatSalary(salary: string | null): string {
  if (!salary) return '—';
  const s = salary.trim();

  // Already formatted
  if (s.startsWith('€')) return s;

  // Hourly rate: "20/h"
  if (s.includes('/h')) return `€${s}`;

  // Strip trailing K/k for uniform processing
  const hasK = /K$/i.test(s);
  const base = hasK ? s.slice(0, -1) : s;

  // Range: "60-80" (shorthand) or "60000-80000" (raw)
  const rangeMatch = base.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    let lo = Number(rangeMatch[1]);
    let hi = Number(rangeMatch[2]);
    if (lo > 1000) lo = Math.round(lo / 1000);
    if (hi > 1000) hi = Math.round(hi / 1000);
    return `€${lo}-${hi}K`;
  }

  // Single number: "70" (shorthand) or "80000" (raw)
  if (/^\d+$/.test(base)) {
    let n = Number(base);
    if (n > 1000) n = Math.round(n / 1000);
    return `€${n}K`;
  }

  return `€${s}`;
}

function TypeBadge({ type }: { type: string | null }) {
  if (type === 'manfred') return <span title="Manfred">Ⓜ️</span>;
  if (type === 'client') return <span title="Client">👀</span>;
  return null;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  historicalLabel,
  historicalValue,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  historicalLabel: string;
  historicalValue: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-colors ${
        highlight ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <div className="mt-2 border-t border-gray-50 pt-2">
        <p className="text-xs text-gray-400">
          <span className="text-gray-500">{historicalLabel}:</span>{' '}
          <span className="font-medium text-gray-600">{historicalValue}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Click bar ────────────────────────────────────────────────────────────────

function ClickBar({ clicks, max }: { clicks: number; max: number }) {
  const pct = max > 0 ? Math.round((clicks / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-xs font-medium tabular-nums text-gray-700">
        {clicks}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [topPeriod, setTopPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [dayFilter, setDayFilter] = useState<string>('');

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Cargando datos…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        Error: {error}
      </div>
    );
  }
  if (!data) return null;

  const { summary, sections: allSections } = data;
  const sections = dayFilter
    ? allSections.filter((s) => s.sentAt && new Date(s.sentAt).toLocaleDateString('sv', { timeZone: 'Europe/Madrid' }) === dayFilter)
    : allSections;

  const now = Date.now();
  const topPeriodMs = topPeriod === 'week' ? 7 * 86400_000 : topPeriod === 'month' ? 30 * 86400_000 : Infinity;
  const filteredForTop = sections.filter((s) => s.sentAt && (now - new Date(s.sentAt).getTime()) <= topPeriodMs);
  const topOffers = (() => {
    const map = new Map<string, OfferStat>();
    for (const o of filteredForTop.flatMap((s) => s.offers)) {
      const prev = map.get(o.id);
      if (!prev || o.clicks > prev.clicks) map.set(o.id, o);
    }
    return Array.from(map.values()).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  })();

  const toggleSection = (messageId: string) =>
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.has(messageId) ? next.delete(messageId) : next.add(messageId);
      return next;
    });

  const deleteSection = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este mensaje del historial de analítica?')) return;
    setDeleting(messageId);
    try {
      await fetch(`/api/analytics/${messageId}`, { method: 'DELETE' });
      setData((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.filter((s) => s.messageId !== messageId);
        const allOfferStats = sections.flatMap((s) => s.offers);
        const totalClicks = allOfferStats.reduce((s, o) => s + o.clicks, 0);
        return {
          sections,
          summary: {
            ...prev.summary,
            totalClicks,
            totalOffers: allOfferStats.length,
            globalAvgClicks: allOfferStats.length > 0 ? Math.round((totalClicks / allOfferStats.length) * 10) / 10 : 0,
            messagesSent: sections.length,
          },
        };
      });
      setSelectedDates((prev) => { const next = new Set(prev); next.delete(messageId); return next; });
    } finally {
      setDeleting(null);
    }
  };

  const activeSections = selectedDates.size > 0
    ? sections.filter((s) => selectedDates.has(s.messageId))
    : null;

  // KPI values: selected sections combined, or global summary if nothing selected
  const cardClicks = activeSections
    ? activeSections.reduce((s, d) => s + d.totalClicks, 0)
    : summary.totalClicks;
  const cardAvg = activeSections
    ? (() => {
        const totalOffers = activeSections.reduce((s, d) => s + d.offers.length, 0);
        const totalClicks = activeSections.reduce((s, d) => s + d.totalClicks, 0);
        return totalOffers > 0 ? Math.round((totalClicks / totalOffers) * 10) / 10 : 0;
      })()
    : summary.globalAvgClicks;
  const cardViews = activeSections
    ? (() => {
        const withViews = activeSections.filter((d) => d.views !== null);
        if (withViews.length === 0) return null;
        return Math.round(withViews.reduce((s, d) => s + (d.views as number), 0) / withViews.length);
      })()
    : summary.globalAvgViews;

  const maxClicks = Math.max(...sections.flatMap((s) => s.offers.map((o) => o.clicks)), 1);
  const hasSelection = selectedDates.size > 0;

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 p-6 pb-4">
        <KpiCard
          icon={MousePointerClick}
          label="Clicks totales"
          value={fmtNum(cardClicks)}
          historicalLabel={hasSelection ? 'histórico total' : 'total acumulado'}
          historicalValue={hasSelection ? fmtNum(summary.totalClicks) : `${summary.totalOffers} ofertas`}
          highlight={hasSelection}
        />
        <KpiCard
          icon={TrendingUp}
          label="Media clicks / oferta"
          value={fmtNum(cardAvg)}
          historicalLabel="media histórica"
          historicalValue={`${fmtNum(summary.globalAvgClicks)} clicks/oferta`}
          highlight={hasSelection}
        />
        <KpiCard
          icon={Eye}
          label="Visualizaciones Telegram"
          value={cardViews !== null ? fmtNum(cardViews) : '—'}
          historicalLabel="media histórica"
          historicalValue={
            summary.globalAvgViews !== null
              ? `${fmtNum(summary.globalAvgViews)} views/msg`
              : 'sin datos (requiere admin)'
          }
          highlight={hasSelection}
        />
        <KpiCard
          icon={Users}
          label="Suscriptores canal"
          value={summary.subscribers !== null ? fmtNum(summary.subscribers) : '—'}
          historicalLabel="mejor día"
          historicalValue={
            summary.bestDay
              ? `${fmtNum(summary.bestDay.totalClicks)} clicks (${summary.bestDay.sentAt ? new Date(summary.bestDay.sentAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }) : '—'})`
              : '—'
          }
        />
      </div>

      {/* ── Top ofertas ───────────────────────────────────────────────────── */}
      {topOffers.length > 0 && (
        <div className="mx-6 mb-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Top ofertas por clicks</h3>
            <div className="flex gap-1">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTopPeriod(p)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    topPeriod === p ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {p === 'week' ? 'Esta semana' : p === 'month' ? 'Este mes' : 'Histórico'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {topOffers.length === 0 && (
              <p className="px-5 py-4 text-xs text-gray-400">Sin datos para este período.</p>
            )}
            {topOffers.map((offer, i) => (
              <div key={offer.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-4 text-xs font-bold text-gray-300">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-medium text-gray-700">
                    <TypeBadge type={offer.type} />
                    {offer.title}
                  </p>
                  <p className="text-xs text-gray-400">{offer.company} · {formatSalary(offer.salary)}</p>
                </div>
                <ClickBar clicks={offer.clicks} max={topOffers[0].clicks} />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSelection && (
        <div className="flex items-center gap-2 px-6 pb-3">
          <p className="text-xs text-indigo-500">
            {selectedDates.size === 1
              ? `Mostrando datos de 1 día seleccionado`
              : `Mostrando datos de ${selectedDates.size} días seleccionados`}
          </p>
          <button
            onClick={() => setSelectedDates(new Set())}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {/* ── Day filter ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 pb-3">
        <CalendarDays className="h-4 w-4 text-gray-400" />
        <input
          type="date"
          value={dayFilter}
          onChange={(e) => { setDayFilter(e.target.value); setSelectedDates(new Set()); }}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-indigo-400 focus:outline-none"
        />
        {dayFilter && (
          <button onClick={() => setDayFilter('')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" /> Mostrar todos
          </button>
        )}
      </div>

      {/* ── Day sections ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {sections.length === 0 ? (
          <p className="text-sm text-gray-400">No hay mensajes enviados aún.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {sections.map((section) => {
              const isSelected = selectedDates.has(section.messageId);
              return (
                <div
                  key={section.messageId}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
                    isSelected ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'
                  }`}
                >
                  {/* Message header */}
                  <div className={`flex w-full items-center justify-between px-5 py-3 transition-colors ${
                    isSelected ? 'bg-indigo-50' : 'bg-gray-50 hover:bg-gray-100/80'
                  }`}>
                  <button
                    className="flex flex-1 items-center justify-between text-left"
                    onClick={() => toggleSection(section.messageId)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded border-2 transition-colors ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 10 10" className="h-full w-full text-white" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {section.sentAt
                          ? new Date(section.sentAt).toLocaleString('es-ES', {
                              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                              timeZone: 'Europe/Madrid',
                            })
                          : 'Sin fecha'}
                      </span>
                    </div>
                    <div className="flex items-center gap-5 text-xs text-gray-400">
                      <span>
                        <span className="mr-1">Clicks totales:</span>
                        <span className={`font-semibold ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {fmtNum(section.totalClicks)}
                        </span>
                      </span>
                      <span>
                        <span className="mr-1">Media:</span>
                        <span className={`font-semibold ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {fmtNum(section.avgClicks)}
                        </span>
                      </span>
                      <span>
                        <span className="mr-1">Views Telegram:</span>
                        <span className={`font-semibold ${isSelected ? 'text-purple-600' : 'text-gray-600'}`}>
                          {section.views !== null ? fmtNum(section.views) : '—'}
                        </span>
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => deleteSection(section.messageId, e)}
                    disabled={deleting === section.messageId}
                    className="ml-3 shrink-0 text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors"
                    title="Eliminar mensaje"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  </div>

                  {/* Offers table */}
                  {section.offers.length === 0 ? (
                    <p className="px-5 py-3 text-xs text-gray-400">Sin ofertas asociadas a este mensaje.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-y border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                          <th className="px-5 py-2">Oferta</th>
                          <th className="px-5 py-2">Empresa</th>
                          <th className="px-5 py-2">Salario</th>
                          <th className="px-5 py-2">Clicks</th>
                          <th className="px-5 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {section.offers.map((offer) => (
                          <tr
                            key={offer.id}
                            className={isSelected ? 'bg-indigo-50/30' : 'hover:bg-gray-50/60'}
                          >
                            <td className="px-5 py-3 text-gray-700">
                              <span className="flex items-center gap-1">
                                <TypeBadge type={offer.type} />
                                {offer.title}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-gray-500">{offer.company}</td>
                            <td className="px-5 py-3 text-gray-500">{formatSalary(offer.salary)}</td>
                            <td className="px-5 py-3">
                              <ClickBar clicks={offer.clicks} max={maxClicks} />
                            </td>
                            <td className="px-5 py-3">
                              {offer.shortUrl && (
                                <a
                                  href={offer.shortUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-300 hover:text-indigo-500"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
