import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { listNotifications, countUnread } from '@/lib/notifications/service';

/**
 * GET /api/notifications
 *   ?cursor=<id>&limit=20&unreadOnly=true
 *
 * Retorna { items, nextCursor, unreadCount }
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const cursor = sp.get('cursor') ?? undefined;
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') ?? '20')));
  const onlyUnread = sp.get('unreadOnly') === 'true';

  const items = await listNotifications(user.id, { cursor, limit, onlyUnread });
  const unreadCount = await countUnread(user.id);

  let nextCursor: string | null = null;
  if (items.length > limit) {
    nextCursor = items[limit].id;
    items.length = limit;
  }

  return NextResponse.json({
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      body: n.body,
      iconUrl: n.iconUrl,
      imageUrl: n.imageUrl,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      vibrate: n.vibrate,
      readAt: n.readAt,
      createdAt: n.createdAt,
      expiresAt: n.expiresAt,
    })),
    nextCursor,
    unreadCount,
  });
}
