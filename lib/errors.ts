/**
 * Sistema de erros estruturado
 *
 * Define erros com códigos, mensagens para o usuário e status HTTP.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public httpStatus: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.userMessage,
      code: this.code,
      ...(process.env.NODE_ENV === 'development' && {
        details: this.message,
        metadata: this.metadata,
      }),
    };
  }
}

export const ERROR_CODES = {
  // Autenticação
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    userMessage: 'Você precisa estar autenticado para acessar este recurso.',
    httpStatus: 401,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    userMessage: 'Você não tem permissão para acessar este recurso.',
    httpStatus: 403,
  },

  // Questões
  QUESTION_NOT_FOUND: {
    code: 'QUESTION_NOT_FOUND',
    userMessage: 'Questão não encontrada. Tente novamente.',
    httpStatus: 404,
  },
  ALTERNATIVE_NOT_FOUND: {
    code: 'ALTERNATIVE_NOT_FOUND',
    userMessage: 'Alternativa não encontrada.',
    httpStatus: 404,
  },
  QUESTION_ALREADY_ANSWERED: {
    code: 'QUESTION_ALREADY_ANSWERED',
    userMessage: 'Você já respondeu esta questão neste simulado.',
    httpStatus: 400,
  },
  INVALID_QUESTION_DATA: {
    code: 'INVALID_QUESTION_DATA',
    userMessage: 'Dados da questão estão incompletos ou inválidos.',
    httpStatus: 400,
  },

  // Simulados
  SIMULATION_NOT_FOUND: {
    code: 'SIMULATION_NOT_FOUND',
    userMessage: 'Simulado não encontrado.',
    httpStatus: 404,
  },
  SIMULATION_ALREADY_COMPLETED: {
    code: 'SIMULATION_ALREADY_COMPLETED',
    userMessage: 'Este simulado já foi finalizado.',
    httpStatus: 400,
  },
  SIMULATION_NOT_STARTED: {
    code: 'SIMULATION_NOT_STARTED',
    userMessage: 'Este simulado ainda não foi iniciado.',
    httpStatus: 400,
  },
  INSUFFICIENT_QUESTIONS: {
    code: 'INSUFFICIENT_QUESTIONS',
    userMessage:
      'Não há questões suficientes disponíveis com os filtros selecionados.',
    httpStatus: 400,
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    userMessage: 'Você está fazendo muitas requisições. Aguarde um momento.',
    httpStatus: 429,
  },
  AI_RATE_LIMIT_EXCEEDED: {
    code: 'AI_RATE_LIMIT_EXCEEDED',
    userMessage:
      'Limite de explicações por IA excedido. Aguarde 1 minuto e tente novamente.',
    httpStatus: 429,
  },
  ANSWER_RATE_LIMIT_EXCEEDED: {
    code: 'ANSWER_RATE_LIMIT_EXCEEDED',
    userMessage:
      'Você está respondendo questões muito rapidamente. Aguarde alguns segundos.',
    httpStatus: 429,
  },
  SIMULATION_RATE_LIMIT_EXCEEDED: {
    code: 'SIMULATION_RATE_LIMIT_EXCEEDED',
    userMessage:
      'Limite de criação de simulados excedido. Aguarde alguns minutos.',
    httpStatus: 429,
  },

  // Validação
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    userMessage: 'Os dados enviados são inválidos. Verifique e tente novamente.',
    httpStatus: 400,
  },
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    userMessage: 'Dados inválidos fornecidos.',
    httpStatus: 400,
  },

  // IA
  AI_SERVICE_ERROR: {
    code: 'AI_SERVICE_ERROR',
    userMessage:
      'Erro ao gerar explicação com IA. Tente novamente em alguns instantes.',
    httpStatus: 503,
  },
  AI_TIMEOUT: {
    code: 'AI_TIMEOUT',
    userMessage: 'A geração de explicação demorou muito. Tente novamente.',
    httpStatus: 504,
  },

  // Database
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    userMessage: 'Erro ao acessar o banco de dados. Tente novamente.',
    httpStatus: 500,
  },

  // Genérico
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    userMessage: 'Erro interno do servidor. Nossa equipe foi notificada.',
    httpStatus: 500,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    userMessage: 'Recurso não encontrado.',
    httpStatus: 404,
  },
} as const;

// Helper para criar erros facilmente
export function createError(
  errorType: keyof typeof ERROR_CODES,
  metadata?: Record<string, any>
): AppError {
  const error = ERROR_CODES[errorType];
  return new AppError(
    error.userMessage,
    error.code,
    error.userMessage,
    error.httpStatus,
    metadata
  );
}
