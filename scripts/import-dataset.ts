import { PrismaClient } from "@prisma/client";
import type { QuestionDataset } from "@/types/dataset";
import { SUBJECT_MAP } from "@/types/dataset";

const prisma = new PrismaClient();

const HUGGINGFACE_API_URL =
  "https://datasets-server.huggingface.co/rows?dataset=russ7/oab_exams_2011_2025_combined&config=default&split=train";

async function fetchDataset(offset: number = 0, limit: number = 100) {
  const url = `${HUGGINGFACE_API_URL}&offset=${offset}&length=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  }

  const data = await response.json();
  return data.rows as { row: QuestionDataset }[];
}

async function importQuestion(data: QuestionDataset) {
  try {
    // Mapear subject
    const subject = SUBJECT_MAP[data.question_type];

    if (!subject) {
      console.warn(`Unknown subject: ${data.question_type}`);
      return;
    }

    // Extrair exam year e phase do exam_id (ex: "2023-01")
    const [yearStr, phaseStr] = data.exam_id.split("-");
    const examYear = parseInt(yearStr);
    const examPhase = parseInt(phaseStr);

    // Criar questão com alternativas
    await prisma.question.create({
      data: {
        examId: data.exam_id,
        examYear,
        examPhase,
        questionNumber: data.question_number,
        subject: subject as any,
        statement: data.question,
        nullified: data.nullified,
        keywords: [], // TODO: Extrair com NLP
        legalReferences: undefined,
        alternatives: {
          create: data.choices.label.map((label, index) => ({
            label,
            text: data.choices.text[index],
            isCorrect: index === data.answerKey,
          })),
        },
      },
    });

    console.log(`✅ Imported question ${data.id}`);
  } catch (error: any) {
    if (error.code === "P2002") {
      // Unique constraint violation - question already exists
      console.log(`⏭️  Skipping existing question ${data.id}`);
    } else {
      console.error(`❌ Error importing question ${data.id}:`, error.message);
    }
  }
}

async function main() {
  console.log("🚀 Starting dataset import...\n");

  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    console.log(`\n📦 Fetching batch: offset=${offset}, limit=${limit}`);

    const batch = await fetchDataset(offset, limit);

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing ${batch.length} questions...`);

    for (const { row } of batch) {
      await importQuestion(row);
      totalImported++;
    }

    offset += limit;

    // Delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(`\n✨ Import completed! Total: ${totalImported} questions`);

  // Calcular estatísticas
  const stats = await prisma.question.groupBy({
    by: ["subject"],
    _count: { id: true },
  });

  console.log("\n📊 Questions by subject:");
  stats.forEach(({ subject, _count }) => {
    console.log(`  ${subject}: ${_count.id}`);
  });
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
