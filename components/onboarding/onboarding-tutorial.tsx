"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  action: string;
  icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Responda 20 Questões",
    description: "Comece praticando com questões reais da OAB. Responda pelo menos 20 questões para entender seu nível atual.",
    action: "Ir para Prática",
    icon: "📝",
  },
  {
    id: 2,
    title: "Veja Explicações IA",
    description: "Aprenda com explicações detalhadas geradas por IA especializada em Direito. Entenda o porquê de cada resposta.",
    action: "Ver Exemplo",
    icon: "🤖",
  },
  {
    id: 3,
    title: "Crie Seu Primeiro Simulado",
    description: "Teste seus conhecimentos em um simulado completo. Acompanhe sua evolução e identifique pontos de melhoria.",
    action: "Criar Simulado",
    icon: "🎯",
  },
];

interface OnboardingTutorialProps {
  currentStep: number;
  onStepComplete: (step: number) => void;
  onClose: () => void;
  onSkip: () => void;
}

export function OnboardingTutorial({
  currentStep,
  onStepComplete,
  onClose,
  onSkip,
}: OnboardingTutorialProps) {
  const [step, setStep] = useState(currentStep);
  const progress = Math.round((step / ONBOARDING_STEPS.length) * 100);

  const currentStepData = ONBOARDING_STEPS[step - 1];

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length) {
      const nextStep = step + 1;
      setStep(nextStep);
      onStepComplete(nextStep);
    } else {
      onClose();
    }
  };

  const handleAction = () => {
    switch (step) {
      case 1:
        window.location.href = "/practice";
        break;
      case 2:
        // Stay on current page to show explanation example
        handleNext();
        break;
      case 3:
        window.location.href = "/simulations/create";
        break;
    }
  };

  if (!currentStepData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500/30 shadow-2xl">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">
                {currentStepData.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Bem-vindo ao Simulai OAB
                </h2>
                <p className="text-sm text-gray-400">
                  Passo {step} de {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step Content */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-3xl">{currentStepData.icon}</span>
              {currentStepData.title}
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Steps Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {ONBOARDING_STEPS.map((s) => (
              <div
                key={s.id}
                className={`p-3 rounded-lg border transition-all ${
                  s.id < step
                    ? "bg-green-500/10 border-green-500/30 text-green-500"
                    : s.id === step
                    ? "bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30"
                    : "bg-gray-800/50 border-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {s.id < step ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className="text-lg">{s.icon}</span>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      s.id <= step ? "text-white" : "text-gray-500"
                    }`}
                  >
                    Passo {s.id}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    s.id <= step ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {s.title}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Pular tutorial
            </button>
            <div className="flex gap-3">
              {step < ONBOARDING_STEPS.length && (
                <Button
                  onClick={handleNext}
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                onClick={handleAction}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                {currentStepData.action}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
