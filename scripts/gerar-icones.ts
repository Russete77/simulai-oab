/**
 * Gera os ícones do app a partir de public/logo-badge.png.
 *
 * POR QUE EXISTE
 *
 * Os ícones antigos eram a logo HORIZONTAL espremida num quadrado: sobrava
 * só o rabo dela no canto inferior direito e o resto era transparente. No
 * resultado de busca do Google, isso vira um círculo praticamente vazio —
 * foi assim que o problema apareceu.
 *
 * Duas regras que os antigos quebravam:
 *
 *   1. Fundo SÓLIDO, sem alpha. Marca branca em fundo transparente some
 *      sobre o branco do Google.
 *   2. Pelo menos 48x48 no favicon.ico. O Google ignora favicon menor que
 *      isso e cai no ícone genérico — o antigo tinha 16x16.
 *
 * Rodar: npx tsx scripts/gerar-icones.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ORIGEM = 'public/logo-badge.png';
const FUNDO = { r: 8, g: 27, b: 71 }; // #081B47, o azul do badge

const SAIDAS = [
  { arquivo: 'public/icon-192.png', tamanho: 192 },
  { arquivo: 'public/icon-512.png', tamanho: 512 },
  { arquivo: 'app/icon.png', tamanho: 32 },
  { arquivo: 'app/apple-icon.png', tamanho: 180 },
];

/** Tamanhos dentro do .ico. 48 é o mínimo que o Google aceita. */
// Maior primeiro: o Next declara o `sizes` do link a partir da PRIMEIRA
// entrada do arquivo. Com 16 na frente ele anunciava sizes="16x16", abaixo
// do minimo de 48 do Google, mesmo o arquivo tendo 48 dentro. Conferido num
// build de producao servido localmente.
const NO_ICO = [48, 32, 16];

/**
 * O badge de origem tem uma moldura branca de alguns pixels. Recortar pela
 * área que não é branca evita levar essa borda para dentro do ícone, onde
 * ela viraria um contorno claro em volta do azul.
 */
async function recorte(): Promise<{ left: number; top: number; width: number; height: number }> {
  const { data, info } = await sharp(ORIGEM)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const branco = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240;
  };

  let esq = 0;
  let dir = info.width - 1;
  let topo = 0;
  let base = info.height - 1;
  const meioY = Math.floor(info.height / 2);
  const meioX = Math.floor(info.width / 2);

  while (esq < dir && branco(esq, meioY)) esq++;
  while (dir > esq && branco(dir, meioY)) dir--;
  while (topo < base && branco(meioX, topo)) topo++;
  while (base > topo && branco(meioX, base)) base--;

  return { left: esq, top: topo, width: dir - esq + 1, height: base - topo + 1 };
}

/**
 * Monta o .ico à mão: cabeçalho, uma entrada por tamanho, e os PNGs
 * emendados no fim. O formato aceita payload PNG desde o Vista, e nenhuma
 * biblioteca do projeto escreve .ico.
 */
function montarIco(imagens: { tamanho: number; png: Buffer }[]): Buffer {
  const cabecalho = Buffer.alloc(6);
  cabecalho.writeUInt16LE(0, 0); // reservado
  cabecalho.writeUInt16LE(1, 2); // 1 = ícone
  cabecalho.writeUInt16LE(imagens.length, 4);

  const entradas: Buffer[] = [];
  let deslocamento = 6 + imagens.length * 16;

  for (const { tamanho, png } of imagens) {
    const e = Buffer.alloc(16);
    e.writeUInt8(tamanho >= 256 ? 0 : tamanho, 0); // 0 significa 256
    e.writeUInt8(tamanho >= 256 ? 0 : tamanho, 1);
    e.writeUInt8(0, 2); // paleta
    e.writeUInt8(0, 3); // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(deslocamento, 12);
    entradas.push(e);
    deslocamento += png.length;
  }

  return Buffer.concat([cabecalho, ...entradas, ...imagens.map((i) => i.png)]);
}

async function main() {
  if (!fs.existsSync(ORIGEM)) throw new Error(`Não achei ${ORIGEM}`);

  const area = await recorte();
  console.log('');
  console.log(`  origem   ${ORIGEM}`);
  console.log(`  recorte  ${area.width}x${area.height} em (${area.left},${area.top})`);
  console.log('');

  const base = () =>
    sharp(ORIGEM)
      .extract(area)
      // flatten mata o canal alpha: o ícone passa a ter fundo de verdade,
      // então a marca branca continua visível sobre o branco do Google.
      .flatten({ background: FUNDO })
      // O decodificador de .ico do Next exige PNG em RGBA. `flatten` tira o
      // canal alpha, entao ele volta aqui — opaco, so para satisfazer o
      // formato. Sem isto: "The PNG is not in RGBA format" e 500 no icone.
      .ensureAlpha(1);

  for (const { arquivo, tamanho } of SAIDAS) {
    const png = await base()
      .resize(tamanho, tamanho, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, png);
    console.log(`  ${String(tamanho).padStart(3)}x${String(tamanho).padEnd(3)}  ${arquivo.padEnd(24)} ${png.length} bytes`);
  }

  // Variante maskable: o Android recorta o ícone num círculo e só garante os
  // 80% centrais. Sem margem, o "OAB" da base seria decepado no launcher.
  const MARGEM = Math.round(512 * 0.1);
  const maskable = await base()
    .resize(512 - MARGEM * 2, 512 - MARGEM * 2, { fit: 'cover' })
    .extend({
      top: MARGEM,
      bottom: MARGEM,
      left: MARGEM,
      right: MARGEM,
      background: FUNDO,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync('public/icon-maskable-512.png', maskable);
  console.log(`  512x512  public/icon-maskable-512.png ${maskable.length} bytes (com margem)`);

  const imagens = [];
  for (const tamanho of NO_ICO) {
    imagens.push({
      tamanho,
      png: await base().resize(tamanho, tamanho, { fit: 'cover' }).png({ compressionLevel: 9 }).toBuffer(),
    });
  }
  const ico = montarIco(imagens);
  fs.writeFileSync('app/favicon.ico', ico);
  console.log(`  ${NO_ICO.join('/')}     app/favicon.ico          ${ico.length} bytes`);
  console.log('');
}

main().catch((e) => {
  console.error(`\n  ERRO: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
