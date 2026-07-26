/**
 * Orquestrador das campanhas de reengajamento (D+3, D+7, D+14).
 *
 * Roda 1x/dia via Vercel Cron (ver vercel.json).
 * Lógica:
 *  - Pega usuários que JÁ foram ativos (têm lastActiveAt) e pararam, com
 *    lastActiveAt entre X e X+1 dias atrás. Quem nunca ficou ativo desde o
 *    cadastro é público do cron recovery-campaigns (daysSinceSignup), não
 *    deste — evita as duas campanhas disparando pro mesmo user no mesmo dia.
 *  - Para cada um, checa se já enviou essa campanha. Se sim, pula.
 *  - Registra em EmailCampaign e dispara via Resend.
 */

import { Resend } from 'resend';
import { render } from '@react-email/components';
import type { CampaignType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { InativosD3Email } from './templates/inativos-d3';
import { InativosD7Email } from './templates/inativos-d7';
import { InativosD14Email } from './templates/inativos-d14';
import { getDaysUntilNextFirstPhaseExam } from '@/lib/oab/exam-dates';

// Lazy: só instancia quando for usar (evita crash no build se a env var não estiver setada)
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY não configurada');
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Simulai OAB <oi@simulaioab.com>';

interface CampaignConfig {
  type: CampaignType;
  daysInactive: number;
  subject: (name: string) => string;
  render: (name: string, utm: string) => string | Promise<string>;
}

const CAMPAIGNS: CampaignConfig[] = [
  {
    type: 'INACTIVE_D3',
    daysInactive: 3,
    subject: (name) => `${name}, sentimos sua falta 📚`,
    render: (name) => render(InativosD3Email({
      nomeUsuario: name,
      diasParaProva: getDaysUntilNextFirstPhaseExam(),
    })),
  },
  {
    type: 'INACTIVE_D7',
    daysInactive: 7,
    subject: (name) => `${name}, destrave tudo por R$89,99/mês 🚀`,
    render: (name) => render(InativosD7Email({ nomeUsuario: name })),
  },
  {
    type: 'INACTIVE_D14',
    daysInactive: 14,
    subject: (name) => `⏰ ${name}, última chance antes da OAB`,
    render: (name) => render(InativosD14Email({ nomeUsuario: name })),
  },
];

export interface InactiveCampaignResult {
  campaign: CampaignType;
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function runInactiveCampaigns(): Promise<InactiveCampaignResult[]> {
  const results: InactiveCampaignResult[] = [];

  for (const cfg of CAMPAIGNS) {
    const result = await runOneCampaign(cfg);
    results.push(result);
  }

  return results;
}

async function runOneCampaign(cfg: CampaignConfig): Promise<InactiveCampaignResult> {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  // Janela: exatamente daysInactive dias atrás, ±12h pra pegar em qualquer horário do cron
  const windowStart = new Date(now - (cfg.daysInactive + 0.5) * dayMs);
  const windowEnd = new Date(now - (cfg.daysInactive - 0.5) * dayMs);

  const result: InactiveCampaignResult = {
    campaign: cfg.type,
    candidates: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Candidatos: lastActiveAt dentro da janela OU (nunca ativo E createdAt na janela)
  // Alvo: usuários sem subscription ATIVA/TRIALING (não enviar pra pagantes engajados).
  const candidates = await prisma.user.findMany({
    where: {
      // user sem subscription ativa: ou nenhum customer, ou customer sem sub ACTIVE/TRIALING
      OR: [
        { customer: null },
        {
          customer: {
            subscriptions: {
              none: { status: { in: ['ACTIVE', 'TRIALING'] } },
            },
          },
        },
      ],
      // Só quem JÁ foi ativo e parou. Quem nunca ficou ativo (lastActiveAt
      // null) já é coberto pelo cron recovery-campaigns via daysSinceSignup
      // — as duas campanhas competindo pelo mesmo público no mesmo D+3/D+7/
      // D+14 mandava duas mensagens diferentes no mesmo dia pro mesmo user.
      AND: [
        { lastActiveAt: { gte: windowStart, lt: windowEnd } },
      ],
    },
    select: { id: true, email: true, name: true },
    take: 500, // batch cap pra não estourar rate limit
  });

  result.candidates = candidates.length;

  for (const u of candidates) {
    // Idempotência — não manda o mesmo tipo de campanha 2x pro mesmo user
    const already = await prisma.emailCampaign.findFirst({
      where: { userId: u.id, type: cfg.type },
      select: { id: true },
    });
    if (already) {
      result.skipped++;
      continue;
    }

    const firstName = (u.name ?? u.email).split(' ')[0].split('@')[0];
    const subject = cfg.subject(firstName);

    // Cria registro em QUEUED primeiro (rastreabilidade)
    const campaign = await prisma.emailCampaign.create({
      data: {
        userId: u.id,
        type: cfg.type,
        status: 'QUEUED',
        subject,
      },
    });

    try {
      const html = await cfg.render(firstName, cfg.type.toLowerCase());
      const { data, error } = await getResend().emails.send({
        from: FROM_EMAIL,
        to: u.email,
        subject,
        html,
        headers: {
          'List-Unsubscribe': '<https://simulaioab.com/configuracoes/notificacoes>',
          'X-Campaign': cfg.type,
        },
      });
      if (error) throw new Error(error.message);

      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          resendId: data?.id ?? null,
        },
      });
      result.sent++;
    } catch (err) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'unknown',
        },
      });
      result.failed++;
      result.errors.push(`${u.email}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return result;
}
