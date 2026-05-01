import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  grantGracePeriod,
  cancelSubscriptionAdmin,
  reactivateSubscriptionAdmin,
} from '@/lib/admin/subscriptions';

/**
 * POST /api/admin/subscriptions/:id/action
 *
 * Body:
 *   { action: 'grant_grace', days: number }
 *   { action: 'cancel', reason: string }
 *   { action: 'reactivate' }
 *
 * Toda ação grava AdminAudit.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') {
    return NextResponse.json(
      { ok: false, message: 'Body inválido — action obrigatório' },
      { status: 400 }
    );
  }

  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;

  try {
    switch (body.action) {
      case 'grant_grace': {
        const days = Number(body.days);
        if (!Number.isFinite(days) || days <= 0 || days > 90) {
          return NextResponse.json(
            { ok: false, message: 'Days deve ser entre 1 e 90' },
            { status: 400 }
          );
        }
        const result = await grantGracePeriod(id, days, admin.email, ipAddress);
        return NextResponse.json(result, { status: result.ok ? 200 : 400 });
      }

      case 'cancel': {
        const reason = String(body.reason || '').trim();
        if (!reason) {
          return NextResponse.json(
            { ok: false, message: 'Reason é obrigatório' },
            { status: 400 }
          );
        }
        const result = await cancelSubscriptionAdmin(id, reason, admin.email, ipAddress);
        return NextResponse.json(result, { status: result.ok ? 200 : 400 });
      }

      case 'reactivate': {
        const result = await reactivateSubscriptionAdmin(id, admin.email, ipAddress);
        return NextResponse.json(result, { status: result.ok ? 200 : 400 });
      }

      default:
        return NextResponse.json(
          { ok: false, message: `Ação desconhecida: ${body.action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ADMIN_SUB_ACTION]', error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
