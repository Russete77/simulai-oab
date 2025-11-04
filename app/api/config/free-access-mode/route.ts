import { NextResponse } from 'next/server';
import { isFreeAccessModeEnabled, getFreeAccessModeMessage } from '@/lib/billing/free-access-mode';

export async function GET() {
  return NextResponse.json({
    enabled: isFreeAccessModeEnabled(),
    message: getFreeAccessModeMessage(),
  });
}
