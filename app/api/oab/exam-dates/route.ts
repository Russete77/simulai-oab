import { NextResponse } from 'next/server';

interface OABExamDate {
  id: string;
  name: string;
  date: string;
  phase: number;
}

// Datas oficiais do calendário FGV/OAB 2026-2027
// Fonte: https://oab.estrategia.com/portal/quais-as-datas-dos-editais-da-oab-46-47-e-48/
// Atualizado em 22/04/2026 — corrige dados desatualizados (41-43) para os exames
// reais do ciclo atual (46, 47, 48).
const OAB_EXAM_DATES: OABExamDate[] = [
  {
    id: '46',
    name: '46º Exame de Ordem',
    date: '2026-05-03T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '46-2',
    name: '46º Exame de Ordem - 2ª Fase',
    date: '2026-06-21T13:00:00-03:00',
    phase: 2,
  },
  {
    id: '47',
    name: '47º Exame de Ordem',
    date: '2026-08-30T13:00:00-03:00',
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
    date: '2026-12-20T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '48-2',
    name: '48º Exame de Ordem - 2ª Fase',
    date: '2027-02-21T13:00:00-03:00',
    phase: 2,
  },
];

export async function GET() {
  try {
    console.log('📅 [API] Buscando datas de exames OAB...');

    // Get current date and time
    const now = new Date();

    // Sort by date and filter only future exams (or upcoming)
    const upcomingExams = OAB_EXAM_DATES.filter((exam) => {
      const examDate = new Date(exam.date);
      return examDate > now;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    // Also include current exams that haven't finished yet (started today or started but ongoing)
    const currentAndUpcoming = OAB_EXAM_DATES.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    }).filter((exam) => {
      const examDate = new Date(exam.date);
      // Show exams that started less than 30 days ago or are in the future
      const daysSinceExam = (now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceExam < 30;
    });

    console.log(`✅ [API] ${currentAndUpcoming.length} datas de exame encontradas`);

    return NextResponse.json(currentAndUpcoming);
  } catch (error) {
    console.error('❌ [API] Erro ao buscar datas de exame:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar datas de exame' },
      { status: 500 }
    );
  }
}
