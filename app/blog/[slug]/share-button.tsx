'use client';

import { Share2 } from 'lucide-react';

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  return (
    <button
      onClick={() => {
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${slug}`;
        const text = `${title} - Simulai OAB`;
        if (navigator.share) {
          navigator.share({ title: text, url });
        } else {
          navigator.clipboard.writeText(url);
        }
      }}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
    >
      <Share2 className="w-4 h-4" />
      Compartilhar
    </button>
  );
}
