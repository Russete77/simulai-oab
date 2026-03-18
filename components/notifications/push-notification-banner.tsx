'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { usePushNotifications } from '@/lib/notifications/use-push-notifications';
import { Button } from '@/components/ui';

/**
 * Banner que aparece no dashboard pedindo para ativar push notifications
 * Só aparece se:
 * - O browser suporta push
 * - O usuário ainda não decidiu (permission === 'default')
 * - O banner não foi dispensado recentemente
 */
export function PushNotificationBanner() {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // Start hidden
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Só mostrar se permissão ainda não foi decidida
    if (permission === 'default' && !isLoading) {
      // Verificar se foi dispensado recentemente (24h)
      const dismissedAt = localStorage.getItem('push-banner-dismissed');
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt);
        if (elapsed < 24 * 60 * 60 * 1000) {
          setDismissed(true);
          return;
        }
      }
      setDismissed(false);
    }
  }, [permission, isLoading]);

  async function handleSubscribe() {
    setSubscribing(true);
    const success = await subscribe();
    setSubscribing(false);
    if (success) {
      setDismissed(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('push-banner-dismissed', Date.now().toString());
  }

  if (dismissed || permission === 'unsupported' || permission === 'denied' || isSubscribed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm">Ative as notificações</p>
            <p className="text-navy-400 text-xs truncate">
              Receba lembretes de estudo e revisão diária
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubscribe}
            disabled={subscribing}
          >
            {subscribing ? 'Ativando...' : 'Ativar'}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 text-navy-400 hover:text-white transition-colors"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Toggle de push notifications para a página de configurações
 */
export function PushNotificationToggle() {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setToggling(false);
  }

  if (permission === 'unsupported') {
    return (
      <div className="flex items-center justify-between p-4 bg-navy-800/50 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-navy-500" />
          <div>
            <p className="text-white font-medium text-sm">Notificações Push</p>
            <p className="text-navy-500 text-xs">Seu navegador não suporta notificações push</p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-between p-4 bg-navy-800/50 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-white font-medium text-sm">Notificações Push</p>
            <p className="text-red-400 text-xs">Bloqueadas — altere nas configurações do navegador</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-navy-800/50 rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-blue-400" />
        ) : (
          <BellOff className="w-5 h-5 text-navy-400" />
        )}
        <div>
          <p className="text-white font-medium text-sm">Notificações Push</p>
          <p className="text-navy-400 text-xs">
            {isSubscribed
              ? 'Lembretes de estudo e revisão ativados'
              : 'Receba lembretes de estudo e revisão diária'}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isLoading || toggling}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          isSubscribed ? 'bg-blue-500' : 'bg-navy-700'
        } ${isLoading || toggling ? 'opacity-50' : ''}`}
        aria-label={isSubscribed ? 'Desativar notificações' : 'Ativar notificações'}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            isSubscribed ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
