'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import {
  Users,
  Copy,
  CheckCircle,
  Trophy,
  Send,
  X,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import { SimulationType } from '@prisma/client';

const SIMULATION_TYPE_LABELS: Record<SimulationType, string> = {
  FULL_EXAM: 'Simulado Completo',
  ADAPTIVE: 'Simulado Adaptativo',
  QUICK_PRACTICE: 'Prática Rápida',
  ERROR_REVIEW: 'Revisão de Erros',
  BY_SUBJECT: 'Por Matéria',
};

const SIMULATION_TYPE_EMOJIS: Record<SimulationType, string> = {
  FULL_EXAM: '🎯',
  ADAPTIVE: '⚡',
  QUICK_PRACTICE: '🚀',
  ERROR_REVIEW: '🔄',
  BY_SUBJECT: '📚',
};

interface Challenge {
  code: string;
  type: SimulationType;
  creatorName: string;
  createdAt: string;
  participants: Array<{
    name: string;
    score?: number;
    completed: boolean;
  }>;
}

export function SimuladoAmigosClient() {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [simulationType, setSimulationType] = useState<SimulationType>('QUICK_PRACTICE');
  const [challengeCode, setChallengeCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique challenge code
  const generateCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Handle create challenge
  const handleCreateChallenge = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = generateCode();

      // Create challenge via API
      const response = await fetch('/api/challenges/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type: simulationType,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar desafio');
      }

      setChallengeCode(code);
      setMode('home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar desafio');
    } finally {
      setLoading(false);
    }
  };

  // Handle join challenge
  const handleJoinChallenge = async () => {
    if (!joinCode.trim()) {
      setError('Por favor, insira um código válido');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/challenges/friend?code=${joinCode.toUpperCase()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Desafio não encontrado');
      }

      const data = await response.json();
      // Navigate to simulation with challenge code
      window.location.href = `/simulado?challengeCode=${data.code}&type=${data.type}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao acessar desafio');
    } finally {
      setLoading(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(`simulaioab.com/simulado-amigos/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Simulado com Amigos</h1>
          <p className="text-navy-600">
            Crie desafios e compare seus resultados com amigos
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card variant="glass" className="mb-6 border-red-500/20 bg-red-500/5">
            <div className="flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X className="w-5 h-5" />
              </button>
            </div>
          </Card>
        )}

        {mode === 'home' && (
          <>
            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Create Challenge Card */}
              <Card variant="glass" className="border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Criar Desafio</h3>
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-navy-600 mb-6">
                  Crie um novo desafio e convide seus amigos para competir
                </p>
                <Button
                  variant="primary"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                  onClick={() => setMode('create')}
                >
                  Começar
                </Button>
              </Card>

              {/* Join Challenge Card */}
              <Card variant="glass" className="border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Entrar em Desafio</h3>
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-navy-600 mb-6">
                  Insira um código para entrar em um desafio existente
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode('join')}
                >
                  Entrar
                </Button>
              </Card>
            </div>

            {/* Challenge Code Display */}
            {challengeCode && (
              <Card variant="glass" className="border-emerald-500/30 bg-emerald-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Desafio Criado!</h3>
                </div>

                <p className="text-navy-600 mb-6">
                  Compartilhe o código abaixo com seus amigos para que eles possam se juntar ao
                  desafio:
                </p>

                <div className="bg-navy-900 rounded-xl p-6 mb-6 border border-emerald-500/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-navy-600 text-sm mb-2">Código do Desafio</p>
                      <p className="text-3xl font-bold text-emerald-400 font-mono">
                        {challengeCode}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(challengeCode)}
                      className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                    >
                      {copiedCode === challengeCode ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Copy className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-emerald-400 mt-2">
                    {copiedCode === challengeCode ? 'Copiado para a área de transferência!' : ''}
                  </p>
                </div>

                <div className="bg-navy-900/50 rounded-lg p-4 mb-6 border border-blue-500/20">
                  <p className="text-sm text-navy-400">
                    <span className="font-semibold">Link para compartilhar:</span>
                    <br />
                    <span className="text-blue-400 break-all">
                      simulaioab.com/simulado-amigos/{challengeCode}
                    </span>
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/simulado?challengeCode=${challengeCode}&type=${simulationType}`;
                  }}
                >
                  Começar Simulado
                </Button>

                <button
                  onClick={() => setChallengeCode('')}
                  className="w-full mt-3 text-navy-600 hover:text-navy-400 text-sm font-medium transition-colors"
                >
                  Criar Novo Desafio
                </button>
              </Card>
            )}

            {/* Tips */}
            <Card variant="glass" className="mt-8 border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Como Funciona</h3>
              <ul className="space-y-3 text-navy-600 text-sm">
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">1</span>
                  <span>Crie um desafio e escolha o tipo de simulado</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">2</span>
                  <span>Compartilhe o código com seus amigos</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">3</span>
                  <span>Seus amigos entram com o código e fazem o mesmo simulado</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-bold">4</span>
                  <span>Compare resultados e veja quem se saiu melhor</span>
                </li>
              </ul>
            </Card>
          </>
        )}

        {/* Create Challenge Mode */}
        {mode === 'create' && (
          <div className="space-y-6">
            {/* Simulation Type Selection */}
            <Card variant="glass">
              <h3 className="text-lg font-bold text-white mb-6">Selecione o Tipo de Simulado</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SIMULATION_TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSimulationType(key as SimulationType)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      simulationType === key
                        ? 'border-blue-600 bg-blue-600/10'
                        : 'border-white/10 hover:border-white/20 bg-navy-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {SIMULATION_TYPE_EMOJIS[key as SimulationType]} {label}
                        </p>
                        <p className="text-sm text-navy-600 mt-1">
                          {getSimulationDescription(key as SimulationType)}
                        </p>
                      </div>
                      {simulationType === key && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 mt-1"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Summary Card */}
            <Card variant="glass" className="border-blue-500/30">
              <h3 className="text-lg font-bold text-white mb-4">Resumo</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-navy-900/50 rounded-lg">
                  <span className="text-navy-600">Tipo de Simulado</span>
                  <span className="text-white font-semibold">
                    {SIMULATION_TYPE_LABELS[simulationType]}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-navy-900/50 rounded-lg">
                  <span className="text-navy-600">Participantes</span>
                  <span className="text-white font-semibold">Você + amigos</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMode('home')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleCreateChallenge}
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Criar Desafio'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Join Challenge Mode */}
        {mode === 'join' && (
          <div className="space-y-6">
            <Card variant="glass">
              <h3 className="text-lg font-bold text-white mb-6">Entrar em Desafio</h3>

              <div className="mb-6">
                <label className="block text-navy-600 text-sm font-semibold mb-3">
                  Código do Desafio
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-white/10 text-white placeholder-navy-600 focus:outline-none focus:border-blue-500 text-center text-xl font-mono tracking-widest"
                />
                <p className="text-navy-600 text-sm mt-2">
                  Insira o código que recebeu de seu amigo
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMode('home')}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleJoinChallenge}
                  disabled={loading || !joinCode.trim()}
                >
                  {loading ? 'Carregando...' : 'Entrar'}
                </Button>
              </div>
            </Card>

            {/* Tips */}
            <Card variant="glass" className="border-yellow-500/20 bg-yellow-500/5">
              <h3 className="text-lg font-semibold text-white mb-3">📌 Dica</h3>
              <p className="text-navy-600 text-sm">
                O código deve conter 6 caracteres (letras e números). Se você recebeu um link,
                copie apenas o código da URL.
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function getSimulationDescription(type: SimulationType): string {
  const descriptions: Record<SimulationType, string> = {
    FULL_EXAM: '80 questões - Exame completo',
    ADAPTIVE: '40 questões - Ajusta ao seu nível',
    QUICK_PRACTICE: '20 questões - Teste rápido',
    ERROR_REVIEW: '30 questões - Questões de erros',
    BY_SUBJECT: '50 questões - Uma matéria',
  };
  return descriptions[type] || '';
}
