#!/usr/bin/env node
/**
 * Smoke test pós-build: sobe `next start` contra o build já gerado e bate
 * HTTP real em rotas críticas, deslogado. Existe porque nenhum teste
 * unitário pega o tipo de bug que isso pega: o /diagnostico ficou 500 em
 * produção por semanas porque o matcher do middleware, embora pareça
 * correto como regex isolada, falhava silenciosamente na forma como o
 * Next.js realmente compila `config.matcher` — só uma requisição HTTP de
 * verdade contra um build real expõe isso.
 *
 * Uso: node scripts/smoke-test.mjs  (assume que `npm run build` já rodou)
 */
import { spawn } from 'node:child_process';

const PORT = process.env.SMOKE_TEST_PORT || '3100';
const BASE_URL = `http://localhost:${PORT}`;

// path -> status HTTP aceitável (uma das opções da lista)
const CHECKS = [
  ['/', [200]],
  ['/diagnostico', [200]],
  ['/pricing', [200]],
  ['/como-funciona', [200]],
  ['/manifest.json', [200]],
  ['/sw.js', [200]],
  ['/push-sw.js', [200]],
  // rotas privadas devem redirecionar pro login (307/302), nunca 500
  ['/dashboard', [307, 302]],
  ['/practice', [307, 302]],
];

function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(BASE_URL, { redirect: 'manual' });
        if (res.status) return resolve();
      } catch {
        // servidor ainda não está de pé
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Timeout esperando o servidor subir'));
      }
      setTimeout(tick, 500);
    };
    tick();
  });
}

async function main() {
  const server = spawn('npx', ['next', 'start', '-p', PORT], {
    stdio: 'inherit',
    shell: true,
  });

  let failures = [];
  try {
    await waitForServer();

    for (const [path, okStatuses] of CHECKS) {
      const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
      const ok = okStatuses.includes(res.status);
      console.log(`${ok ? '✅' : '❌'} ${path} -> ${res.status} (esperado: ${okStatuses.join('/')})`);
      if (!ok) failures.push(`${path} retornou ${res.status}, esperado ${okStatuses.join('/')}`);
    }
  } finally {
    server.kill();
  }

  if (failures.length > 0) {
    console.error('\nSmoke test falhou:\n' + failures.map((f) => `  - ${f}`).join('\n'));
    process.exit(1);
  }

  console.log('\nSmoke test passou — todas as rotas críticas responderam como esperado.');
}

main().catch((err) => {
  console.error('Smoke test com erro inesperado:', err);
  process.exit(1);
});
