'use client';

import { Card, Button } from '@/components/ui';
import { Header } from '@/components/layout/header';
import { ArrowLeft, FileText, Zap, Target, RotateCcw, BookMarked, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { SimulationType, Subject } from '@prisma/client';
import { CreateSimulationSchema } from '@/lib/validations/simulation';
import {
  SIMULATION_TYPE_LABELS,
  SIMULATION_TYPE_DESCRIPTIONS,
  SIMULATION_TYPE_TIME,
  SIMULATION_TYPE_QUESTIONS,
} from '@/lib/constants/simulation-types';
import SubjectSelectorModal from '@/components/simulation/subject-selector-modal';

export default function SimulationsClient() {
  const router = useRouter();
  const [creatingType, setCreatingType] = useState<SimulationType | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const createSimulation = useCallback(async (type: SimulationType) => {
    // Se for BY_SUBJECT, abrir modal de seleção
    if (type === 'BY_SUBJECT') {
      setShowSubjectModal(true);
      return;
    }

    // Validação client-side com Zod
    const validation = CreateSimulationSchema.safeParse({ type });
    if (!validation.success) {
      console.error('Validação falhou:', validation.error.flatten());
      return;
    }

    // Para outros tipos, criar normalmente
    try {
      setCreatingType(type);
      const response = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Se atingiu limite mensal
        if (response.status === 429 && errorData.message) {
          const goToUpgrade = confirm(
            `${errorData.message}\n\nDeseja ver os planos disponíveis?`
          );
          if (goToUpgrade) {
            router.push('/pricing');
          }
          setCreatingType(null);
          return;
        }

        // Outros erros
        throw new Error(errorData.error || 'Failed to create simulation');
      }

      const simulation = await response.json();
      router.push(`/simulations/${simulation.id}`);
    } catch (error) {
      console.error('Error creating simulation:', error);
      alert('Erro ao criar simulado. Tente novamente.');
      setCreatingType(null);
    }
  }, [router]);

  const createSubjectSimulation = useCallback(async (subjects: Subject[]) => {
    // Validação client-side com Zod
    const validation = CreateSimulationSchema.safeParse({ type: 'BY_SUBJECT', subjects });
    if (!validation.success) {
      console.error('Validação falhou:', validation.error.flatten());
      return;
    }

    try {
      setCreatingType('BY_SUBJECT');
      const response = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Se atingiu limite mensal
        if (response.status === 429 && errorData.message) {
          const goToUpgrade = confirm(
            `${errorData.message}\n\nDeseja ver os planos disponíveis?`
          );
          if (goToUpgrade) {
            router.push('/pricing');
          }
          setCreatingType(null);
          return;
        }

        // Outros erros
        throw new Error(errorData.error || 'Failed to create simulation');
      }

      const simulation = await response.json();
      router.push(`/simulations/${simulation.id}`);
    } catch (error) {
      console.error('Error creating simulation:', error);
      alert('Erro ao criar simulado. Tente novamente.');
      setCreatingType(null);
    }
  }, [router]);

  const simulationTypes = [
    {
      type: 'FULL_EXAM' as SimulationType,
      icon: <FileText className="w-8 h-8" />,
      color: 'blue',
    },
    {
      type: 'ADAPTIVE' as SimulationType,
      icon: <Zap className="w-8 h-8" />,
      color: 'purple',
    },
    {
      type: 'QUICK_PRACTICE' as SimulationType,
      icon: <Target className="w-8 h-8" />,
      color: 'cyan',
    },
    {
      type: 'ERROR_REVIEW' as SimulationType,
      icon: <RotateCcw className="w-8 h-8" />,
      color: 'amber',
    },
    {
      type: 'BY_SUBJECT' as SimulationType,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-accent-soft border-accent rounded-xl p-4">
          <div className="flex items-start gap-3">
            <BookMarked className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-accent font-medium">Escolha seu tipo de simulado</p>
              <p className="text-sm text-ink-2 mt-1">
                Cada simulado é gerado com questões reais dos exames anteriores da OAB
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simulationTypes.map((sim) => (
            <Card key={sim.type} variant="glass" className="group hover:border-strong">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl bg-${sim.color}-500/20 text-${sim.color}-400`}>
                  {sim.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-ink-1 mb-1">
                    {SIMULATION_TYPE_LABELS[sim.type]}
                  </h3>
                  <p className="text-ink-2 text-sm">
                    {SIMULATION_TYPE_DESCRIPTIONS[sim.type]}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-surface-2 rounded-lg p-3">
                  <p className="text-ink-2 text-xs mb-1">Questões</p>
                  <p className="text-ink-1 font-semibold">
                    {SIMULATION_TYPE_QUESTIONS[sim.type]}
                  </p>
                </div>
                <div className="flex-1 bg-surface-2 rounded-lg p-3">
                  <p className="text-ink-2 text-xs mb-1">Tempo</p>
                  <p className="text-ink-1 font-semibold">
                    {SIMULATION_TYPE_TIME[sim.type]}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => createSimulation(sim.type)}
                disabled={creatingType !== null}
              >
                {creatingType === sim.type ? 'Criando...' : 'Iniciar Simulado'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de Seleção de Matérias */}
      <SubjectSelectorModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        onConfirm={createSubjectSimulation}
      />
    </div>
  );
}
