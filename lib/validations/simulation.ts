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
});
