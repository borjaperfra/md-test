'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Send, Clock, ChevronDown, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Mode = 'schedule' | 'now';

interface TelegramButtonProps {
  message: string;
  date?: string; // YYYY-MM-DD
  offerIds?: string[];
}

function PreviewModal({
  message,
  mode,
  scheduledAt,
  onConfirm,
  onClose,
  loading,
}: {
  message: string;
  mode: Mode;
  scheduledAt: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-800">Vista previa del mensaje</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-xs text-gray-700 font-mono leading-relaxed">
            {message}
          </pre>
          {mode === 'schedule' && scheduledAt && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600">
              <Calendar className="h-3.5 w-3.5" />
              Programado para {new Date(madridToUTC(scheduledAt)).toLocaleString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long',
                hour: '2-digit', minute: '2-digit',
                timeZone: 'Europe/Madrid',
              })}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={onConfirm} loading={loading}>
            {mode === 'schedule' ? (
              <><Clock className="h-3.5 w-3.5" /> Programar</>
            ) : (
              <><Send className="h-3.5 w-3.5" /> Enviar ahora</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

// Converts a datetime-local string (e.g. "2026-03-19T10:20") to UTC ISO,
// treating the input as Europe/Madrid time regardless of the browser's timezone.
function madridToUTC(datetimeLocal: string): string {
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  // Start with the nominal time as UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  // Find what local time Madrid would show for that UTC instant
  const madridStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(utcDate);
  const [, madridTime] = madridStr.split(', ');
  const [mHours, mMinutes] = madridTime.split(':').map(Number);
  // Shift UTC by the difference to make Madrid local == desired time
  const offsetMs = ((hours * 60 + minutes) - (mHours * 60 + mMinutes)) * 60_000;
  return new Date(utcDate.getTime() + offsetMs).toISOString();
}

function buildScheduledAt(dateStr?: string): string {
  const d = dateStr ? new Date(`${dateStr}T06:00:00`) : (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    return tomorrow;
  })();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T06:00`;
}

export function TelegramButton({ message, date, offerIds }: TelegramButtonProps) {
  const [mode, setMode] = useState<Mode>('schedule');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() => buildScheduledAt(date));

  useEffect(() => {
    setScheduledAt(buildScheduledAt(date));
  }, [date]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const body = mode === 'schedule'
        ? { message, offerIds, scheduledAt: madridToUTC(scheduledAt) }
        : { message, offerIds };

      const res = await fetch('/api/telegram/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');

      setShowPreview(false);
      setToast(mode === 'schedule' ? '✓ Mensaje programado con éxito' : '✓ Mensaje enviado');
    } catch (err) {
      setToast(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Date/time picker — only in schedule mode */}
        {mode === 'schedule' && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        )}

        {/* Split button */}
        <div className="relative flex items-stretch" ref={dropdownRef}>
          <Button
            size="lg"
            onClick={() => setShowPreview(true)}
            className="rounded-r-none flex-1"
          >
            {mode === 'schedule' ? (
              <><Clock className="h-4 w-4" /> Programar mensaje</>
            ) : (
              <><Send className="h-4 w-4" /> Enviar ahora</>
            )}
          </Button>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center border-l border-indigo-700 bg-indigo-600 px-2 text-white',
              'rounded-r-lg hover:bg-indigo-700 transition-colors'
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => { setMode('schedule'); setDropdownOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 rounded-t-lg',
                  mode === 'schedule' && 'font-semibold text-indigo-600'
                )}
              >
                <Clock className="h-3.5 w-3.5" /> Programar mensaje
              </button>
              <button
                onClick={() => { setMode('now'); setDropdownOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 rounded-b-lg',
                  mode === 'now' && 'font-semibold text-indigo-600'
                )}
              >
                <Send className="h-3.5 w-3.5" /> Enviar ahora
              </button>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          message={message}
          mode={mode}
          scheduledAt={scheduledAt}
          onConfirm={handleConfirm}
          onClose={() => setShowPreview(false)}
          loading={loading}
        />
      )}

      {toast && <Toast message={toast} duration={5000} onDismiss={() => setToast(null)} />}
    </>
  );
}
