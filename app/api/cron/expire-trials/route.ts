// DEPRECATED — sistema é payment-only, não há mais trial.
// Mantido como stub vazio até remoção física do diretório.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    status: 'deprecated',
    message: 'Trial removido. App é payment-only desde Mai/2026.',
  });
}
