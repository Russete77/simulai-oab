/**
 * Um domínio só, em toda parte.
 *
 * O que aconteceu: o sitemap (6.000 URLs), o robots.txt e o servidor de
 * produção usavam `www.simulaioab.com`, mas os 11 canonicais estavam
 * escritos à mão em `simulaioab.com`, sem www. Cada página dizia ao Google
 * "a versão verdadeira é o apex" — e o apex respondia um redirect de volta
 * para www. Sinais em círculo, e o site não aparecia nem buscando pelo
 * próprio nome.
 *
 * A causa raiz é o endereço estar copiado em 63 lugares em vez de vir de um
 * só. Refatorar tudo para uma constante seria o certo; enquanto isso não
 * acontece, este teste segura a consistência, que é o que de fato quebrou.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const PASTAS = ['app', 'lib', 'components'];
const EXTENSOES = new Set(['.ts', '.tsx']);

function arquivos(dir: string, achados: string[] = []): string[] {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name.startsWith('.')) continue;
      arquivos(caminho, achados);
    } else if (EXTENSOES.has(path.extname(item.name))) {
      achados.push(caminho);
    }
  }
  return achados;
}

describe('domínio canônico', () => {
  const todos = PASTAS.flatMap((p) => {
    const dir = path.join(RAIZ, p);
    return fs.existsSync(dir) ? arquivos(dir) : [];
  });

  it('encontrou arquivos para checar', () => {
    expect(todos.length).toBeGreaterThan(50);
  });

  it('nenhum arquivo usa o apex sem www', () => {
    // `https://simulaioab.com` NÃO casa dentro de `https://www.simulaioab.com`,
    // então basta procurar o literal.
    const culpados = todos
      .filter((f) => fs.readFileSync(f, 'utf8').includes('https://simulaioab.com'))
      .map((f) => path.relative(RAIZ, f));

    expect(
      culpados,
      `Use https://www.simulaioab.com — é o domínio que o servidor, o ` +
        `sitemap e o robots.txt usam. Canonical apontando para o apex faz ` +
        `o Google não indexar.\n  ${culpados.join('\n  ')}`
    ).toEqual([]);
  });

  it('ninguém escreveu www duas vezes ao corrigir', () => {
    const culpados = todos
      .filter((f) => fs.readFileSync(f, 'utf8').includes('www.www.'))
      .map((f) => path.relative(RAIZ, f));
    expect(culpados).toEqual([]);
  });
});
