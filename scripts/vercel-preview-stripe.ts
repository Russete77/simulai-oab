/**
 * Leva as chaves de TESTE da Stripe para o ambiente Preview da Vercel.
 *
 * POR QUE ISTO EXISTE
 *
 * A validação de env roda em `next build`, e a Vercel builda um preview para
 * cada PR. Sem as variáveis da Stripe em Preview, todo preview falha no
 * build. E preview precisa das de TESTE, não das live: toda branch vira uma
 * URL pública, e com chave live um teste vira cobrança em cartão de verdade.
 *
 * Os valores saem do `.env.local` e vão pela entrada padrão do processo —
 * não viram argumento de linha de comando, então não aparecem no histórico
 * do shell nem na lista de processos.
 *
 * COMO USAR (no SEU terminal, que é o logado na conta certa)
 *
 *   npx tsx scripts/vercel-preview-stripe.ts             # seco
 *   npx tsx scripts/vercel-preview-stripe.ts --aplicar   # para valer
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const APLICAR = process.argv.includes('--aplicar');
const AMBIENTE = 'preview';
const ORIGEM = path.join(process.cwd(), '.env.local');

/** `sensivel: true` = write-only na Vercel, ninguém lê o valor de volta. */
const VARIAVEIS = [
  { nome: 'STRIPE_SECRET_KEY', prefixo: 'sk_test_', sensivel: true },
  { nome: 'STRIPE_WEBHOOK_SECRET', prefixo: 'whsec_', sensivel: true },
  // Publicável por design: vai para o browser montar o Payment Element.
  { nome: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', prefixo: 'pk_test_', sensivel: false },
];

function mascara(v: string) {
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
  if (!fs.existsSync(ORIGEM)) throw new Error('Não achei .env.local.');
  const texto = fs.readFileSync(ORIGEM, 'utf8');

  const achadas = VARIAVEIS.map((v) => ({
    ...v,
    valor:
      texto.match(new RegExp(`^\\s*${v.nome}\\s*=\\s*(.+?)\\s*$`, 'm'))?.[1] ?? '',
  }));

  const faltando = achadas.filter((v) => !v.valor);
  if (faltando.length) {
    throw new Error(
      `Faltam no .env.local: ${faltando.map((v) => v.nome).join(', ')}`
    );
  }

  // Trava que importa: chave live num ambiente de preview cobra cartão de
  // verdade quando alguém abre a URL de uma branch.
  const live = achadas.filter((v) => v.valor.includes('_live_'));
  if (live.length) {
    throw new Error(
      `${live.map((v) => v.nome).join(', ')} tem chave LIVE. ` +
        'Preview é público — só chave de teste aqui.'
    );
  }

  const erradas = achadas.filter((v) => !v.valor.startsWith(v.prefixo));
  if (erradas.length) {
    throw new Error(
      erradas
        .map((v) => `${v.nome} deveria começar com ${v.prefixo}`)
        .join('; ')
    );
  }

  console.log('');
  console.log(`  origem    .env.local`);
  console.log(`  destino   ${AMBIENTE}`);
  console.log(`  ação      ${APLICAR ? 'APLICANDO' : 'SECO — não escreve nada'}`);
  console.log('');

  for (const v of achadas) {
    const etiqueta = v.sensivel ? 'sensitive' : 'legível';

    if (!APLICAR) {
      console.log(`  SERIA DEFINIDA  ${v.nome.padEnd(36)} ${mascara(v.valor)}  (${etiqueta})`);
      continue;
    }

    // `env add` não sobrescreve: reclama que a variável já existe.
    vercel(['env', 'rm', v.nome, AMBIENTE, '--yes']);

    // `--yes` e obrigatorio aqui. Depois de ler o valor do stdin, a CLI
    // ainda pergunta "Git branch?" (vazio = todas as branches de preview).
    // Sem responder, ela aborta sem criar a variavel — e mesmo assim sai
    // com codigo 0, o que fez a versao anterior deste script reportar
    // sucesso para tres variaveis que nunca existiram.
    const r = vercel(
      [
        'env',
        'add',
        v.nome,
        AMBIENTE,
        v.sensivel ? '--sensitive' : '--no-sensitive',
        '--yes',
      ],
      `${v.valor}\n`
    );

    console.log(`  enviei          ${v.nome.padEnd(36)} ${mascara(v.valor)}  (${etiqueta})`);

    // O codigo de saida NAO e confiavel aqui: no Windows a CLI e um .cmd
    // rodado por dentro do shell, e o status que volta e o do shell, nao o
    // do processo. Uma versao anterior deste script imprimiu "DEFINIDA"
    // para tres variaveis que nunca foram criadas. Por isso a conferencia
    // de verdade acontece no fim, lendo o que a Vercel diz que tem.
    const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
    if (saida) {
      for (const linha of saida.split('\n').map((l) => l.trim()).filter(Boolean)) {
        console.log(`                  | ${linha}`);
      }
    }
  }

  if (!APLICAR) {
    console.log('');
    console.log('  Para valer:  npx tsx scripts/vercel-preview-stripe.ts --aplicar');
    console.log('');
    return;
  }

  // Confere lendo de volta. Sem isto o script so sabe que "mandou".
  console.log('');
  console.log('  --- conferindo no que a Vercel realmente tem ---');

  const lista = vercel(['env', 'ls', AMBIENTE]);
  const texto2 = `${lista.stdout ?? ''}${lista.stderr ?? ''}`;
  const faltaram = achadas.filter((v) => !new RegExp(`\\b${v.nome}\\b`).test(texto2));

  for (const v of achadas) {
    const presente = !faltaram.includes(v);
    console.log(`  ${presente ? 'CONFIRMADA' : 'NAO ENTROU'}      ${v.nome}`);
  }

  console.log('');
  if (faltaram.length) {
    console.log('  Nao deu certo. Adicione pelo painel:');
    console.log('    Settings > Environment Variables > Add');
    console.log('    marcando SOMENTE Preview, com os valores de teste do .env.local.');
    process.exitCode = 1;
  } else {
    console.log('  Tudo no lugar. Agora sim: Redeploy.');
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
