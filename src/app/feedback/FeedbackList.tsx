'use client';

import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  text: string;
  author: string | null;
  reviewed: boolean;
  createdAt: Date;
}

export function FeedbackList({ initialItems }: { initialItems: FeedbackItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  const toggleReviewed = async (id: string, reviewed: boolean) => {
    await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed }),
    });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, reviewed } : i)));
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este feedback?')) return;
    await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = items.filter((i) =>
    filter === 'all' ? true : filter === 'pending' ? !i.reviewed : i.reviewed
  );

  const pendingCount = items.filter((i) => !i.reviewed).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100 px-6 py-2">
        {(['pending', 'all', 'reviewed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {f === 'pending' ? `Pendiente (${pendingCount})` : f === 'all' ? 'Todo' : 'Revisado'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400">No hay feedback en esta categoría.</p>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border bg-white p-4 shadow-sm transition-opacity',
                  item.reviewed ? 'opacity-50' : 'border-gray-200'
                )}
              >
                <p className={cn('text-sm whitespace-pre-wrap', item.reviewed ? 'line-through text-gray-400' : 'text-gray-700')}>
                  {item.text}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {item.author && <span>{item.author.split('@')[0]}</span>}
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleString('es-ES', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'Europe/Madrid',
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleReviewed(item.id, !item.reviewed)}
                      className={cn(
                        'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                        item.reviewed
                          ? 'text-gray-400 hover:text-gray-600'
                          : 'text-green-600 hover:bg-green-50'
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {item.reviewed ? 'Marcar pendiente' : 'Marcar revisado'}
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
