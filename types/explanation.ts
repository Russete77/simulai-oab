/**
 * Tipos para explicações estruturadas da IA
 */

export interface StructuredExplanation {
  resumo: string;
  correta: {
    motivo: string;
    baseLegal: string;
  };
  incorretas: Array<{
    alternativa: string;
    motivo: string;
  }>;
  dica: string;
  pegadinhas: string[];
}

export interface ExplanationResponse {
  explanation: StructuredExplanation;
  metadata: {
    isCorrect?: boolean;
    userAnswer?: string;
    correctAnswer: string;
  };
}
