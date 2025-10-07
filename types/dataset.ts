// HuggingFace Dataset Types (baseado no PRD)
export interface QuestionDataset {
  id: string;              // Formato: "ANO-FASE_NUMERO" (ex: "2023-01_15")
  question_number: number; // 1-100
  exam_id: string;        // "2023-01"
  exam_year: string;      // "2023"
  question_type: string;  // Área do direito (ex: "ETHICS", "CONSTITUTIONAL")
  nullified: boolean;     // Questão anulada
  question: string;       // Enunciado completo
  choices: {
    label: string[];    // ["A", "B", "C", "D"]
    text: string[];     // Textos das alternativas
  };
  answerKey: number;     // 0-3 (índice da resposta correta)
}

// Mapeamento de tipos do dataset para o enum do Prisma
export const SUBJECT_MAP: Record<string, string> = {
  // Formato em inglês
  ETHICS: "ETHICS",
  CONSTITUTIONAL: "CONSTITUTIONAL",
  CIVIL: "CIVIL",
  CIVIL_PROCEDURE: "CIVIL_PROCEDURE",
  "CIVIL-PROCEDURE": "CIVIL_PROCEDURE",
  CRIMINAL: "CRIMINAL",
  CRIMINAL_PROCEDURE: "CRIMINAL_PROCEDURE",
  "CRIMINAL-PROCEDURE": "CRIMINAL_PROCEDURE",
  LABOUR: "LABOUR",
  LABOUR_PROCEDURE: "LABOUR_PROCEDURE",
  "LABOUR-PROCEDURE": "LABOUR_PROCEDURE",
  ADMINISTRATIVE: "ADMINISTRATIVE",
  TAXES: "TAXES",
  BUSINESS: "BUSINESS",
  CONSUMER: "CONSUMER",
  ENVIRONMENTAL: "ENVIRONMENTAL",
  CHILDREN: "CHILDREN",
  INTERNATIONAL: "INTERNATIONAL",
  HUMAN_RIGHTS: "HUMAN_RIGHTS",
  "HUMAN-RIGHTS": "HUMAN_RIGHTS",

  // Formato em português (anos recentes)
  "DIREITO CIVIL": "CIVIL",
  "DIREITO PENAL": "CRIMINAL",
  "DIREITO DO TRABALHO": "LABOUR",
  "DIREITO CONSTITUCIONAL": "CONSTITUTIONAL",
  "DIREITO ADMINISTRATIVO": "ADMINISTRATIVE",
  "DIREITO TRIBUTÁRIO": "TAXES",
  "DIREITO EMPRESARIAL": "BUSINESS",
  "DIREITO DO CONSUMIDOR": "CONSUMER",
  "DIREITO AMBIENTAL": "ENVIRONMENTAL",
  "DIREITO INTERNACIONAL": "INTERNATIONAL",
  "DIREITOS HUMANOS": "HUMAN_RIGHTS",
  "PROCESSO CIVIL": "CIVIL_PROCEDURE",
  "DIREITO PROCESSUAL CIVIL": "CIVIL_PROCEDURE",
  "PROCESSO PENAL": "CRIMINAL_PROCEDURE",
  "DIREITO PROCESSUAL PENAL": "CRIMINAL_PROCEDURE",
  "PROCESSO DO TRABALHO": "LABOUR_PROCEDURE",
  "DIREITO PROCESSUAL DO TRABALHO": "LABOUR_PROCEDURE",
  "ÉTICA PROFISSIONAL": "ETHICS",
  "ÉTICA": "ETHICS",
  "ESTATUTO DA CRIANÇA E DO ADOLESCENTE": "CHILDREN",
  "ECA": "CHILDREN",
  "FILOSOFIA DO DIREITO": "ETHICS", // Filosofia vai para Ethics (conceitos éticos)
  "PHILOSOPHY": "ETHICS", // Philosophy em inglês
  "PHILOSHOPY": "ETHICS", // Typo no dataset
  "DIREITO ELEITORAL": "CONSTITUTIONAL", // Eleitoral vai para Constitucional

  // Questões sem tipo definido (principalmente 2014-2018)
  "nan": "GENERAL",
  "undefined": "GENERAL",
  "": "GENERAL",
};
