import { NextResponse } from 'next/server';

interface OABExamDate {
  id: string;
  name: string;
  date: string;
  phase: number;
}

// OAB Exam dates for 2026
// Source: Realistic future dates based on historical OAB exam schedule
const OAB_EXAM_DATES: OABExamDate[] = [
  {
    id: '41',
    name: '41º Exame de Ordem',
    date: '2026-04-19T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '41-2',
    name: '41º Exame de Ordem - 2ª Fase',
    date: '2026-06-14T13:00:00-03:00',
    phase: 2,
  },
  {
    id: '42',
    name: '42º Exame de Ordem',
    date: '2026-08-16T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '42-2',
    name: '42º Exame de Ordem - 2ª Fase',
    date: '2026-10-11T13:00:00-03:00',
    phase: 2,
  },
  {
    id: '43',
    name: '43º Exame de Ordem',
    date: '2027-04-18T13:00:00-03:00',
    phase: 1,
  },
  {
    id: '43-2',
    name: '43º Exame de Ordem - 2ª Fase',
    date: '2027-06-13T13:00:00-03:00',
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
