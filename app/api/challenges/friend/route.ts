import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

interface Participant {
  userId: string;
  name: string;
  score?: number;
  completed: boolean;
}

/**
 * POST /api/challenges/friend
 * Cria um desafio novo. Antes exigia assinatura paga (requirePaidUser) —
 * agora qualquer usuário logado pode criar, pra não travar o loop viral
 * atrás de um paywall duplo (login + pagamento).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { code, type } = body;

    if (!code || !type) {
      return NextResponse.json({ error: 'Code and type are required' }, { status: 400 });
    }

    const normalizedCode = String(code).toUpperCase();

    const existing = await prisma.friendChallenge.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }

    const creatorName = user.name || 'Anônimo';
    const participants: Participant[] = [
      { userId: user.id, name: creatorName, completed: false },
    ];

    const challenge = await prisma.friendChallenge.create({
      data: {
        code: normalizedCode,
        type,
        creatorId: user.id,
        creatorName,
        participants: participants as unknown as object,
      },
    });

    return NextResponse.json({
      code: challenge.code,
      type: challenge.type,
      creatorName: challenge.creatorName,
      createdAt: challenge.createdAt,
      participants,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    logger.error('Error creating challenge', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

/**
 * GET /api/challenges/friend?code=ABC123
 * Visitante ANÔNIMO pode ver o desafio (preview público — é o que faz o
 * link ser compartilhável de verdade). Só usuário logado é adicionado como
 * participante ao visualizar.
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const challenge = await prisma.friendChallenge.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    let participants = challenge.participants as unknown as Participant[];

    // Só tenta entrar como participante se houver sessão — visitante anônimo
    // vê o desafio (preview) sem ser adicionado.
    const user = await getCurrentUser();
    if (user) {
      const isParticipant = participants.some((p) => p.userId === user.id);
      if (!isParticipant) {
        participants = [...participants, { userId: user.id, name: user.name || 'Anônimo', completed: false }];
        await prisma.friendChallenge.update({
          where: { code: challenge.code },
          data: { participants: participants as unknown as object },
        });
      }
    }

    return NextResponse.json({
      code: challenge.code,
      type: challenge.type,
      creatorName: challenge.creatorName,
      createdAt: challenge.createdAt,
      isAuthenticated: !!user,
      participants: participants.map((p) => ({ name: p.name, score: p.score, completed: p.completed })),
    });
  } catch (error) {
    logger.error('Error fetching challenge', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

/**
 * PUT /api/challenges/friend?code=ABC123
 * Submeter score — exige sessão (precisa saber de quem é o resultado).
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const body = await request.json();
    const { score } = body;

    const challenge = await prisma.friendChallenge.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const participants = challenge.participants as unknown as Participant[];
    const participant = participants.find((p) => p.userId === user.id);

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    participant.completed = true;
    if (score !== undefined) {
      participant.score = Math.round(score);
    }

    await prisma.friendChallenge.update({
      where: { code: challenge.code },
      data: { participants: participants as unknown as object },
    });

    return NextResponse.json({
      code: challenge.code,
      type: challenge.type,
      creatorName: challenge.creatorName,
      participants: participants.map((p) => ({ name: p.name, score: p.score, completed: p.completed })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    logger.error('Error updating challenge', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}
