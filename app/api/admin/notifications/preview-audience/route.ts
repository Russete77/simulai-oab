import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { countAudience, AudienceFilter } from '@/lib/notifications/targeting';

/**
 * POST /api/admin/notifications/preview-audience
 *   body: AudienceFilter (subscriptionStatus, planType, daysSinceSignup, lastActiveDays)
 *
 * Retorna { count }
 */
export async function POST(req: NextRequest) {
  await requireAdmin();
  const filter = (await req.json().catch(() => ({}))) as AudienceFilter;
  const count = await countAudience(filter);
  return NextResponse.json({ count });
}
