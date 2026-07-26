'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Users, Copy, Check, Share2 } from 'lucide-react';
import { SimulationType } from '@prisma/client';

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * CTA na tela de resultado do simulado — "desafie um amigo a bater esse
 * resultado". Momento de maior engajamento (acabou de ver a nota), gancho
 * natural pro loop viral do desafio entre amigos.
 */
export function ChallengeFriendCta({ type, score }: { type: SimulationType; score: number }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const code = generateCode();
      const res = await fetch('/api/challenges/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type }),
      });
      if (!res.ok) throw new Error('Falha ao criar desafio');
      setLink(`${window.location.origin}/simulado-amigos/${code}`);
    } catch {
      setError('Não deu pra criar o desafio agora. Tenta de novo em instantes.');
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    if (!link) return;
    const text = `Fiz ${Math.round(score)}% nesse simulado da OAB. Consegue superar?`;
    if (navigator.share) {
      navigator.share({ title: 'Simulai OAB', text, url: link }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-accent" />
        <h2 className="text-lg font-semibold text-ink-1">Desafie um amigo a bater esse resultado</h2>
      </div>
      <p className="text-sm text-ink-2 mb-4">
        Crie um link de desafio com esse mesmo tipo de simulado e compare quem tira a nota mais alta.
      </p>

      {!link ? (
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? 'Criando...' : 'Criar desafio'}
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2 border text-sm text-ink-2 break-all">
            {link}
          </div>
          <Button variant="ghost" onClick={handleShare} className="shrink-0">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Compartilhar
              </>
            )}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </Card>
  );
}
