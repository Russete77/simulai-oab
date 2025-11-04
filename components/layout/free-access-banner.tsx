'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function FreeAccessBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Buscar mensagem do modo gratuito via API
    fetch('/api/config/free-access-mode')
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setMessage(data.message);
        }
      })
      .catch(() => {});
  }, []);

  if (!message || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">🎉</span>
        <p className="font-medium">{message}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
