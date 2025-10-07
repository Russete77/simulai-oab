import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { CreateSimulationSchema } from "@/lib/validations/simulation";
import { SimulationType, Prisma } from "@prisma/client";

const SIMULATION_CONFIGS = {
  FULL_EXAM: {
    questionCount: 80,
    distribution: {
      ETHICS: 8,
      CONSTITUTIONAL: 7,
      CIVIL: 7,
      CIVIL_PROCEDURE: 6,
      CRIMINAL: 6,
      CRIMINAL_PROCEDURE: 6,
      LABOUR: 6,
      LABOUR_PROCEDURE: 5,
      ADMINISTRATIVE: 5,
      TAXES: 5,
      BUSINESS: 5,
      CONSUMER: 5,
      ENVIRONMENTAL: 4,
      CHILDREN: 3,
      INTERNATIONAL: 2,
      HUMAN_RIGHTS: 0,
    },
  },
  ADAPTIVE: { questionCount: 40 },
  QUICK_PRACTICE: { questionCount: 20 },
  ERROR_REVIEW: { questionCount: 30 },
  BY_SUBJECT: { questionCount: 50 },
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validar dados
    const data = CreateSimulationSchema.parse(body);

    const config = SIMULATION_CONFIGS[data.type];
    const questionCount = data.questionCount || config.questionCount;

    // Construir where clause baseado no tipo de simulado
    let where: Prisma.QuestionWhereInput = { nullified: false };

    if (data.type === "FULL_EXAM") {
      // Simulado completo usa distribuição específica
      const questions: string[] = [];

      for (const [subject, count] of Object.entries(
        SIMULATION_CONFIGS.FULL_EXAM.distribution
      )) {
        const subjectQuestions = await prisma.question.findMany({
          where: {
            subject: subject as any,
            nullified: false,
          },
          select: { id: true },
          take: count,
        });

        questions.push(...subjectQuestions.map((q) => q.id));
      }

      // Criar simulado
      const simulation = await prisma.simulation.create({
        data: {
          userId: user.id,
          type: data.type,
          totalQuestions: questions.length,
          subjects: data.subjects || [],
          targetDifficulty: data.targetDifficulty,
          questions: {
            create: questions.map((questionId, index) => ({
              questionId,
              order: index + 1,
            })),
          },
        },
        include: {
          questions: {
            include: {
              question: {
                include: {
                  alternatives: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      return NextResponse.json(simulation);
    }

    // Para outros tipos, usar seleção aleatória
    if (data.subjects && data.subjects.length > 0) {
      where.subject = { in: data.subjects };
    }

    if (data.targetDifficulty) {
      where.difficulty = data.targetDifficulty;
    }

    // Buscar questões aleatórias de diferentes anos
    const allQuestions = await prisma.question.findMany({
      where,
      select: { id: true },
    });

    // Embaralhar e pegar quantidade necessária
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Criar simulado
    const simulation = await prisma.simulation.create({
      data: {
        userId: user.id,
        type: data.type,
        totalQuestions: questions.length,
        subjects: data.subjects || [],
        targetDifficulty: data.targetDifficulty,
        questions: {
          create: questions.map((question, index) => ({
            questionId: question.id,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: {
          include: {
            question: {
              include: {
                alternatives: {
                  select: {
                    id: true,
                    label: true,
                    text: true,
                    questionId: true,
                  },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(simulation);
  } catch (error) {
    console.error("Error creating simulation:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao criar simulado" },
      { status: 500 }
    );
  }
}
