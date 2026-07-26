'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { Clock, Calendar } from 'lucide-react';

interface ExamDate {
  id: string;
  name: string;
  date: string;
  phase: number;
}

interface TimeUnit {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateCountdown(examDate: string): TimeUnit {
  const now = new Date();
  const exam = new Date(examDate);
  const diff = exam.getTime() - now.getTime();
  const total = Math.max(0, Math.floor(diff / 1000));
  return {
    days: Math.floor(total / (24 * 3600)),
    hours: Math.floor((total % (24 * 3600)) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
}

function TimeDisplay({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full aspect-square max-w-[88px] flex items-center justify-center rounded-md bg-surface-2 border">
        <span className="text-2xl sm:text-3xl font-semibold text-ink-1 tabular-nums tracking-tight">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-ink-3 mt-2 font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

interface OABCountdownProps {
  /** Permite trocar os CTAs quando usado numa página pública (deslogada) —
   * /practice e /simulations exigem login e redirecionariam o visitante. */
  ctas?: { href: string; label: string; variant?: 'primary' | 'secondary' }[];
}

export function OABCountdown({ ctas }: OABCountdownProps = {}) {
  const [upcomingExam, setUpcomingExam] = useState<ExamDate | null>(null);
  const [countdown, setCountdown] = useState<TimeUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExamDates();
  }, []);

  async function fetchExamDates() {
    try {
      setLoading(true);
      const response = await fetch('/api/oab/exam-dates');
      if (!response.ok) throw new Error('Falha ao carregar datas dos exames');
      const data = await response.json();
      const nextExam = data[0];
      setUpcomingExam(nextExam);
      setCountdown(calculateCountdown(nextExam.date));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!upcomingExam) return;
    const interval = setInterval(() => {
      const next = calculateCountdown(upcomingExam.date);
      setCountdown(next);
      if (next.total === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [upcomingExam]);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-ink-3">Carregando próximo exame…</p>
        </div>
      </Card>
    );
  }

  if (error || !upcomingExam || !countdown) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-sm text-danger mb-3">{error || 'Erro ao carregar exame'}</p>
          <Button onClick={fetchExamDates} size="sm">Tentar novamente</Button>
        </div>
      </Card>
    );
  }

  const examDate = new Date(upcomingExam.date);
  const formattedDate = examDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isStarted = countdown.total === 0;

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 mb-6 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-ink-3" />
            <h2 className="text-lg font-semibold text-ink-1">{upcomingExam.name}</h2>
          </div>
          <p className="text-xs text-ink-3 capitalize">{formattedDate}</p>
        </div>
        {!isStarted && (
          <Badge variant="accent">
            <Clock className="w-3 h-3" />
            {countdown.total > 0 ? 'Contagem ativa' : 'Iniciado'}
          </Badge>
        )}
      </div>

      {/* Countdown */}
      {!isStarted ? (
        <>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
            <TimeDisplay value={countdown.days} label="Dias" />
            <TimeDisplay value={countdown.hours} label="Horas" />
            <TimeDisplay value={countdown.minutes} label="Minutos" />
            <TimeDisplay value={countdown.seconds} label="Segundos" />
          </div>

          <p className="text-center text-sm text-ink-2 mb-6">
            <span className="font-semibold text-ink-1">{countdown.days} dias</span>
            {' '}para se preparar para o {upcomingExam.name}
          </p>
        </>
      ) : (
        <div className="bg-warning-soft border border-warning rounded-md p-4 mb-6">
          <p className="text-center text-sm text-warning font-medium">
            🎯 O {upcomingExam.name} já começou
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(ctas ?? [
          { href: '/practice', label: 'Começar a estudar', variant: 'primary' },
          { href: '/simulations', label: 'Fazer simulado', variant: 'secondary' },
        ]).map((cta) => (
          <Link key={cta.href} href={cta.href}>
            <Button variant={cta.variant === 'secondary' ? 'secondary' : 'primary'} fullWidth>
              {cta.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Phase */}
      {upcomingExam.phase && (
        <div className="mt-5 pt-5 border-t flex items-center gap-2">
          <span className="text-eyebrow">Fase</span>
          <span className="text-sm text-ink-1 font-medium">
            {upcomingExam.phase === 1 ? '1ª Fase' : '2ª Fase'}
          </span>
        </div>
      )}
    </Card>
  );
}
