'use client';

/**
 * PaywallOverlay — fullscreen overlay que cobre páginas protegidas
 * quando o usuário não tem subscription ATIVA/TRIALING (INCOMPLETE/CANCELED/PAST_DUE).
 * Mantém a estética navy + gradient primary.
 */

import Link from 'next/link';
import { Lock, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaywallOverlayProps {
  feature?: string;
  returnTo?: string;
}

const PRO_BENEFITS = [
  'Simulados ilimitados (5.605 questões FGV oficiais)',
  'Explicações por IA em toda questão',
  'Chat com IA — professor virtual 24/7',
  'Revisão inteligente dos erros com IA',
  'Relatórios em PDF',
  'Badge exclusivo Pro',
];

export function PaywallOverlay({ feature, returnTo = '/dashboard' }: PaywallOverlayProps) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <Card className="bg-surface border">
          <div className="p-8 md:p-10 text-center">
            {/* Ícone animado */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-accent mb-6">
              <Lock className="w-8 h-8 text-accent" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-ink-1 mb-3">
              Desbloqueie todo o SimulaIOAB
            </h1>

            <p className="text-lg text-ink-3 mb-2">
              {feature
                ? `${feature} faz parte do plano PRO.`
                : 'Seu acesso gratuito chegou ao fim.'}
            </p>
            <p className="text-sm text-ink-3 mb-8">
              A prova da OAB está chegando — não perca tempo.
            </p>

            {/* Preço destaque */}
            <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-accent rounded-2xl p-6 mb-6">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                MAIS ESCOLHIDO
              </div>

              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-xl text-ink-3">R$</span>
                <span className="text-5xl font-bold text-ink-1">89</span>
                <span className="text-3xl font-bold text-ink-1">,99</span>
                <span className="text-ink-3 ml-1">/mês</span>
              </div>
              <p className="text-sm text-ink-3 mb-5">
                Plano PRO — cancele quando quiser
              </p>

              {/* Lista de benefícios */}
              <ul className="text-left space-y-2.5 max-w-md mx-auto">
                {PRO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-ink-3">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing" className="flex-1">
                <Button variant="primary" size="lg" className="w-full">
                  <Zap className="w-5 h-5 mr-2" />
                  Assinar por R$ 89,99/mês
                </Button>
              </Link>
              <Link href="/pricing?plan=basic" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  Ver plano Essencial (R$ 19,99)
                </Button>
              </Link>
            </div>

            <p className="text-xs text-ink-3 mt-6">
              Pagamento via PIX, boleto ou cartão •{' '}
              <Link href={returnTo} className="underline hover:text-ink-1">
                Voltar
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
