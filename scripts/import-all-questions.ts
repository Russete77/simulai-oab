import { PrismaClient } from "@prisma/client";
import type { QuestionDataset } from "@/types/dataset";
import { SUBJECT_MAP } from "@/types/dataset";

const prisma = new PrismaClient();

const HUGGINGFACE_API_URL =
  "https://datasets-server.huggingface.co/rows?dataset=russ7/oab_exams_2011_2025_combined&config=default&split=train";

async function fetchAllQuestions() {
  const allQuestions: QuestionDataset[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  console.log("📥 Buscando questões do Hugging Face...\n");

  while (hasMore) {
    const url = `${HUGGINGFACE_API_URL}&offset=${offset}&length=${limit}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const rows = data.rows as { row: QuestionDataset }[];

      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      allQuestions.push(...rows.map(r => r.row));
      console.log(`  Fetched ${allQuestions.length} questions...`);

      offset += limit;

      // Aguardar um pouco para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching at offset ${offset}:`, error);
      hasMore = false;
    }
  }

  console.log(`\n✅ Total de questões obtidas: ${allQuestions.length}\n`);
  return allQuestions;
}

async function importQuestion(data: QuestionDataset) {
  try {
    // Mapear subject
    const subject = SUBJECT_MAP[data.question_type];

    if (!subject) {
      console.warn(`⚠️  Unknown subject: ${data.question_type}`);
      return { success: false, reason: 'unknown_subject' };
    }

    // Extrair exam year e phase do exam_id (ex: "2023-01")
    const [yearStr, phaseStr] = data.exam_id.split("-");
    const examYear = parseInt(yearStr);
    const examPhase = parseInt(phaseStr);

    // Verificar se já existe (usando examId + questionNumber como unique)
    const existing = await prisma.question.findUnique({
      where: {
        examId_questionNumber: {
          examId: data.exam_id,
          questionNumber: data.question_number,
        },
      },
    });

    if (existing) {
      return { success: false, reason: 'duplicate' };
    }

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
        keywords: [],
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

    return { success: true };
  } catch (error) {
    console.error(`Error importing question ${data.id}:`, error);
    return { success: false, reason: 'error', error };
  }
}

async function main() {
  console.log("🚀 Iniciando importação completa do dataset...\n");

  // 1. Buscar todas as questões
  const questions = await fetchAllQuestions();

  if (questions.length === 0) {
    console.log("❌ Nenhuma questão encontrada!");
    return;
  }

  // 2. Importar cada questão
  console.log("💾 Importando questões para o banco...\n");

  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  for (let i = 0; i < questions.length; i++) {
    const result = await importQuestion(questions[i]);

    if (result.success) {
      imported++;
    } else if (result.reason === 'duplicate') {
      duplicates++;
    } else {
      errors++;
    }

    // Log de progresso a cada 100 questões
    if ((i + 1) % 100 === 0) {
      console.log(`  Processadas: ${i + 1}/${questions.length} | Importadas: ${imported} | Duplicadas: ${duplicates} | Erros: ${errors}`);
    }
  }

  console.log("\n✅ Importação concluída!\n");
  console.log("📊 Resumo:");
  console.log(`  Total no dataset: ${questions.length}`);
  console.log(`  ✅ Importadas: ${imported}`);
  console.log(`  ⚠️  Duplicadas: ${duplicates}`);
  console.log(`  ❌ Erros: ${errors}`);

  // 3. Verificar total no banco
  const total = await prisma.question.count();
  console.log(`\n📚 Total no banco agora: ${total} questões\n`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
