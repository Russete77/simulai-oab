'use client';

import { useState } from 'react';

interface Prefs {
  pushEnabled: boolean;
  emailEnabled: boolean;
  promoEnabled: boolean;
  reminderEnabled: boolean;
  achievementEnabled: boolean;
  recoveryEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

const TOGGLES: Array<{ key: keyof Prefs; label: string; description: string; group: 'channel' | 'category' }> = [
  { key: 'pushEnabled', label: 'Push notifications', description: 'Notificações no dispositivo', group: 'channel' },
  { key: 'emailEnabled', label: 'Emails', description: 'Receber emails do app', group: 'channel' },
  { key: 'reminderEnabled', label: 'Lembretes de estudo', description: 'Manter sequência, revisões SRS', group: 'category' },
  { key: 'achievementEnabled', label: 'Conquistas', description: 'Quando desbloqueia um achievement', group: 'category' },
  { key: 'promoEnabled', label: 'Promoções', description: 'Descontos e ofertas especiais', group: 'category' },
  { key: 'recoveryEnabled', label: 'Mensagens de recuperação', description: 'Lembretes pra voltar a estudar', group: 'category' },
];

export function PreferencesForm({ initialPrefs }: { initialPrefs: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const update = async (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const enablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta push notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Permissão negada. Habilite nas configurações do navegador.');
      return;
    }

    // Subscribe via /api/notifications/subscribe (existente)
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) {
        alert('VAPID key não configurada — contate o suporte.');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as unknown as BufferSource,
      });
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      await update({ pushEnabled: true });
    } catch (e) {
      console.error('subscribe failed', e);
      alert('Erro ao ativar push. Tente novamente.');
    }
  };

  const channels = TOGGLES.filter((t) => t.group === 'channel');
  const categories = TOGGLES.filter((t) => t.group === 'category');

  return (
    <div className="space-y-6">
      {/* Permissão do browser */}
      {typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission !== 'granted' && (
          <div className="bg-accent-soft border-accent rounded-xl p-4">
            <p className="text-sm text-accent mb-3">
              Pra receber push notifications no dispositivo, precisamos da permissão do navegador.
            </p>
            <button
              type="button"
              onClick={enablePush}
              className="text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg"
            >
              Permitir push
            </button>
          </div>
        )}

      {/* Channels */}
      <section className="bg-surface border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-divider">
          <h2 className="text-sm font-semibold text-ink-1">Canais</h2>
          <p className="text-xs text-ink-3 mt-0.5">Onde você quer receber notificações</p>
        </div>
        {channels.map((t) => (
          <ToggleRow
            key={t.key}
            label={t.label}
            description={t.description}
            checked={prefs[t.key] as boolean}
            onChange={(v) => update({ [t.key]: v } as Partial<Prefs>)}
          />
        ))}
      </section>

      {/* Categories */}
      <section className="bg-surface border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-divider">
          <h2 className="text-sm font-semibold text-ink-1">Categorias</h2>
          <p className="text-xs text-ink-3 mt-0.5">Tipos de mensagens que você quer receber</p>
        </div>
        {categories.map((t) => (
          <ToggleRow
            key={t.key}
            label={t.label}
            description={t.description}
            checked={prefs[t.key] as boolean}
            onChange={(v) => update({ [t.key]: v } as Partial<Prefs>)}
          />
        ))}
      </section>

      {/* Quiet hours */}
      <section className="bg-surface border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-ink-1">Não perturbar</h2>
        <p className="text-xs text-ink-3 mt-0.5">
          Suspende push em horário definido (URGENT ainda passa)
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="text-xs text-ink-2">De</span>
            <select
              value={prefs.quietHoursStart ?? ''}
              onChange={(e) =>
                update({
                  quietHoursStart: e.target.value === '' ? null : parseInt(e.target.value),
                })
              }
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface-2 border text-sm text-ink-1 focus:outline-none focus:border-accent"
            >
              <option value="">Desligado</option>
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink-2">Até</span>
            <select
              value={prefs.quietHoursEnd ?? ''}
              onChange={(e) =>
                update({
                  quietHoursEnd: e.target.value === '' ? null : parseInt(e.target.value),
                })
              }
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface-2 border text-sm text-ink-1 focus:outline-none focus:border-accent"
            >
              <option value="">Desligado</option>
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {savedAt && !saving && (
        <p className="text-xs text-green-400">
          ✓ Salvo {new Date(savedAt).toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-divider last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-ink-1">{label}</p>
        <p className="text-xs text-ink-3 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
          checked ? 'bg-blue-500' : 'bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
