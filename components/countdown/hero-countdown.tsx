'use client';

import { useEffect, useState } from 'react';

interface ExamDate {
  id: string;
  name: string;
  date: string;
  phase: number;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calc(target: string): CountdownState {
  const diff = new Date(target).getTime() - Date.now();
  const total = Math.max(0, Math.floor(diff / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Compact countdown pra usar inline no hero. Sem Card, sem CTAs.
 * Lê /api/oab/exam-dates e mostra a próxima prova.
 */
export function HeroCountdown() {
  const [exam, setExam] = useState<ExamDate | null>(null);
  const [c, setC] = useState<CountdownState | null>(null);

  useEffect(() => {
    fetch('/api/oab/exam-dates')
      .then((r) => r.json())
      .then((data) => {
        const next = Array.isArray(data) ? data[0] : null;
        if (next) {
          setExam(next);
          setC(calc(next.date));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!exam) return;
    const id = setInterval(() => setC(calc(exam.date)), 1000);
    return () => clearInterval(id);
  }, [exam]);

  if (!exam || !c) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink-3 animate-pulse" />
        Carregando próxima OAB…
      </div>
    );
  }

  const examDate = new Date(exam.date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-md border bg-surface">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span className="text-xs text-ink-3 font-medium uppercase tracking-wider">
        Próxima OAB
      </span>
      <div className="flex items-baseline gap-1.5 text-mono-tabular">
        <span className="text-lg font-semibold text-ink-1">{c.days}</span>
        <span className="text-[10px] text-ink-3 uppercase">d</span>
        <span className="text-lg font-semibold text-ink-1 ml-1">
          {String(c.hours).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-ink-3 uppercase">h</span>
        <span className="text-lg font-semibold text-ink-1 ml-1">
          {String(c.minutes).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-ink-3 uppercase">m</span>
        <span className="text-lg font-semibold text-ink-1 ml-1 hidden sm:inline">
          {String(c.seconds).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-ink-3 uppercase hidden sm:inline">s</span>
      </div>
      <span className="hidden md:inline text-xs text-ink-3">· {examDate}</span>
    </div>
  );
}
