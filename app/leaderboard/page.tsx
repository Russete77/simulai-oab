import { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { LeaderboardClient, type LeaderboardData } from './leaderboard-client';

// Página pública e indexável: o ranking é renderizado no servidor (ISR a cada
// 5 min). Antes era 'use client' e buscava via /api/leaderboard (que exige
// auth), então o Google indexava uma página vazia.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Ranking Global — Os melhores estudantes de OAB | Simulai OAB',
  description:
    'Veja o ranking dos estudantes que mais pontuam estudando para a 1ª fase da OAB no Simulai OAB. Compare pontos, nível, sequência de dias e taxa de acerto.',
  alternates: { canonical: 'https://simulaioab.com/leaderboard' },
  openGraph: {
    title: 'Ranking Global de Estudantes de OAB — Simulai OAB',
    description:
      'Os estudantes que mais pontuam na preparação para a 1ª fase da OAB. Veja onde você se compara.',
    type: 'website',
    url: 'https://simulaioab.com/leaderboard',
  },
};

// Ranking público (sem dados do usuário logado). Não expõe e-mail no HTML.
async function getPublicLeaderboard(limit: number): Promise<LeaderboardData> {
  const [topUsers, totalUsers, averagePointsResult] = await Promise.all([
    prisma.userProfile.findMany({
      select: {
        id: true,
        userId: true,
        totalPoints: true,
        streak: true,
        level: true,
        totalQuestions: true,
        correctAnswers: true,
        user: { select: { name: true } },
      },
      orderBy: [
        { totalPoints: 'desc' },
        { level: 'desc' },
        { streak: 'desc' },
      ],
      take: limit,
    }),
    prisma.userProfile.count(),
    prisma.userProfile.aggregate({ _avg: { totalPoints: true } }),
  ]);

  const leaderboard = topUsers.map((profile, index) => ({
    rank: index + 1,
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name || 'Usuário',
    email: '',
    totalPoints: profile.totalPoints,
    level: profile.level,
    streak: profile.streak,
    correctAnswers: profile.correctAnswers,
    totalQuestions: profile.totalQuestions,
    isCurrentUser: false,
  }));

  return {
    leaderboard,
    currentUserRank: null,
    stats: {
      totalUsers,
      averagePoints: Math.round(averagePointsResult._avg.totalPoints || 0),
      topScore: leaderboard[0]?.totalPoints || 0,
    },
  };
}

export default async function LeaderboardPage() {
  const initialData = await getPublicLeaderboard(50);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ranking Global de Estudantes — Simulai OAB',
    numberOfItems: initialData.leaderboard.length,
    itemListElement: initialData.leaderboard.slice(0, 10).map((u) => ({
      '@type': 'ListItem',
      position: u.rank,
      name: u.name,
    })),
  };

  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaderboardClient initialData={initialData} />
      </div>
    </div>
  );
}
