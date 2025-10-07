import { useState } from "react";

interface ExplanationData {
  explanation: string;
  metadata: {
    isCorrect?: boolean;
    userAnswer?: string;
    correctAnswer: string;
  };
}

export function useExplanation(questionId: string) {
  const [data, setData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${questionId}/explain`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar explicação");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchExplanation };
}
