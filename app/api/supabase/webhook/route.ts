import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import reconcileUser from '@/lib/auth/reconcile';
import crypto from 'crypto';

export async function POST(request: Request) {
  const raw = await request.text();

  // Verify signature if secret configured
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get('x-supabase-signature') || request.headers.get('supabase-signature') || request.headers.get('x-signature');
    if (!header) {
      console.warn('[supabase.webhook] missing signature header');
      return NextResponse.json({ error: 'missing signature' }, { status: 401 });
    }

    const hmac = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (hmac !== header) {
      console.warn('[supabase.webhook] invalid signature', { header, hmac });
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    console.error('[supabase.webhook] invalid json', e);
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  try {
    // Extract user object from common Supabase webhook shapes
    const user = payload.user ?? payload.record ?? payload.data?.user ?? payload.data ?? null;

    if (user && user.email) {
      // name may be in user.user_metadata?.name or user.email
      const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email;
      const result = await reconcileUser(prisma, user, name);
      console.info('[supabase.webhook] reconciled user', { result });
      return NextResponse.json({ ok: true, result });
    }

    console.info('[supabase.webhook] ignored event', { type: payload.type ?? payload.event ?? null });
    return NextResponse.json({ ok: true, ignored: true });
  } catch (e: any) {
    console.error('[supabase.webhook] handler error', e?.message ?? e);
    return NextResponse.json({ error: 'handler error' }, { status: 500 });
  }
}
