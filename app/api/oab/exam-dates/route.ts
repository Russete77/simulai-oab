import { NextResponse } from 'next/server';
import { getUpcomingExams } from '@/lib/oab/exam-dates';

export async function GET() {
  try {
    console.log('📅 [API] Buscando datas de exames OAB...');

    // Apenas provas futuras, em ordem cronológica — o primeiro item é sempre
    // a próxima prova (os countdowns do dashboard e do hero usam data[0]).
    const upcomingExams = getUpcomingExams();

    console.log(`✅ [API] ${upcomingExams.length} datas de exame encontradas`);

    return NextResponse.json(upcomingExams);
  } catch (error) {
    console.error('❌ [API] Erro ao buscar datas de exame:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar datas de exame' },
      { status: 500 }
    );
  }
}
