/**
 * GET /api/atividade
 *
 * O pulso do app para a página de ranking. Público, como a página.
 *
 * Tem cache de 20s em memória porque a tela pergunta a cada 30s: sem isso,
 * cada aba aberta viraria três consultas ao banco a cada meio minuto, e o
 * pool de produção é de uma conexão por instância.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { lerPulso, type Pulso } from '@/lib/atividade/pulso';

const CACHE_MS = 20_000;

let cache: { em: number; dados: Pulso } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.em < CACHE_MS) {
      return NextResponse.json(cache.dados, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const dados = await lerPulso();
    cache = { em: Date.now(), dados };

    return NextResponse.json(dados, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[ATIVIDADE]', { error: message });
    // Falhar aqui não pode derrubar o ranking: a tela some com o bloco.
    return NextResponse.json({ error: 'Indisponível' }, { status: 503 });
  }
}
