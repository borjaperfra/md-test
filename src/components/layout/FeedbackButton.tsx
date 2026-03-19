'use client';

import { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    setLoading(false);
    setSent(true);
    setText('');
    setTimeout(() => { setOpen(false); setSent(false); }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-800">Feedback</h3>
              <button onClick={() => { setOpen(false); setSent(false); setText(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              {sent ? (
                <p className="text-center text-sm text-green-600 py-4">✓ Feedback enviado, gracias.</p>
              ) : (
                <>
                  <p className="mb-3 text-xs text-gray-500">
                    Cuéntanos qué no funciona bien, qué mejorarías o qué feature te gustaría ver.
                  </p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder="Escribe aquí tu feedback…"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                    autoFocus
                  />
                </>
              )}
            </div>
            {!sent && (
              <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                <button
                  onClick={() => { setOpen(false); setText(''); }}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !text.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
