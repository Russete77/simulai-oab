import { z } from "zod";
import { SimulationType, Subject, Difficulty } from "@prisma/client";

export const CreateSimulationSchema = z.object({
  type: z.nativeEnum(SimulationType),
  subjects: z.array(z.nativeEnum(Subject)).optional(),
  targetDifficulty: z.nativeEnum(Difficulty).optional(),
  questionCount: z.number().int().positive().optional(),
});

export const FinishSimulationSchema = z.object({
  simulationId: z.string().cuid(),
  // Presente quando o simulado foi iniciado a partir de um desafio entre
  // amigos — usado pra registrar o score do participante no desafio.
  challengeCode: z.string().optional(),
});
