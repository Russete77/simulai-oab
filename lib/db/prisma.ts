import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * A URL do banco, com o pool ajustado para o momento.
 *
 * `connection_limit=1` é o valor certo em produção: cada instância de função
 * serverless segura o próprio pool, e somar todas elas estoura o pgbouncer.
 *
 * No BUILD é o oposto. É um processo só gerando 385 páginas em paralelo, e
 * as de matéria consultam o banco. Com limite 1 as consultas fazem fila, e
 * do build da Vercel (iad1) até o banco (sa-east-1) cada ida e volta custa
 * mais de 100ms — a fila não anda e estoura o `pool_timeout`.
 *
 * O sintoma não é build quebrado, que seria fácil de ver. A página de
 * matéria captura o erro e devolve `totalQuestions: 0`, então o deploy sai
 * verde com quinze páginas de SEO anunciando "0 questões".
 */
function urlDoBanco(): string | undefined {
  const bruta = process.env.DATABASE_URL;
  if (!bruta || process.env.NEXT_PHASE !== "phase-production-build") return bruta;

  try {
    const u = new URL(bruta);
    u.searchParams.set("connection_limit", "10");
    u.searchParams.set("pool_timeout", "30");
    console.log("[DB] build: connection_limit=10, pool_timeout=30");
    return u.toString();
  } catch {
    // URL ilegível: melhor seguir com a original do que derrubar o build.
    return bruta;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["error", "warn"],
    // Nota: em dev, descomente a linha abaixo para debug de queries
    // log: ["query", "error", "warn"],
    datasourceUrl: urlDoBanco(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
