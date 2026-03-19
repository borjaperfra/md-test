'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Trash2, Pencil, Check, X, Clock, Send, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledMessage {
  id: string;
  message: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  status: string;
  telegramId: string | null;
  createdAt: Date;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  sent: 'Enviado',
  failed: 'Error',
  cancelled: 'Cancelado',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// Returns a datetime-local string (e.g. "2026-03-19T10:30") in Europe/Madrid time for a UTC date.
function utcToMadridLocal(date: Date | string): string {
  return new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date)).replace(' ', 'T');
}

// Converts a datetime-local string treated as Europe/Madrid time to a UTC ISO string.
function madridToUTC(datetimeLocal: string): string {
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const madridStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(utcDate);
  const [, madridTime] = madridStr.split(', ');
  const [mHours, mMinutes] = madridTime.split(':').map(Number);
  const offsetMs = ((hours * 60 + minutes) - (mHours * 60 + mMinutes)) * 60_000;
  return new Date(utcDate.getTime() + offsetMs).toISOString();
}

export function ScheduledClient({ messages: initial }: { messages: ScheduledMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const startEdit = (msg: ScheduledMessage) => {
    setEditing(msg.id);
    setEditText(msg.message);
    setEditDate(msg.scheduledAt ? utcToMadridLocal(msg.scheduledAt) : '');
  };

  const saveEdit = async (id: string) => {
    const body: Record<string, string> = { message: editText };
    if (editDate) body.scheduledAt = madridToUTC(editDate);

    const res = await fetch(`/api/telegram/schedule/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { setToast('Error al guardar'); return; }
    const updated = await res.json();
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    setEditing(null);
    setToast('Guardado');
  };

  const cancel = async (id: string) => {
    const res = await fetch(`/api/telegram/schedule/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (!res.ok) { setToast('Error'); return; }
    const updated = await res.json();
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    router.refresh();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/telegram/schedule/${id}`, { method: 'DELETE' });
    if (!res.ok) { setToast('Error al eliminar'); return; }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setToast('Eliminado');
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        No hay mensajes programados
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex flex-col gap-4 max-w-3xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            {/* Header row */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <StatusBadge status={msg.status} />
                {msg.scheduledAt && msg.status === 'pending' && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.scheduledAt).toLocaleString('es-ES', {
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'Europe/Madrid',
                    })}
                  </span>
                )}
                {msg.sentAt && (
                  <span className="flex items-center gap-1">
                    <Send className="h-3 w-3" />
                    Enviado {new Date(msg.sentAt).toLocaleString('es-ES', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      timeZone: 'Europe/Madrid',
                    })}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {msg.status === 'pending' && editing !== msg.id && (
                  <>
                    <button
                      onClick={() => startEdit(msg)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => cancel(msg.id)}
                      className="rounded p-1 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600"
                      title="Cancelar programación"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => remove(msg.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {editing === msg.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 font-mono text-xs text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-y"
                />
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-48 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(msg.id)}>
                    <Check className="h-3.5 w-3.5" /> Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-600 leading-relaxed">
                {msg.message}
              </pre>
            )}
          </div>
        ))}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
