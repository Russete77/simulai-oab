'use client';

/**
 * Captura UTM de primeiro toque (first-touch) — sem isso, rodar mídia paga
 * é voar às cegas: não dá pra saber de qual campanha veio um cadastro.
 *
 * 1. Em qualquer página, se a URL tiver utm_source/utm_medium/utm_campaign/
 *    utm_term/utm_content, grava um cookie (30 dias) — só se ainda não
 *    existir um (first-touch: a primeira origem que trouxe a pessoa é a que
 *    importa pra atribuição, não a última página que ela visitou).
 * 2. Se o usuário estiver logado e o cookie existir, manda uma vez pra
 *    /api/analytics/attribution, que persiste em User.acquisitionUtm (também
 *    first-touch: o servidor só grava se ainda não tiver nada salvo).
 *
 * Não renderiza nada.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

const COOKIE_NAME = 'simulai_utm';
const COOKIE_MAX_AGE_DAYS = 30;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function UtmCapture() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (getCookie(COOKIE_NAME)) return; // first-touch já capturado

    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
    const data: Record<string, string> = {};
    for (const key of utmKeys) {
      const value = searchParams.get(key);
      if (value) data[key] = value;
    }

    if (Object.keys(data).length === 0) return;

    setCookie(
      COOKIE_NAME,
      JSON.stringify({ ...data, landingPath: window.location.pathname, capturedAt: new Date().toISOString() }),
      COOKIE_MAX_AGE_DAYS
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return;

    fetch('/api/analytics/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
      .then((r) => r.json())
      .then((res) => {
        // Só dispara o evento de conversão na primeira vez que a atribuição
        // é gravada de verdade (res.ok && !res.skipped) — evita disparar
        // "CompleteRegistration" de novo a cada visita de um usuário antigo.
        if (res?.ok && !res.skipped) {
          (window as any).fbq?.('track', 'CompleteRegistration');
        }
      })
      .catch(() => {
        // silencioso — atribuição não é crítica pro uso do app
      });
  }, [isSignedIn]);

  return null;
}
