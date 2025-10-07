import { z } from "zod";
import { Subject, Difficulty } from "@prisma/client";

export const GetNextQuestionSchema = z.object({
  subject: z.nativeEnum(Subject).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  excludeAnswered: z.boolean().optional().default(true),
});

export const AnswerQuestionSchema = z.object({
  questionId: z.string().cuid(),
  alternativeId: z.string().cuid(),
  timeSpent: z.number().int().min(0),
  confidence: z.number().int().min(1).max(5).optional(),
  simulationId: z.string().cuid().optional(),
});

export const ImportDatasetSchema = z.object({
  source: z.literal("huggingface"),
  dataset: z.literal("russ7/oab_exams_2011_2025_combined"),
  batchSize: z.number().int().positive().optional().default(100),
});
