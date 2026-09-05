'use client';

import { Card } from '@/components/ui';
import { CheckCircle, XCircle, Lightbulb, AlertTriangle, BookOpen } from 'lucide-react';
import type { StructuredExplanation } from '@/types/explanation';

interface ExplanationCardsProps {
  explanation: StructuredExplanation;
  isCorrect?: boolean;
}

export function ExplanationCards({ explanation, isCorrect }: ExplanationCardsProps) {
  return (
    <div className="space-y-4">
      {/* Resumo Rápido */}
      <Card variant="glass" className="p-5 border-accent bg-accent-soft">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
              Resumo Rápido
            </h4>
            <p className="text-ink-1/90 text-[15px] leading-relaxed">
              {explanation.resumo}
            </p>
          </div>
        </div>
      </Card>

      {/* Alternativa Correta */}
      <Card variant="glass" className="p-5 border-green-500/20 bg-green-500/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-green-300 uppercase tracking-wide mb-2">
              Por Que Está Correta
            </h4>
            <p className="text-ink-1/90 text-[15px] leading-relaxed mb-3">
              {explanation.correta.motivo}
            </p>
            {/* Fundamento legal escondido: as citações foram geradas por
                gpt-4o-mini e não são confiáveis — 477 caem em "Art. 5º da
                CF", e as duas que conferi à mão estavam erradas. Mesma
                decisão de app/questoes/[id]/page.tsx.
                Ver _PLANO-CLAUDE/AUDITORIA-BANCO-QUESTOES.md */}
          </div>
        </div>
      </Card>

      {/* Alternativas Incorretas */}
      {explanation.incorretas && explanation.incorretas.length > 0 && (
        <Card variant="glass" className="p-5 border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-300 uppercase tracking-wide mb-3">
                Por Que Estão Incorretas
              </h4>
              <div className="space-y-3">
                {explanation.incorretas.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-red-500 font-semibold text-sm mt-0.5 flex-shrink-0">
                      {item.alternativa})
                    </span>
                    <p className="text-ink-1/90 text-[15px] leading-relaxed flex-1">
                      {item.motivo}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dica de Memorização */}
      {explanation.dica && (
        <Card variant="glass" className="p-5 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wide mb-2">
                Dica de Memorização
              </h4>
              <p className="text-ink-1/90 text-[15px] leading-relaxed">
                {explanation.dica}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pegadinhas Comuns */}
      {explanation.pegadinhas && explanation.pegadinhas.length > 0 && (
        <Card variant="glass" className="p-5 border-purple-500/20 bg-purple-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-3">
                Pegadinhas Comuns
              </h4>
              <ul className="space-y-2">
                {explanation.pegadinhas.map((pegadinha, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1 flex-shrink-0">⚠</span>
                    <span className="text-ink-1/90 text-[15px] leading-relaxed">
                      {pegadinha}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
