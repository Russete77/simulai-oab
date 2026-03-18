import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Subject } from '@prisma/client';

// Subject labels in Portuguese
const SUBJECT_LABELS: Record<Subject, string> = {
  ETHICS: 'Ética Profissional',
  CONSTITUTIONAL: 'Direito Constitucional',
  CIVIL: 'Direito Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Direito Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Direito do Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Direito Administrativo',
  TAXES: 'Direito Tributário',
  BUSINESS: 'Direito Empresarial',
  CONSUMER: 'Direito do Consumidor',
  ENVIRONMENTAL: 'Direito Ambiental',
  CHILDREN: 'Estatuto da Criança e Adolescente',
  INTERNATIONAL: 'Direito Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Conhecimentos Gerais',
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const plan = await prisma.studyPlan.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    // Calculate progress for the current week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyAnswers = await prisma.userAnswer.count({
      where: {
        userId: user.id,
        createdAt: { gte: weekStart },
      },
    });

    return NextResponse.json({
      plan: {
        ...plan,
        weeklyProgress: weeklyAnswers,
        weeklyPercentage: Math.min(Math.round((weeklyAnswers / plan.weeklyGoal) * 100), 100),
      },
    });
  } catch (error) {
    console.error('Study plan GET error:', error);
    return NextResponse.json({ error: 'Erro ao buscar plano' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { targetExamDate } = body;

    // Fetch performance by subject
    const answers = await prisma.userAnswer.findMany({
      where: { userId: user.id },
      select: {
        isCorrect: true,
        question: { select: { subject: true } },
      },
    });

    // Aggregate by subject
    const subjectMap = new Map<Subject, { total: number; correct: number }>();
    for (const answer of answers) {
      const subject = answer.question.subject;
      const existing = subjectMap.get(subject) || { total: 0, correct: 0 };
      existing.total++;
      if (answer.isCorrect) existing.correct++;
      subjectMap.set(subject, existing);
    }

    // Find weak subjects (< 60% accuracy or not studied)
    const allSubjects = Object.values(Subject).filter(s => s !== 'GENERAL') as Subject[];
    const weakSubjects: Subject[] = [];
    const subjectAnalysis: Array<{ subject: Subject; label: string; accuracy: number; total: number }> = [];

    for (const subject of allSubjects) {
      const stats = subjectMap.get(subject);
      const accuracy = stats ? Math.round((stats.correct / stats.total) * 100) : 0;
      const total = stats?.total || 0;

      subjectAnalysis.push({
        subject,
        label: SUBJECT_LABELS[subject],
        accuracy,
        total,
      });

      if (!stats || accuracy < 60) {
        weakSubjects.push(subject);
      }
    }

    // Sort by accuracy (weakest first)
    subjectAnalysis.sort((a, b) => a.accuracy - b.accuracy);

    // Focus on top 5 weakest subjects
    const focusSubjects = weakSubjects.slice(0, 5);

    // Calculate weekly goal based on exam date
    let weeklyGoal = 50; // default
    if (targetExamDate) {
      const examDate = new Date(targetExamDate);
      const now = new Date();
      const weeksUntilExam = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));
      // Target: answer at least 2000 questions before exam
      weeklyGoal = Math.min(200, Math.max(30, Math.ceil(2000 / weeksUntilExam)));
    }

    // Generate plan description
    const weakLabels = focusSubjects.slice(0, 3).map(s => SUBJECT_LABELS[s]).join(', ');
    const overallAccuracy = answers.length > 0
      ? Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100)
      : 0;

    const description = focusSubjects.length > 0
      ? `Foco nas matérias mais fracas: ${weakLabels}. Taxa de acerto geral: ${overallAccuracy}%. Meta: ${weeklyGoal} questões/semana.`
      : `Plano de manutenção — taxa de acerto geral: ${overallAccuracy}%. Continue praticando todas as matérias.`;

    // Deactivate existing plans
    await prisma.studyPlan.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    // Create new plan
    const plan = await prisma.studyPlan.create({
      data: {
        userId: user.id,
        name: `Plano Personalizado — ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        description,
        targetExamDate: targetExamDate ? new Date(targetExamDate) : null,
        weeklyGoal,
        focusSubjects,
        isActive: true,
      },
    });

    return NextResponse.json({
      plan,
      analysis: subjectAnalysis,
    });
  } catch (error) {
    console.error('Study plan POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 });
  }
}
