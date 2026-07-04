/**
 * GET /api/review/srs — Buscar cards de revisão pendentes
 * POST /api/review/srs — Registrar resultado de revisão
 */
import { NextRequest, NextResponse } from 'next/server';
import { requirePaidUser, handlePaymentRequired } from '@/lib/auth';
import { getDueReviewCards, recordReview, getSRSStats } from '@/lib/srs/service';
import { createError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await requirePaidUser();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getSRSStats(user.id);
      return NextResponse.json(stats);
    }

    const [cards, stats] = await Promise.all([
      getDueReviewCards(user.id, limit),
      getSRSStats(user.id),
    ]);

    logger.debug('SRS review cards retrieved', {
      userId: user.id,
      cardCount: cards.length,
      dueCards: stats.dueCards,
    });

    return NextResponse.json({ cards, stats });
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    logger.error('SRS GET error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      createError('DATABASE_ERROR').toJSON(),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePaidUser();
    const body = await req.json();
    const { questionId, isCorrect, timeSpent } = body;

    if (!questionId || typeof isCorrect !== 'boolean' || typeof timeSpent !== 'number') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const card = await recordReview(user.id, questionId, isCorrect, timeSpent);

    if (!card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }

    logger.info('SRS review recorded', {
      userId: user.id,
      questionId,
      isCorrect,
      nextReviewAt: card.nextReviewAt,
    });

    return NextResponse.json({
      success: true,
      nextReviewAt: card.nextReviewAt,
      interval: card.interval,
    });
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    logger.error('SRS POST error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      createError('DATABASE_ERROR').toJSON(),
      { status: 500 }
    );
  }
}
