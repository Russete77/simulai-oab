/**
 * Sobe as variáveis da Stripe live para a Vercel.
 *
 * Lê `.env.producao.vercel` (gerado por stripe-live-setup.ts) e manda cada
 * variável para o ambiente **Production** via CLI da Vercel. O valor vai pela
 * entrada padrão do processo — não vira argumento de linha de comando, então
 * não aparece na lista de processos nem no histórico do shell.
 *
 * COMO USAR
 *
 *   Em seco (só mostra o que faria):
 *     npx tsx scripts/vercel-subir-env.ts
 *
 *   Para valer:
 *     npx tsx scripts/vercel-subir-env.ts --aplicar
 *
 * PRECISA de uma CLI da Vercel logada na conta que enxerga o projeto
 * `simulai-oab` (time `russete77s-projects`). Se o seu terminal é o que está
 * logado, rode este script lá.
 *
 * Depois de subir, apague os dois arquivos locais:
 *   .env.producao.local  e  .env.producao.vercel
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const APLICAR = process.argv.includes('--aplicar');
const ARQUIVO = path.join(process.cwd(), '.env.producao.vercel');
const AMBIENTE = 'production';

function mascara(v: string): string {
  return v.length <= 12 ? '***' : `${v.slice(0, 8)}…${v.slice(-4)}`;
}

function vercel(args: string[], entrada?: string) {
  return spawnSync('vercel', args, {
    input: entrada,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

function main() {
  if (!fs.existsSync(ARQUIVO)) {
    throw new Error(
      `Não achei ${path.basename(ARQUIVO)}. Rode antes: npx tsx scripts/stripe-live-setup.ts --aplicar`
    );
  }

  const pares = fs
    .readFileSync(ARQUIVO, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return { nome: l.slice(0, i), valor: l.slice(i + 1) };
    })
    .filter((p) => p.nome && p.valor);

  if (!pares.length) {
    throw new Error(
      `${path.basename(ARQUIVO)} não tem nenhuma variável preenchida. ` +
        'As comentadas com # precisam ser pegas no painel da Stripe.'
    );
  }

  console.log('');
  console.log(`  ambiente  ${AMBIENTE}`);
  console.log(`  modo      ${APLICAR ? 'APLICANDO' : 'SECO — não escreve nada'}`);
  console.log('');

  for (const { nome, valor } of pares) {
    if (!APLICAR) {
      console.log(`  SERIA DEFINIDA  ${nome.padEnd(36)} ${mascara(valor)}`);
      continue;
    }

    // Remove antes: `env add` não sobrescreve, ele reclama que já existe.
    vercel(['env', 'rm', nome, AMBIENTE, '--yes']);

    const r = vercel(['env', 'add', nome, AMBIENTE], `${valor}\n`);
    const ok = r.status === 0;
    console.log(`  ${ok ? 'DEFINIDA      ' : 'FALHOU        '}  ${nome.padEnd(36)} ${mascara(valor)}`);
    if (!ok) console.log(`      ${(r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' ')}`);
  }

  console.log('');
  if (APLICAR) {
    console.log('  Confira:  vercel env ls production');
    console.log('  Depois:   apague .env.producao.local e .env.producao.vercel');
  } else {
    console.log('  Para valer:  npx tsx scripts/vercel-subir-env.ts --aplicar');
  }
  console.log('');
}

try {
  main();
} catch (erro) {
  console.error('');
  console.error(`  ERRO: ${erro instanceof Error ? erro.message : String(erro)}`);
  console.error('');
  process.exit(1);
}
