import { useState, useEffect } from "react";
import type { ExplanationResponse } from "@/types/explanation";

export function useExplanation(questionId: string) {
  const [data, setData] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetar estado quando questionId mudar
  useEffect(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, [questionId]);

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
