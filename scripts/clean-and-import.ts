import { PrismaClient } from "@prisma/client";
import type { QuestionDataset } from "@/types/dataset";
import { SUBJECT_MAP } from "@/types/dataset";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Limpando duplicatas e importando dataset...\n");

  // 1. Ler JSON
  console.log("📖 Lendo dataset_complete.json...");
  const rawData = fs.readFileSync("dataset_complete.json", "utf-8");
  const allQuestions: QuestionDataset[] = JSON.parse(rawData);
  console.log(`   Total bruto: ${allQuestions.length} questões\n`);

  // 2. Remover duplicatas (manter primeira ocorrência)
  console.log("🧹 Removendo duplicatas...");
  const seen = new Set<string>();
  const unique: QuestionDataset[] = [];

  for (const q of allQuestions) {
    const key = `${q.exam_id}_${q.question_number}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  console.log(`   Únicas: ${unique.length}`);
  console.log(`   Duplicatas removidas: ${allQuestions.length - unique.length}\n`);

  // 3. Limpar banco
  console.log("🗑️  Limpando banco de dados...");
  await prisma.alternative.deleteMany({});
  await prisma.question.deleteMany({});
  console.log("   ✅ Banco limpo\n");

  // 4. Importar questões únicas
  console.log("💾 Importando questões...\n");

  let imported = 0;
  let errors = 0;
  const errorLog: { question: string; reason: string }[] = [];

  for (let i = 0; i < unique.length; i++) {
    const data = unique[i];

    try {
      const subject = SUBJECT_MAP[data.question_type];

      if (!subject) {
        errorLog.push({
          question: data.id,
          reason: `Unknown subject: ${data.question_type}`,
        });
        errors++;
        continue;
      }

      const [yearStr, phaseStr] = data.exam_id.split("-");
      const examYear = parseInt(yearStr);
      const examPhase = parseInt(phaseStr);

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

      if ((i + 1) % 100 === 0) {
        console.log(
          `  Processadas: ${i + 1}/${unique.length} | Importadas: ${imported} | Erros: ${errors}`
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
  console.log(`  Dataset original: ${allQuestions.length} questões`);
  console.log(`  Duplicatas removidas: ${allQuestions.length - unique.length}`);
  console.log(`  Questões únicas: ${unique.length}`);
  console.log(`  ✅ Importadas: ${imported}`);
  console.log(`  ❌ Erros: ${errors}`);

  if (errorLog.length > 0 && errorLog.length <= 20) {
    console.log("\n❌ Erros:");
    errorLog.forEach((err) => {
      console.log(`  ${err.question}: ${err.reason}`);
    });
  }

  const total = await prisma.question.count();
  console.log(`\n📚 Total no banco: ${total} questões\n`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
