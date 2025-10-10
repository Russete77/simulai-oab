'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { QuestionChat } from '@/components/question-chat';
import { MessageCircle, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

interface Alternative {
  id: string;
  letter: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  statement: string;
  subject: string;
  alternatives: Alternative[];
}

interface WrongAnswer {
  id: string;
  questionId: string;
  selectedAlternativeId: string;
  isCorrect: boolean;
  question: Question;
}

interface WrongQuestionsReviewProps {
  wrongAnswers: WrongAnswer[];
}

const SUBJECT_LABELS: Record<string, string> = {
  ETHICS: 'Ética',
  CONSTITUTIONAL: 'Constitucional',
  CIVIL: 'Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Administrativo',
  TAXES: 'Tributário',
  BUSINESS: 'Empresarial',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  CHILDREN: 'ECA',
  INTERNATIONAL: 'Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

export function WrongQuestionsReview({ wrongAnswers }: WrongQuestionsReviewProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const toggleChat = (questionId: string) => {
    setChatOpen(chatOpen === questionId ? null : questionId);
  };

  if (wrongAnswers.length === 0) {
    return null;
  }

  return (
    <Card variant="glass">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">
          Questões Erradas ({wrongAnswers.length})
        </h3>
        <p className="text-navy-400 text-sm">
          Revise suas respostas incorretas e tire dúvidas com a IA
        </p>
      </div>

      <div className="space-y-4">
        {wrongAnswers.map((answer, index) => {
          const isExpanded = expandedQuestions.has(answer.questionId);
          const isChatOpen = chatOpen === answer.questionId;
          const correctAlternative = answer.question.alternatives.find(a => a.isCorrect);
          const selectedAlternative = answer.question.alternatives.find(
            a => a.id === answer.selectedAlternativeId
          );

          return (
            <div
              key={answer.id}
              className="border border-navy-700 rounded-xl overflow-hidden bg-navy-900/30"
            >
              {/* Question Header */}
              <div
                className="p-4 cursor-pointer hover:bg-navy-800/30 transition-colors"
                onClick={() => toggleQuestion(answer.questionId)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                        Questão {index + 1}
                      </span>
                      <span className="px-2 py-1 bg-navy-700 text-navy-300 text-xs rounded">
                        {SUBJECT_LABELS[answer.question.subject]}
                      </span>
                    </div>
                    <p className="text-white text-sm line-clamp-2">
                      {answer.question.statement}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-navy-700 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-navy-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-navy-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Question Details */}
              {isExpanded && (
                <div className="border-t border-navy-700">
                  <div className="p-4 space-y-4">
                    {/* Statement */}
                    <div>
                      <p className="text-white leading-relaxed">
                        {answer.question.statement}
                      </p>
                    </div>

                    {/* Alternatives */}
                    <div className="space-y-2">
                      {answer.question.alternatives.map((alt) => {
                        const isSelected = alt.id === answer.selectedAlternativeId;
                        const isCorrect = alt.isCorrect;

                        return (
                          <div
                            key={alt.id}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrect
                                ? 'bg-green-500/10 border-green-500/50'
                                : isSelected
                                ? 'bg-red-500/10 border-red-500/50'
                                : 'bg-navy-800/30 border-navy-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : isSelected ? (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                ) : (
                                  <div className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-white mr-2">
                                  {alt.letter})
                                </span>
                                <span className={isCorrect ? 'text-green-300' : isSelected ? 'text-red-300' : 'text-navy-300'}>
                                  {alt.text}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Answer Summary */}
                    <div className="flex items-start gap-3 p-3 bg-navy-800/50 rounded-lg">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-navy-300">
                            Sua resposta:{' '}
                            <span className="text-red-400 font-semibold">
                              {selectedAlternative?.letter})
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-navy-300">
                            Resposta correta:{' '}
                            <span className="text-green-400 font-semibold">
                              {correctAlternative?.letter})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Chat Toggle */}
                    <button
                      onClick={() => toggleChat(answer.questionId)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 font-medium">
                        {isChatOpen ? 'Fechar Chat com IA' : 'Tirar Dúvida com IA'}
                      </span>
                    </button>

                    {/* AI Chat */}
                    {isChatOpen && (
                      <div className="border-t border-navy-700 pt-4">
                        <QuestionChat questionId={answer.questionId} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
