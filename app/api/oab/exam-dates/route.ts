import { NextResponse } from 'next/server';

interface OABExamDate {
  id: string;
  name: string;
  date: string;
  phase: number;
}

// Datas oficiais do calendário FGV/OAB 2026-2027
// Fontes: https://oab.estrategia.com/portal/calendario-oab/
//         https://www.provadaordem.com.br/blog/post/calendario-oab-2026/
// Atualizado em 04/07/2026 — 46º já realizado (1ª fase 03/05, 2ª fase 21/06);
// 47º e 48º corrigidos para o cronograma vigente; 49º adicionado.
// Datas sujeitas a alteração pela banca — revisar a cada novo edital.
const OAB_EXAM_DATES: OABExamDate[] = [
  {
    id: '47',
    name: '47º Exame de Ordem',
    date: '2026-09-06T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '47-2',
    name: '47º Exame de Ordem - 2ª Fase',
    date: '2026-10-18T13:00:00-03:00',
    phase: 2,
  },
  {
    id: '48',
    name: '48º Exame de Ordem',
    date: '2027-01-10T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '48-2',
    name: '48º Exame de Ordem - 2ª Fase',
    date: '2027-02-28T13:00:00-03:00',
    phase: 2,
  },
  {
    id: '49',
    name: '49º Exame de Ordem',
    date: '2027-05-09T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '49-2',
    name: '49º Exame de Ordem - 2ª Fase',
    date: '2027-07-04T13:00:00-03:00',
    phase: 2,
  },
];

export async function GET() {
  try {
    console.log('📅 [API] Buscando datas de exames OAB...');

    const now = new Date();

    // Apenas provas futuras, em ordem cronológica — o primeiro item é sempre
    // a próxima prova (os countdowns do dashboard e do hero usam data[0]).
    // A janela antiga de "até 30 dias no passado" fazia o countdown travar
    // em prova já realizada, exibindo edição atrasada pro usuário.
    const upcomingExams = [...OAB_EXAM_DATES]
      .filter((exam) => new Date(exam.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
