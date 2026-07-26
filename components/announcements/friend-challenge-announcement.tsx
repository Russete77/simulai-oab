'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { Users, X, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'announcement_friend_challenge_seen';

/**
 * Modal de anúncio de feature — aparece uma vez pra todo usuário logado no
 * dashboard, avisando da novidade do desafio entre amigos. Some pra sempre
 * depois de fechado (não é um lembrete recorrente tipo o banner de push).
 */
export function FriendChallengeAnnouncement() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  function handleCreate() {
    dismiss();
    router.push('/simulado-amigos');
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-accent">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <button
            onClick={dismiss}
            className="text-ink-3 hover:text-ink-1 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-eyebrow mb-1">Novidade</p>
        <h2 className="text-xl font-semibold text-ink-1 mb-2">Desafie um amigo</h2>
        <p className="text-sm text-ink-2 mb-6 leading-relaxed">
          Agora dá pra criar um link de desafio e comparar resultados com quem
          você convidar — mesmo quem ainda não tem conta pode ver o desafio.
          É de graça, não precisa ser assinante.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleCreate} className="flex-1">
            Criar meu desafio
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            Agora não
          </Button>
        </div>
      </Card>
    </div>
  );
}
