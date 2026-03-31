'use client';

import { useEffect, useState } from 'react';
import { X, Clock, Sparkles, Zap, Gift, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FreeAccessModeData {
  enabled: boolean;
  message: string | null;
  endDate: string | null;
  daysLeft: number | null;
  isNearingEnd: boolean;
}

export function FreeAccessBanner() {
  const [data, setData] = useState<FreeAccessModeData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar se já foi dismissed nesta sessão
    const wasDismissed = sessionStorage.getItem('free-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Buscar dados do modo gratuito via API
    fetch('/api/config/free-access-mode')
      .then(res => res.json())
      .then((apiData: FreeAccessModeData) => {
        console.log('[FREE_BANNER] Dados da API:', apiData);
        if (apiData.enabled) {
          setData(apiData);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('free-banner-dismissed', 'true');
  };

  if (!data || !data.message || dismissed) return null;

  // Define estilo do banner baseado na urgência
  const isLastDay = data.daysLeft !== null && data.daysLeft <= 1; // 0 ou 1 dia
  const isUrgent = data.isNearingEnd && !isLastDay;

  console.log('[FREE_BANNER] Estado:', {
    daysLeft: data.daysLeft,
    isNearingEnd: data.isNearingEnd,
    isLastDay,
    isUrgent,
  });

  const getBannerColors = () => {
    if (isLastDay) {
      return {
        bg: 'from-red-600 via-red-500 to-orange-600',
        badge: 'bg-red-900/80 border-red-500/50',
        badgeText: 'text-red-100',
        button: 'bg-white text-red-600 hover:bg-red-50',
        pulse: true,
      };
    }
    if (isUrgent) {
      return {
        bg: 'from-amber-600 via-yellow-500 to-orange-500',
        badge: 'bg-amber-900/80 border-amber-400/50',
        badgeText: 'text-amber-100',
        button: 'bg-white text-amber-600 hover:bg-amber-50',
        pulse: false,
      };
    }
    return {
      bg: 'from-emerald-600 via-green-500 to-teal-600',
      badge: 'bg-emerald-900/80 border-emerald-400/50',
      badgeText: 'text-emerald-100',
      button: 'bg-white text-emerald-600 hover:bg-emerald-50',
      pulse: false,
    };
  };

  const colors = getBannerColors();

  const formatEndDate = () => {
    if (!data.endDate) return '';
    const date = new Date(data.endDate);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className={`relative bg-gradient-to-r ${colors.bg} text-white overflow-hidden ${colors.pulse ? 'animate-pulse' : ''}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20px 20px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Shimmer Effect */}
          {!isLastDay && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <div className="relative max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Content */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Icon Badge */}
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className={`hidden sm:flex items-center justify-center w-12 h-12 rounded-xl ${colors.badge} border backdrop-blur-sm flex-shrink-0`}
                >
                  {isLastDay ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : isUrgent ? (
                    <Clock className="w-6 h-6 text-white" />
                  ) : (
                    <Gift className="w-6 h-6 text-white" />
                  )}
                </motion.div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge} border backdrop-blur-sm`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>PREMIUM GRATUITO</span>
                    </motion.div>

                    {data.daysLeft !== null && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full"
                      >
                        <Clock className="w-3 h-3" />
                        {data.daysLeft === 0 ? (
                          <span>ÚLTIMO DIA!</span>
                        ) : data.daysLeft === 1 ? (
                          <span>Termina amanhã</span>
                        ) : (
                          <span>Faltam {data.daysLeft} dias</span>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm md:text-base font-medium text-white/95 leading-snug"
                  >
                    {data.daysLeft !== null ? (
                      <>
                        Aproveite <strong className="font-bold">todos os recursos premium</strong> até{' '}
                        <strong className="font-bold">{formatEndDate()}</strong>
                      </>
                    ) : (
                      <>
                        Aproveite <strong className="font-bold">todos os recursos premium</strong> por tempo limitado
                      </>
                    )}
                  </motion.p>

                  {isUrgent && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs text-white/80 mt-1 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Garanta o Premium com desconto antes que termine!
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Right Side - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isUrgent && (
                  <motion.a
                    href="/pricing"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm ${colors.button} shadow-lg transition-all duration-200`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Ver Planos
                  </motion.a>
                )}

                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  aria-label="Fechar banner"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom Progress Bar for Last Days */}
          {data.daysLeft !== null && data.daysLeft <= 14 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${((14 - data.daysLeft) / 14) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
