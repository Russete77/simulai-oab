'use client';

import { useState, useEffect, useCallback } from 'react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsReturn {
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

/**
 * Hook para gerenciar push notifications PWA
 * Registra o service worker de push e gerencia a subscription
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSupport();
  }, []);

  async function checkSupport() {
    // Verificar se o browser suporta push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      setIsLoading(false);
      return;
    }

    // Verificar permissão atual
    const currentPermission = Notification.permission as PermissionState;
    setPermission(currentPermission);

    // Verificar se já está inscrito
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Erro ao verificar subscription:', err);
    }

    setIsLoading(false);
  }

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Registrar o SW de push (separado do workbox SW)
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;

      // Solicitar permissão
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result !== 'granted') {
        setIsLoading(false);
        return false;
      }

      // Buscar VAPID public key
      const vapidRes = await fetch('/api/notifications/vapid');
      if (!vapidRes.ok) {
        console.error('VAPID key not configured');
        setIsLoading(false);
        return false;
      }
      const { publicKey } = await vapidRes.json();

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Enviar para o server
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Erro ao se inscrever:', err);
      setIsLoading(false);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remover do server
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Desinscrever localmente
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Erro ao desinscrever:', err);
      setIsLoading(false);
      return false;
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}

/**
 * Converte VAPID key de base64 URL-safe para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
