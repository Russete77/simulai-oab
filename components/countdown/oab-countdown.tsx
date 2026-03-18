'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

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
  total: number; // Total seconds remaining
}

function calculateCountdown(examDate: string): TimeUnit {
  const now = new Date();
  const exam = new Date(examDate);
  const diff = exam.getTime() - now.getTime();

  const total = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(total / (24 * 3600));
  const hours = Math.floor((total % (24 * 3600)) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return { days, hours, minutes, seconds, total };
}

interface TimeDisplayProps {
  value: number;
  label: string;
}

function TimeDisplay({ value, label }: TimeDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
        <span className="text-2xl sm:text-3xl font-bold text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs sm:text-sm text-navy-600 mt-2 font-semibold uppercase">{label}</span>
    </div>
  );
}

export function OABCountdown() {
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

      if (!response.ok) {
        throw new Error('Falha ao carregar datas dos exames');
      }

      const data = await response.json();
      const nextExam = data[0]; // Primeiro exame é o próximo
      setUpcomingExam(nextExam);

      // Initial countdown
      setCountdown(calculateCountdown(nextExam.date));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  // Update countdown every second
  useEffect(() => {
    if (!upcomingExam) return;

    const interval = setInterval(() => {
      const newCountdown = calculateCountdown(upcomingExam.date);
      setCountdown(newCountdown);

      // Stop updating when countdown reaches 0
      if (newCountdown.total === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [upcomingExam]);

  if (loading) {
    return (
      <Card variant="glass" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-navy-600">Carregando datas do exame...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !upcomingExam || !countdown) {
    return (
      <Card variant="glass" className="bg-red-500/5">
        <div className="text-center py-6">
          <p className="text-red-400 mb-4">{error || 'Erro ao carregar informações do exame'}</p>
          <Button onClick={fetchExamDates} variant="primary" size="sm">
            Tentar Novamente
          </Button>
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
    <Card variant="glass" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">{upcomingExam.name}</h2>
          </div>
          <p className="text-sm text-navy-600 capitalize">{formattedDate}</p>
        </div>
        {!isStarted && (
          <div className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">
              {countdown.total > 0 ? 'Contagem Regressiva Ativa' : 'Iniciado'}
            </span>
          </div>
        )}
      </div>

      {/* Countdown Display */}
      {!isStarted ? (
        <div>
          <div className="grid grid-cols-4 gap-3 sm:gap-6 mb-8">
            <TimeDisplay value={countdown.days} label="Dias" />
            <TimeDisplay value={countdown.hours} label="Horas" />
            <TimeDisplay value={countdown.minutes} label="Minutos" />
            <TimeDisplay value={countdown.seconds} label="Segundos" />
          </div>

          {/* Study Motivation */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <p className="text-center text-navy-300">
              <span className="font-bold text-white">{countdown.days} dias</span> para se preparar para o {upcomingExam.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <p className="text-center text-yellow-400 font-semibold">
            🎯 O {upcomingExam.name} já começou! Você pode acompanhar suas respostas no dashboard.
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/practice" className="flex-1">
          <Button variant="primary" className="w-full">
            Comece a Estudar Agora
          </Button>
        </Link>
        <Link href="/simulations" className="flex-1">
          <Button variant="outline" className="w-full">
            Fazer Simulado
          </Button>
        </Link>
      </div>

      {/* Phase Info */}
      {upcomingExam.phase && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-navy-600">
            <span className="text-white font-semibold">Fase:</span> {upcomingExam.phase === 1 ? '1ª Fase' : '2ª Fase'}
          </p>
        </div>
      )}
    </Card>
  );
}
