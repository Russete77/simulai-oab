/**
 * Batch de geração de explicações IA para questões sem explicação.
 *
 * Reaproveita generateExplanation() (mesmo prompt/cache/cost-guard do app),
 * então é naturalmente retomável: questões já explicadas são puladas.
 *
 * Uso:
 *   npx tsx scripts/generate-explanations-batch.ts              # dry-run (só conta e estima custo)
 *   npx tsx scripts/generate-explanations-batch.ts --run        # executa tudo
 *   npx tsx scripts/generate-explanations-batch.ts --run --limit 50   # lote de teste
 *   npx tsx scripts/generate-explanations-batch.ts --run --concurrency 4
 *
 * Requer OPENAI_API_KEY e DATABASE_URL no ambiente (.env).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Scripts standalone não carregam .env.local (só o Next faz isso).
// Carrega manualmente sem sobrescrever o que já está no ambiente.
try {
  const envLocal = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envLocal.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {
  // sem .env.local — segue com o ambiente atual
}
// Compat: a chave local está salva como OPEN_API_KEY (nome legado)
if (!process.env.OPENAI_API_KEY && process.env.OPEN_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPEN_API_KEY;
}

import { PrismaClient } from "@prisma/client";
import { generateExplanation } from "@/lib/ai/explanation-service";

const prisma = new PrismaClient();

// gpt-4o-mini: ~US$0.15/1M tokens entrada + US$0.60/1M saída
// ~700 tokens de prompt + ~450 de resposta ≈ US$0.0004/questão
const EST_COST_PER_QUESTION_USD = 0.0004;

interface Args {
  run: boolean;
  limit: number | null;
  concurrency: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const getNum = (flag: string): number | null => {
    const i = argv.indexOf(flag);
    if (i === -1 || !argv[i + 1]) return null;
    const n = parseInt(argv[i + 1], 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return {
    run: argv.includes("--run"),
    limit: getNum("--limit"),
    concurrency: getNum("--concurrency") ?? 6,
  };
}

async function findMissing(limit: number | null) {
  return prisma.question.findMany({
    where: {
      nullified: false,
      aiExplanation: null,
    },
    select: {
      id: true,
      statement: true,
      subject: true,
      examYear: true,
      alternatives: {
        select: { label: true, text: true, isCorrect: true },
        orderBy: { label: "asc" },
      },
    },
    orderBy: [{ examYear: "desc" }, { questionNumber: "asc" }],
    ...(limit ? { take: limit } : {}),
  });
}

async function main() {
  const args = parseArgs();

  const totalQuestions = await prisma.question.count({ where: { nullified: false } });
  const totalExplained = await prisma.questionExplanation.count();
  const missing = await findMissing(args.limit);

  console.log("📊 Situação atual");
  console.log(`   Questões ativas:       ${totalQuestions}`);
  console.log(`   Já explicadas:         ${totalExplained}`);
  console.log(`   Faltando (neste lote): ${missing.length}${args.limit ? ` (limit ${args.limit})` : ""}`);
  console.log(`   Custo estimado:        ~US$ ${(missing.length * EST_COST_PER_QUESTION_USD).toFixed(2)}`);
  console.log(`   Concorrência:          ${args.concurrency}`);

  if (!args.run) {
    console.log("\n🔎 Dry-run — nada foi gerado. Use --run para executar.");
    return;
  }

  // Questões sem alternativa correta marcada não têm como ser explicadas
  const usable = missing.filter((q) => q.alternatives.some((a) => a.isCorrect));
  const skippedNoCorrect = missing.length - usable.length;
  if (skippedNoCorrect > 0) {
    console.warn(`⚠️  ${skippedNoCorrect} questões puladas (sem alternativa correta marcada)`);
  }

  let done = 0;
  let failed = 0;
  const failures: { id: string; error: string }[] = [];
  const startedAt = Date.now();

  // Fila com N workers — cada questão é independente; falha não para o lote
  const queue = [...usable];
  async function worker() {
    for (;;) {
      const q = queue.shift();
      if (!q) return;
      const correct = q.alternatives.find((a) => a.isCorrect)!;
      try {
        await generateExplanation({
          questionId: q.id,
          question: q.statement,
          alternatives: q.alternatives,
          correctAnswer: correct.label,
          subject: String(q.subject),
          examYear: q.examYear,
        });
        done++;
      } catch (err) {
        failed++;
        failures.push({ id: q.id, error: err instanceof Error ? err.message : String(err) });
        // Orçamento estourado = não adianta continuar
        if (err instanceof Error && err.message.includes("Orçamento")) {
          console.error("🛑 Orçamento mensal de IA excedido — abortando o restante.");
          queue.length = 0;
          return;
        }
      }
      const processed = done + failed;
      if (processed % 100 === 0) {
        const elapsedMin = (Date.now() - startedAt) / 60000;
        const rate = processed / elapsedMin;
        const etaMin = Math.round((usable.length - processed) / rate);
        console.log(
          `   ${processed}/${usable.length} (${failed} falhas) — ${rate.toFixed(0)}/min — ETA ~${etaMin}min`
        );
      }
    }
  }

  console.log(`\n🚀 Gerando ${usable.length} explicações...`);
  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));

  const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n✅ Concluído em ${elapsedMin}min — ${done} geradas, ${failed} falhas`);

  if (failures.length > 0) {
    console.log("\n❌ Falhas (re-rodar o script tenta apenas as faltantes):");
    for (const f of failures.slice(0, 20)) console.log(`   ${f.id}: ${f.error}`);
    if (failures.length > 20) console.log(`   ... e mais ${failures.length - 20}`);
  }

  const finalCount = await prisma.questionExplanation.count();
  console.log(`\n📈 Total de questões explicadas no banco agora: ${finalCount}/${totalQuestions}`);
}

main()
  .catch((err) => {
    console.error("Erro fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
