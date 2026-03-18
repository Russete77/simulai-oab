import { PrismaClient } from "@prisma/client";
import type { QuestionDataset } from "@/types/dataset";
import { SUBJECT_MAP } from "@/types/dataset";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando importação completa do dataset...\n");

  // 1. Ler JSON
  console.log("📖 Lendo dataset_complete.json...");
  const rawData = fs.readFileSync("dataset_complete.json", "utf-8");
  const allQuestions: QuestionDataset[] = JSON.parse(rawData);
  console.log(`   ✅ ${allQuestions.length} questões carregadas\n`);

  // 2. Verificar quantas já existem
  const existing = await prisma.question.count();
  console.log(`📊 Questões já importadas: ${existing}\n`);

  // 3. Importar questões
  console.log("💾 Importando questões...\n");

  let imported = 0;
  let duplicates = 0;
  let errors = 0;
  const errorLog: { question: string; reason: string }[] = [];

  for (let i = 0; i < allQuestions.length; i++) {
    const data = allQuestions[i];

    try {
      // Verificar se já existe
      const exists = await prisma.question.findUnique({
        where: {
          examId_questionNumber: {
            examId: data.exam_id,
            questionNumber: data.question_number,
          },
        },
      });

      if (exists) {
        duplicates++;
        continue;
      }

      // Mapear subject
      const subject = SUBJECT_MAP[data.question_type];

      if (!subject) {
        errorLog.push({
          question: data.id,
          reason: `Unknown subject: ${data.question_type}`,
        });
        errors++;
        continue;
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

      imported++;

      // Log de progresso a cada 100 questões
      if ((i + 1) % 100 === 0) {
        console.log(
          `  Processadas: ${i + 1}/${allQuestions.length} | Importadas: ${imported} | Duplicadas: ${duplicates} | Erros: ${errors}`
        );
      }
    } catch (error) {
      errorLog.push({
        question: data.id,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      errors++;
    }
  }

  console.log("\n✅ Importação concluída!\n");
  console.log("📊 Resumo:");
  console.log(`  Total no dataset: ${allQuestions.length}`);
  console.log(`  ✅ Importadas: ${imported}`);
  console.log(`  ⚠️  Duplicadas: ${duplicates}`);
  console.log(`  ❌ Erros: ${errors}`);

  if (errorLog.length > 0) {
    console.log("\n❌ Primeiros 50 erros:");
    errorLog.slice(0, 50).forEach((err) => {
      console.log(`  ${err.question}: ${err.reason}`);
    });

    // Contar tipos de erro
    const errorTypes: Record<string, number> = {};
    errorLog.forEach((err) => {
      const type = err.reason.split(":")[0];
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    console.log("\n📊 Tipos de erro:");
    Object.entries(errorTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }

  // Verificar total no banco
  const total = await prisma.question.count();
  console.log(`\n📚 Total no banco: ${total} questões\n`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
