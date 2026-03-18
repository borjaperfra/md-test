'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Copy } from 'lucide-react';

interface MessageEditorProps {
  message: string;
  onChange: (value: string) => void;
  onCopy: () => void;
}

export function MessageEditor({ message, onChange, onCopy }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Mensaje generado</label>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" />
          Copiar
        </Button>
      </div>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-gray-300 p-3 font-mono text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[200px]"
        placeholder="El mensaje aparecerá aquí..."
      />
    </div>
  );
}
