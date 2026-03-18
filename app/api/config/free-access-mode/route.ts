import { NextResponse } from 'next/server';
import { getFreeAccessModeData } from '@/lib/billing/free-access-mode';

export async function GET() {
  return NextResponse.json(getFreeAccessModeData());
}
