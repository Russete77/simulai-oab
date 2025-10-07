'use client';

import { Card, Button } from '@/components/ui';
import { Header } from '@/components/layout/header';
import { ArrowLeft, FileText, Zap, Target, RotateCcw, BookMarked } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SimulationType } from '@prisma/client';

export default function SimulationsClient() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const createSimulation = async (type: SimulationType) => {
    try {
      setCreating(true);
      const response = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('Failed to create simulation');
      }

      const simulation = await response.json();
      router.push(`/simulations/${simulation.id}`);
    } catch (error) {
      console.error('Error creating simulation:', error);
      alert('Erro ao criar simulado. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const simulationTypes = [
    {
      type: 'FULL_EXAM' as SimulationType,
      icon: <FileText className="w-8 h-8" />,
      title: 'Simulado Completo',
      description: 'Formato oficial da OAB com 80 questões',
      questions: '80 questões',
      time: '5 horas',
      color: 'blue',
    },
    {
      type: 'ADAPTIVE' as SimulationType,
      icon: <Zap className="w-8 h-8" />,
      title: 'Simulado Adaptativo',
      description: 'Questões que se ajustam ao seu nível',
      questions: '40 questões',
      time: '2 horas',
      color: 'purple',
    },
    {
      type: 'QUICK_PRACTICE' as SimulationType,
      icon: <Target className="w-8 h-8" />,
      title: 'Prática Rápida',
      description: 'Teste rápido para revisão',
      questions: '20 questões',
      time: '1 hora',
      color: 'cyan',
    },
    {
      type: 'ERROR_REVIEW' as SimulationType,
      icon: <RotateCcw className="w-8 h-8" />,
      title: 'Revisão de Erros',
      description: 'Refaça questões que você errou',
      questions: '30 questões',
      time: 'Livre',
      color: 'amber',
    },
  ];

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <BookMarked className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-400 font-medium">Escolha seu tipo de simulado</p>
              <p className="text-sm text-navy-400 mt-1">
                Cada simulado é gerado com questões reais dos exames anteriores da OAB
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {simulationTypes.map((sim) => (
            <Card key={sim.type} variant="glass" className="group hover:border-white/20">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl bg-${sim.color}-500/20 text-${sim.color}-400`}>
                  {sim.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{sim.title}</h3>
                  <p className="text-navy-600 text-sm">{sim.description}</p>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-navy-800/50 rounded-lg p-3">
                  <p className="text-navy-600 text-xs mb-1">Questões</p>
                  <p className="text-white font-semibold">{sim.questions}</p>
                </div>
                <div className="flex-1 bg-navy-800/50 rounded-lg p-3">
                  <p className="text-navy-600 text-xs mb-1">Tempo</p>
                  <p className="text-white font-semibold">{sim.time}</p>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => createSimulation(sim.type)}
                disabled={creating}
              >
                {creating ? 'Criando...' : 'Iniciar Simulado'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
