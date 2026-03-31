/**
 * Skeleton Component
 *
 * Placeholder animado para conteúdo em carregamento
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-navy-800/50',
        className
      )}
      role="status"
      aria-label="Carregando conteúdo"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

/**
 * Skeleton para cards de estatísticas
 */
export function SkeletonStatsCard() {
  return (
    <div className="bg-navy-900/50 backdrop-blur-xl border border-navy-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/**
 * Skeleton para questão
 */
export function SkeletonQuestion() {
  return (
    <div className="bg-navy-900/50 backdrop-blur-xl border border-navy-800/50 rounded-2xl p-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Enunciado */}
      <div className="space-y-3 mb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Alternativas */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-navy-700 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de simulados
 */
export function SkeletonSimulationCard() {
  return (
    <div className="bg-navy-900/50 backdrop-blur-xl border border-navy-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Skeleton para tabela de ranking
 */
export function SkeletonLeaderboardRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-navy-900/30 rounded-xl">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}
