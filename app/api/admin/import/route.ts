import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ImportDatasetSchema } from "@/lib/validations/question";
import type { QuestionDataset } from "@/types/dataset";
import { SUBJECT_MAP } from "@/types/dataset";

const HUGGINGFACE_API_URL =
  "https://datasets-server.huggingface.co/rows?dataset=russ7/oab_exams_2011_2025_combined&config=default&split=train";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const data = ImportDatasetSchema.parse(body);

    // Check admin authorization (você pode adicionar verificação de role aqui)
    const apiKey = request.headers.get("x-admin-key");

    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let offset = 0;
    const limit = data.batchSize;
    let totalImported = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${HUGGINGFACE_API_URL}&offset=${offset}&length=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch dataset: ${response.statusText}`);
      }

      const responseData = await response.json();
      const batch = responseData.rows as { row: QuestionDataset }[];

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      for (const { row } of batch) {
        try {
          const subject = SUBJECT_MAP[row.question_type];

          if (!subject) {
            console.warn(`Unknown subject: ${row.question_type}`);
            continue;
          }

          const [yearStr, phaseStr] = row.exam_id.split("-");
          const examYear = parseInt(yearStr);
          const examPhase = parseInt(phaseStr);

          await prisma.question.create({
            data: {
              examId: row.exam_id,
              examYear,
              examPhase,
              questionNumber: row.question_number,
              subject: subject as any,
              statement: row.question,
              nullified: row.nullified,
              keywords: [],
              legalReferences: undefined,
              alternatives: {
                create: row.choices.label.map((label, index) => ({
                  label,
                  text: row.choices.text[index],
                  isCorrect: index === row.answerKey,
                })),
              },
            },
          });

          totalImported++;
        } catch (error: any) {
          if (error.code !== "P2002") {
            // Skip unique constraint violations
            console.error(`Error importing question ${row.id}:`, error);
          }
        }
      }

      offset += limit;
    }

    const stats = await prisma.question.groupBy({
      by: ["subject"],
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      totalImported,
      stats: stats.map(({ subject, _count }) => ({
        subject,
        count: _count.id,
      })),
    });
  } catch (error) {
    console.error("Error importing dataset:", error);

    return NextResponse.json(
      { error: "Erro ao importar dataset" },
      { status: 500 }
    );
  }
}
