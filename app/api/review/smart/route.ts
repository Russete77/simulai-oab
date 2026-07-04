import { NextRequest, NextResponse } from 'next/server';
import { requirePaidUser, handlePaymentRequired } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requirePaidUser();
    const limit = 10;

    // 1. Try to get SRS due cards first
    const now = new Date();
    let srsCards: any[] = [];

    try {
      srsCards = await prisma.reviewCard.findMany({
        where: { userId: user.id, nextReviewAt: { lte: now } },
        include: {
          question: {
            include: { alternatives: { orderBy: { label: 'asc' } } },
          },
        },
        orderBy: { nextReviewAt: 'asc' },
        take: limit,
      });
    } catch {
      // ReviewCard table might not exist yet - that's OK
    }

    // 2. If not enough SRS cards, fill with recent wrong answers
    const remaining = limit - srsCards.length;
    let wrongQuestions: any[] = [];

    if (remaining > 0) {
      const srsQuestionIds = srsCards.map(c => c.questionId);

      // Get recent wrong answers not already in SRS queue
      const recentWrong = await prisma.userAnswer.findMany({
        where: {
          userId: user.id,
          isCorrect: false,
          questionId: { notIn: srsQuestionIds },
        },
        distinct: ['questionId'],
        orderBy: { createdAt: 'desc' },
        take: remaining,
        include: {
          question: {
            include: { alternatives: { orderBy: { label: 'asc' } } },
          },
        },
      });

      wrongQuestions = recentWrong;
    }

    // Combine and format
    const reviewQuestions = [
      ...srsCards.map(card => ({
        ...card.question,
        reviewSource: 'srs' as const,
        reviewCardId: card.id,
        interval: card.interval,
        repetitions: card.repetitions,
      })),
      ...wrongQuestions.map(wa => ({
        ...wa.question,
        reviewSource: 'wrong_answer' as const,
        reviewCardId: null,
        interval: 0,
        repetitions: 0,
      })),
    ];

    // Count totals
    let srsCount = 0;
    try {
      srsCount = await prisma.reviewCard.count({
        where: { userId: user.id, nextReviewAt: { lte: now } },
      });
    } catch {
      /* table might not exist */
    }

    const wrongCount = await prisma.userAnswer.count({
      where: { userId: user.id, isCorrect: false },
    });

    return NextResponse.json({
      questions: reviewQuestions,
      stats: {
        srsCards: srsCount,
        wrongAnswers: wrongCount,
        totalReview: srsCount + wrongCount,
      },
    });
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    console.error('Smart review error:', error);
    return NextResponse.json({ error: 'Erro ao buscar revisão' }, { status: 500 });
  }
}
