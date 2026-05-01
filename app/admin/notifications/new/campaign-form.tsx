'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

const TYPES = ['INFO', 'ALERT', 'ACHIEVEMENT', 'REMINDER', 'PAYMENT_RECOVERY', 'PROMO', 'CAMPAIGN', 'SYSTEM'] as const;
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const SUB_STATUS = ['NO_SUB', 'ACTIVE', 'INCOMPLETE', 'PAST_DUE', 'CANCELED'] as const;
const PLAN_TYPES = ['BASIC', 'PRO', 'PREMIUM'] as const;

export function CampaignForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Conteúdo
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('CAMPAIGN');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('NORMAL');
  const [titleTemplate, setTitleTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState('');

  // Canais
  const [inApp, setInApp] = useState(true);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [vibrate, setVibrate] = useState(false);

  // Audiência
  const [subStatus, setSubStatus] = useState<string>('');
  const [planType, setPlanType] = useState<string>('');
  const [daysSinceSignupMin, setDaysSinceSignupMin] = useState<string>('');
  const [daysSinceSignupMax, setDaysSinceSignupMax] = useState<string>('');

  // Schedule
  const [recurring, setRecurring] = useState(false);
  const [recurringKey, setRecurringKey] = useState('');

  const audienceFilter = () => {
    const f: Record<string, unknown> = {};
    if (subStatus) f.subscriptionStatus = subStatus;
    if (planType) f.planType = planType;
    if (daysSinceSignupMin || daysSinceSignupMax) {
      f.daysSinceSignup = {
        ...(daysSinceSignupMin ? { min: parseInt(daysSinceSignupMin) } : {}),
        ...(daysSinceSignupMax ? { max: parseInt(daysSinceSignupMax) } : {}),
      };
    }
    return f;
  };

  // Preview audience com debounce
  useEffect(() => {
    const t = window.setTimeout(async () => {
      const f = audienceFilter();
      if (Object.keys(f).length === 0) {
        setAudiencePreview(null);
        return;
      }
      setPreviewing(true);
      try {
        const res = await fetch('/api/admin/notifications/preview-audience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(f),
        });
        if (res.ok) {
          const data = await res.json();
          setAudiencePreview(data.count);
        }
      } finally {
        setPreviewing(false);
      }
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subStatus, planType, daysSinceSignupMin, daysSinceSignupMax]);

  const submit = async (autoDispatch: boolean) => {
    setError(null);
    setSubmitting(true);
    try {
      const channels: string[] = [];
      if (inApp) channels.push('IN_APP');
      if (push) channels.push('PUSH');
      if (email) channels.push('EMAIL');

      if (!name || !titleTemplate || !bodyTemplate || channels.length === 0) {
        setError('Preencha nome, título, corpo e ao menos 1 canal');
        return;
      }

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          priority,
          titleTemplate,
          bodyTemplate,
          actionUrl: actionUrl || undefined,
          actionLabel: actionLabel || undefined,
          emailSubjectTemplate: emailSubjectTemplate || undefined,
          channels,
          vibrate,
          audienceFilter: audienceFilter(),
          recurring,
          recurringKey: recurring ? recurringKey || undefined : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erro ao criar campanha');
        return;
      }

      const { campaign } = await res.json();

      if (autoDispatch) {
        await fetch(`/api/admin/notifications/${campaign.id}/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send' }),
        });
      }

      router.push(`/admin/notifications/${campaign.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Conteúdo */}
      <Card className="bg-surface border p-5">
        <h2 className="text-sm font-semibold text-ink-1 mb-4">Conteúdo</h2>
        <div className="space-y-3">
          <Field label="Nome (interno)">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Recovery D7"
              className={inputClass}
            />
          </Field>
          <Field label="Descrição (interno)">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={type} onChange={(e) => setType(e.target.value as never)} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Prioridade">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as never)}
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Título (suporta {{userName}}, {{firstName}})">
            <input
              type="text"
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Corpo (texto)">
            <textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="URL de ação">
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/pricing"
                className={inputClass}
              />
            </Field>
            <Field label="Label do botão">
              <input
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="Ver planos"
                className={inputClass}
              />
            </Field>
          </div>
          {email && (
            <Field label="Subject do email (override; se vazio usa o título)">
              <input
                type="text"
                value={emailSubjectTemplate}
                onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </Card>

      {/* Canais */}
      <Card className="bg-surface border p-5">
        <h2 className="text-sm font-semibold text-ink-1 mb-4">Canais de entrega</h2>
        <div className="space-y-2">
          <Toggle label="In-app (sempre disponível na inbox)" checked={inApp} onChange={setInApp} />
          <Toggle label="Push notification (browser/mobile)" checked={push} onChange={setPush} />
          <Toggle label="Email" checked={email} onChange={setEmail} />
          <Toggle
            label="Vibração no client (URGENT já vibra automático)"
            checked={vibrate}
            onChange={setVibrate}
          />
        </div>
      </Card>

      {/* Audiência */}
      <Card className="bg-surface border p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-1">Audiência</h2>
          {audiencePreview !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-accent">
              <Users className="w-3.5 h-3.5" />
              {previewing ? 'calculando...' : `${audiencePreview.toLocaleString('pt-BR')} usuários`}
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status da subscription">
              <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)} className={inputClass}>
                <option value="">Qualquer</option>
                {SUB_STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Plano">
              <select value={planType} onChange={(e) => setPlanType(e.target.value)} className={inputClass}>
                <option value="">Qualquer</option>
                {PLAN_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadastrado há (min dias)">
              <input
                type="number"
                value={daysSinceSignupMin}
                onChange={(e) => setDaysSinceSignupMin(e.target.value)}
                placeholder="ex: 7"
                className={inputClass}
              />
            </Field>
            <Field label="Cadastrado há (máx dias)">
              <input
                type="number"
                value={daysSinceSignupMax}
                onChange={(e) => setDaysSinceSignupMax(e.target.value)}
                placeholder="ex: 14"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Recurring */}
      <Card className="bg-surface border p-5">
        <h2 className="text-sm font-semibold text-ink-1 mb-4">Recorrência</h2>
        <div className="space-y-3">
          <Toggle
            label="Campanha recorrente (dispara repetidamente via cron)"
            checked={recurring}
            onChange={setRecurring}
          />
          {recurring && (
            <Field label="Chave única (recurringKey)">
              <input
                type="text"
                value={recurringKey}
                onChange={(e) => setRecurringKey(e.target.value)}
                placeholder="ex: WEEKLY_DIGEST"
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-2 text-ink-1 text-sm font-semibold border disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
          Salvar como rascunho
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={submitting || audiencePreview === 0}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
          Salvar e disparar agora
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-2 border text-sm text-ink-1 placeholder:text-ink-3 focus:outline-none focus:border-accent';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-2 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm text-ink-1 py-2 cursor-pointer">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </label>
  );
}
