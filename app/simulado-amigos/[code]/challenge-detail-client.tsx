'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Trophy, Users, Play, Copy, CheckCircle, Clock } from 'lucide-react';
import { SimulationType } from '@prisma/client';

const SIMULATION_TYPE_LABELS: Record<SimulationType, string> = {
  FULL_EXAM: 'Simulado Completo',
  ADAPTIVE: 'Simulado Adaptativo',
  QUICK_PRACTICE: 'Prática Rápida',
  ERROR_REVIEW: 'Revisão de Erros',
  BY_SUBJECT: 'Por Matéria',
};

interface Participant {
  name: string;
  score?: number;
  completed: boolean;
}

interface ChallengeData {
  code: string;
  type: SimulationType;
  creatorName: string;
  createdAt: string;
  participants: Participant[];
}

interface ChallengeDetailClientProps {
  code: string;
}

export function ChallengeDetailClient({ code }: ChallengeDetailClientProps) {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/challenges/friend?code=${code}`);

        if (!response.ok) {
          throw new Error('Desafio não encontrado');
        }

        const data = await response.json();
        setChallenge(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar desafio');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [code]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/simulado-amigos/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = challenge?.participants.filter((p) => p.completed).length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card variant="glass" className="h-96 animate-pulse"></Card>
        </main>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card variant="glass" className="border-red-500/20 bg-red-500/5">
            <p className="text-red-400">{error || 'Desafio não encontrado'}</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Desafio de Simulado</h1>
          <p className="text-navy-600">Participe e compare resultados com seus amigos</p>
        </div>

        {/* Challenge Info Card */}
        <Card variant="premium" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Section */}
            <div>
              <div className="mb-6">
                <p className="text-navy-600 text-sm mb-2">Criado por</p>
                <p className="text-2xl font-bold text-white">{challenge.creatorName}</p>
              </div>

              <div className="mb-6">
                <p className="text-navy-600 text-sm mb-2">Tipo de Simulado</p>
                <p className="text-xl font-bold text-blue-400">
                  {SIMULATION_TYPE_LABELS[challenge.type]}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-navy-600 text-sm mb-2">Código</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold font-mono text-emerald-400">{challenge.code}</p>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-navy-800 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-navy-600 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center gap-2"
                onClick={() =>
                  (window.location.href = `/simulado?challengeCode=${challenge.code}&type=${challenge.type}`)
                }
              >
                <Play className="w-5 h-5" />
                Começar Simulado
              </Button>
            </div>

            {/* Right Section - Participants */}
            <div>
              <div className="bg-navy-900/50 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Participantes</h3>
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <Users className="w-5 h-5" />
                    {challenge.participants.length}
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {challenge.participants.map((participant, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        participant.completed
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-navy-800/50 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {participant.completed && (
                          <Trophy className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-medium text-white">{participant.name}</span>
                      </div>

                      {participant.completed ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-emerald-400">{participant.score}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-navy-600 font-medium">Em progresso</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-navy-600 text-sm mb-2">Progresso</p>
                  <div className="w-full bg-navy-900 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 h-2 rounded-full"
                      style={{
                        width: `${
                          challenge.participants.length > 0
                            ? (completedCount / challenge.participants.length) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-white font-semibold text-sm mt-2">
                    {completedCount} de {challenge.participants.length} completado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Leaderboard (if any completed) */}
        {completedCount > 0 && (
          <Card variant="glass" className="mb-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Ranking
            </h3>

            <div className="space-y-3">
              {challenge.participants
                .filter((p) => p.completed)
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((participant, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      idx === 0
                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30'
                        : idx === 1
                          ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20'
                          : 'bg-navy-800/50 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                          idx === 0
                            ? 'bg-amber-500 text-navy-950'
                            : idx === 1
                              ? 'bg-gray-400 text-navy-950'
                              : idx === 2
                                ? 'bg-orange-600 text-white'
                                : 'bg-navy-700 text-navy-400'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-white">{participant.name}</span>
                    </div>

                    <span
                      className={`text-lg font-bold ${
                        idx === 0
                          ? 'text-amber-400'
                          : idx === 1
                            ? 'text-gray-300'
                            : idx === 2
                              ? 'text-orange-400'
                              : 'text-blue-400'
                      }`}
                    >
                      {participant.score}%
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Invite Section */}
        <Card variant="glass" className="border-blue-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Convide Mais Amigos
          </h3>

          <p className="text-navy-600 mb-6">
            Compartilhe o link abaixo ou o código {challenge.code} com seus amigos:
          </p>

          <div className="bg-navy-900/50 rounded-lg p-4 mb-4 border border-blue-500/20">
            <p className="text-sm text-blue-400 break-all">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/simulado-amigos/${challenge.code}`
                : '...'}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleCopyLink}
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Link Copiado!' : 'Copiar Link'}
          </Button>
        </Card>
      </main>
    </div>
  );
}
