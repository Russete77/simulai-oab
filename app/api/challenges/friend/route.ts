import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// In-memory store for challenges (reset on server restart)
// In production, this should be stored in a database
const challengeStore = new Map<
  string,
  {
    code: string;
    type: string;
    creatorId: string;
    creatorName: string;
    createdAt: string;
    participants: Array<{
      userId: string;
      name: string;
      score?: number;
      completed: boolean;
    }>;
  }
>();

/**
 * POST /api/challenges/friend
 * Create a new friend challenge
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, type } = body;

    if (!code || !type) {
      return NextResponse.json({ error: 'Code and type are required' }, { status: 400 });
    }

    // Check if code already exists
    if (challengeStore.has(code)) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }

    // Create challenge
    const challenge = {
      code,
      type,
      creatorId: user.id,
      creatorName: user.name || 'Anonymous',
      createdAt: new Date().toISOString(),
      participants: [
        {
          userId: user.id,
          name: user.name || 'Anonymous',
          completed: false,
        },
      ],
    };

    challengeStore.set(code, challenge);

    return NextResponse.json({
      code,
      type,
      creatorName: challenge.creatorName,
      createdAt: challenge.createdAt,
      participants: challenge.participants,
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

/**
 * GET /api/challenges/friend?code=ABC123
 * Get challenge details and join if not already a participant
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const challenge = challengeStore.get(code.toUpperCase());

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Add user as participant if not already a participant
    const isParticipant = challenge.participants.some((p) => p.userId === user.id);

    if (!isParticipant) {
      challenge.participants.push({
        userId: user.id,
        name: user.name || 'Anonymous',
        completed: false,
      });
    }

    return NextResponse.json({
      code: challenge.code,
      type: challenge.type,
      creatorName: challenge.creatorName,
      createdAt: challenge.createdAt,
      participants: challenge.participants.map((p) => ({
        name: p.name,
        score: p.score,
        completed: p.completed,
      })),
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

/**
 * PUT /api/challenges/friend?code=ABC123
 * Update challenge (mark as completed, submit score)
 */
export async function PUT(request: NextRequest) {
  const user = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const body = await request.json();
    const { score } = body;

    const challenge = challengeStore.get(code.toUpperCase());

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Update participant score
    const participant = challenge.participants.find((p) => p.userId === user.id);

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    participant.completed = true;
    if (score !== undefined) {
      participant.score = Math.round(score);
    }

    return NextResponse.json({
      code: challenge.code,
      type: challenge.type,
      creatorName: challenge.creatorName,
      participants: challenge.participants.map((p) => ({
        name: p.name,
        score: p.score,
        completed: p.completed,
      })),
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}
