'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import {
  Trophy,
  Star,
  Flame,
  Target,
  BookOpen,
  Share2,
  Crown,
  Medal,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  User,
} from 'lucide-react';
import Link from 'next/link';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: string;
}

interface ProfileData {
  id: string;
  name: string;
  memberSince: string;
  stats: {
    totalPoints: number;
    level: number;
    streak: number;
    totalQuestions: number;
    accuracy: number;
    rank: number;
  };
  achievements: Achievement[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/profile/${userId}`);

        if (!res.ok) {
          setError('Perfil não encontrado');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        setError('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  async function handleShare() {
    const profileUrl = `${window.location.origin}/perfil/${userId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profile?.name}`,
          text: `Veja o perfil de ${profile?.name} no SimulaIOAB!`,
          url: profileUrl,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(profileUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar URL:', err);
      }
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card variant="glass" className="p-8 text-center">
            <div className="p-4 bg-red-500/10 rounded-2xl w-fit mx-auto mb-4">
              <User className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-ink-1 mb-2">Perfil não encontrado</h2>
            <p className="text-ink-2 mb-6">{error || 'O perfil que você procura não existe.'}</p>
            <Link href="/">
              <Button variant="primary">
                <span className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Voltar ao início
                </span>
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const getRankBadge = () => {
    if (profile.stats.rank === 1) {
      return <Crown className="w-8 h-8 text-yellow-400" />;
    }
    if (profile.stats.rank === 2) {
      return <Medal className="w-8 h-8 text-gray-400" />;
    }
    if (profile.stats.rank === 3) {
      return <Medal className="w-8 h-8 text-amber-600" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-accent hover:text-accent transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </Link>
        </div>

        {/* Profile Card */}
        <Card variant="glass" className="p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-accent-soft rounded-2xl">
                <User className="w-16 h-16 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-ink-1">{profile.name}</h1>
                  <div className="flex items-center gap-1 px-3 py-1 bg-accent-soft rounded-full border-accent">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-accent">Nível {profile.stats.level}</span>
                  </div>
                </div>
                <p className="text-ink-2 text-sm">
                  Membro desde {formatDate(profile.memberSince)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                {getRankBadge()}
                <div>
                  <p className="text-3xl font-bold text-ink-1">#{profile.stats.rank}</p>
                  <p className="text-sm text-ink-2">Ranking</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className={`transition-all ${shareSuccess ? 'bg-green-500/10 border-green-500/20' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {shareSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Compartilhar
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {/* Points */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-2 text-sm font-medium">Pontos</span>
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-ink-1">{profile.stats.totalPoints.toLocaleString()}</p>
          </Card>

          {/* Level */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-2 text-sm font-medium">Nível</span>
              <Star className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-bold text-ink-1">{profile.stats.level}</p>
          </Card>

          {/* Streak */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-2 text-sm font-medium">Sequência</span>
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-ink-1">{profile.stats.streak}</p>
          </Card>

          {/* Questions */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-2 text-sm font-medium">Questões</span>
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-ink-1">{profile.stats.totalQuestions}</p>
          </Card>

          {/* Accuracy */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-2 text-sm font-medium">Acurácia</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-ink-1">{profile.stats.accuracy}%</p>
          </Card>

          {/* Rank */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-2 text-sm font-medium">Posição</span>
              <Crown className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-ink-1">#{profile.stats.rank}</p>
          </Card>
        </div>

        {/* Achievements */}
        {profile.achievements.length > 0 && (
          <Card variant="glass" className="p-8">
            <h2 className="text-2xl font-bold text-ink-1 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Conquistas ({profile.achievements.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {profile.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="p-4 bg-surface-2 rounded-xl border-divider hover:border transition-all hover:bg-surface-2/70 text-center group"
                  title={achievement.description}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="text-xs font-semibold text-ink-1 line-clamp-2 group-hover:line-clamp-none transition-all mb-2">
                    {achievement.name}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-ink-2">{achievement.points}</span>
                  </div>
                  <p className="text-xs text-ink-3 mt-2">
                    {formatDate(achievement.unlockedAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
