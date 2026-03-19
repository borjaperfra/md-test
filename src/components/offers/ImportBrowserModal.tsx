'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';

interface ImportBrowserModalProps {
  onClose: () => void;
  onImported: () => void;
}

export function ImportBrowserModal({ onClose, onImported }: ImportBrowserModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleImport = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/offers/import-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, pageUrl: 'linkedin.com' }),
      });
      const data = await res.json();
      if (data.imported > 0) {
        onImported();
        setResult(`✓ ${data.imported} oferta${data.imported === 1 ? '' : 's'} importada${data.imported === 1 ? '' : 's'}`);
        setText('');
      } else {
        setResult('No se encontraron ofertas en el texto pegado.');
      }
    } catch {
      setResult('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-1 text-lg font-semibold text-gray-900">Importar desde LinkedIn</h2>
        <p className="mb-4 text-sm text-gray-500">
          Ve a LinkedIn, selecciona el texto de la página con <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Ctrl+A</kbd> → <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Ctrl+C</kbd>, y pégalo aquí.
        </p>

        <textarea
          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-300 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          rows={8}
          placeholder="Pega aquí el texto copiado de LinkedIn…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />

        {result && (
          <p className={`mt-2 text-sm font-medium ${result.startsWith('✓') ? 'text-green-600' : 'text-gray-500'}`}>
            {result}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleImport}
            disabled={loading || !text.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            {loading ? 'Importando…' : 'Importar ofertas'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
