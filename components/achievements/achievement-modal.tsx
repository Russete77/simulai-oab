'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Trophy, X, Sparkles } from 'lucide-react';

interface Achievement {
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface AchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
    }
  }, [achievement]);

  if (!achievement) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="glass" className="max-w-md w-full relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-purple-500/20 animate-pulse-slow" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-navy-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-navy-400" />
          </button>

          <div className="relative p-8 text-center">
            {/* Trophy icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full border-2 border-yellow-500/50">
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Achievement unlocked */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider">Conquista Desbloqueada!</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {achievement.icon} {achievement.name}
              </h2>
              <p className="text-navy-400 mb-4">{achievement.description}</p>
            </div>

            {/* Points */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-blue-400 font-bold">+{achievement.points}</span>
              <span className="text-navy-400">pontos</span>
            </div>

            {/* Continue button */}
            <Button variant="primary" onClick={handleClose} className="w-full">
              Continuar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
