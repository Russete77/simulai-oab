'use client';

import { useState } from 'react';
import { Subject } from '@prisma/client';
import { X, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui';

interface SubjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subjects: Subject[]) => void;
}

// Labels em português para as matérias
const SUBJECT_LABELS: Record<Subject, string> = {
  ETHICS: 'Ética Profissional',
  CONSTITUTIONAL: 'Direito Constitucional',
  CIVIL: 'Direito Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Direito Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Direito do Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Direito Administrativo',
  TAXES: 'Direito Tributário',
  BUSINESS: 'Direito Empresarial',
  CONSUMER: 'Direito do Consumidor',
  ENVIRONMENTAL: 'Direito Ambiental',
  CHILDREN: 'Estatuto da Criança e Adolescente',
  INTERNATIONAL: 'Direito Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Conhecimentos Gerais',
};

// Quantidade aproximada de questões por matéria (baseado na distribuição real)
const SUBJECT_QUESTION_COUNT: Record<Subject, number> = {
  CIVIL: 406,
  ETHICS: 315,
  CONSTITUTIONAL: 302,
  CRIMINAL: 257,
  CIVIL_PROCEDURE: 238,
  ADMINISTRATIVE: 196,
  LABOUR: 171,
  BUSINESS: 145,
  TAXES: 104,
  CRIMINAL_PROCEDURE: 92,
  LABOUR_PROCEDURE: 81,
  INTERNATIONAL: 39,
  HUMAN_RIGHTS: 36,
  CONSUMER: 30,
  CHILDREN: 30,
  ENVIRONMENTAL: 27,
  GENERAL: 0,
};

export default function SubjectSelectorModal({
  isOpen,
  onClose,
  onConfirm,
}: SubjectSelectorModalProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  if (!isOpen) return null;

  const toggleSubject = (subject: Subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleConfirm = () => {
    if (selectedSubjects.length === 0) {
      alert('Selecione pelo menos uma matéria');
      return;
    }
    onConfirm(selectedSubjects);
    setSelectedSubjects([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedSubjects([]);
    onClose();
  };

  // Ordenar matérias por quantidade de questões (decrescente)
  const sortedSubjects = Object.keys(SUBJECT_LABELS)
    .filter((subject) => subject !== 'GENERAL') // Remover GENERAL
    .sort((a, b) => {
      const countA = SUBJECT_QUESTION_COUNT[a as Subject] || 0;
      const countB = SUBJECT_QUESTION_COUNT[b as Subject] || 0;
      return countB - countA;
    }) as Subject[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-navy-900 border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Escolha as Matérias</h2>
              <p className="text-navy-400 text-sm mt-1">
                Selecione as matérias para o seu simulado personalizado
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-navy-400" />
          </button>
        </div>

        {/* Selected Count */}
        {selectedSubjects.length > 0 && (
          <div className="px-6 py-3 bg-blue-500/10 border-b border-blue-500/20">
            <p className="text-blue-400 text-sm font-medium">
              {selectedSubjects.length} {selectedSubjects.length === 1 ? 'matéria selecionada' : 'matérias selecionadas'}
            </p>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedSubjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);
              const questionCount = SUBJECT_QUESTION_COUNT[subject] || 0;

              return (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all text-left
                    ${
                      isSelected
                        ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20'
                        : 'bg-navy-800/50 border-white/10 hover:border-white/20 hover:bg-navy-800'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm mb-1 ${
                          isSelected ? 'text-green-400' : 'text-white'
                        }`}
                      >
                        {SUBJECT_LABELS[subject]}
                      </h3>
                      <p className="text-xs text-navy-400">
                        {questionCount} questões
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${
                          isSelected
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/20'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-navy-900/50">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirm}
              disabled={selectedSubjects.length === 0}
            >
              Criar Simulado ({selectedSubjects.length} {selectedSubjects.length === 1 ? 'matéria' : 'matérias'})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
