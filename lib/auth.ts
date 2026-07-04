import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { requirePaidPlan, type GateResult } from "@/lib/billing/gate";
import { createError } from "@/lib/errors";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    // Buscar usuário no banco de dados
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        profile: true,
      },
    });

    // Se não encontrou, tentar criar ou atualizar existente
    if (!dbUser) {
      const clerkUser = await currentUser();

      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

        // Verificar se já existe usuário com este email (migração de Supabase)
        const existingUser = await prisma.user.findUnique({
          where: { email: email! },
          include: { profile: true },
        });

        if (existingUser) {
          // Atualizar usuário existente com clerkId
          logger.info('Updating existing user with clerkId', { email, clerkId: userId });

          dbUser = await prisma.user.update({
            where: { email: email! },
            data: {
              clerkId: userId,
              name: name || existingUser.name,
              updatedAt: new Date(),
            },
            include: {
              profile: true,
            },
          });

          logger.info('User updated successfully');
        } else {
          // Criar novo usuário
          logger.info('Creating new user', { clerkId: userId, email });

          dbUser = await prisma.user.create({
            data: {
              clerkId: userId,
              email: email!,
              name,
              profile: {
                create: {
                  totalPoints: 0,
                  level: 1,
                  streak: 0,
                  totalQuestions: 0,
                  correctAnswers: 0,
                  dailyGoal: 20,
                },
              },
            },
            include: {
              profile: true,
            },
          });

          logger.info('User created successfully');
        }
      }
    }

    return dbUser;
  } catch (error: any) {
    logger.error('Failed to fetch/create user', {
      clerkId: userId,
      error: error?.message ?? String(error),
    });
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Erro lançado por requirePaidUser quando o usuário está logado mas
 * não tem subscription ACTIVE. As rotas devem catch e retornar 402.
 */
export class PaymentRequiredError extends Error {
  readonly code = 'PAYMENT_REQUIRED';
  readonly gate: GateResult;
  constructor(gate: GateResult) {
    super('Payment required: subscription not active');
    this.name = 'PaymentRequiredError';
    this.gate = gate;
  }
}

/**
 * Auth + paywall. Retorna o user APENAS se tiver subscription ACTIVE
 * (ou se ENABLE_FREE_ACCESS_MODE=true). Caso contrário lança PaymentRequiredError.
 *
 * Use em TODAS as rotas que servem conteúdo pago (questões, simulados, IA, review etc).
 */
export async function requirePaidUser() {
  const user = await requireAuth();
  const gate = await requirePaidPlan(user.id);

  if (!gate.allowed) {
    logger.warn('Paid gate blocked request', {
      userId: user.id,
      reason: gate.reason,
      subscriptionStatus: gate.subscriptionStatus,
    });
    throw new PaymentRequiredError(gate);
  }

  return user;
}

/**
 * Catch handler pra rotas: se o erro for PaymentRequiredError, devolve 402.
 * Se não for, re-throw pra manter o comportamento existente.
 *
 * Uso:
 *   try { ... } catch (e) {
 *     const r = handlePaymentRequired(e);
 *     if (r) return r;
 *     // ... outros tratamentos
 *   }
 */
export function handlePaymentRequired(err: unknown): NextResponse | null {
  if (err instanceof PaymentRequiredError) {
    const error = createError('PAYMENT_REQUIRED', {
      reason: err.gate.reason,
      subscriptionStatus: err.gate.subscriptionStatus,
    });
    return NextResponse.json(error.toJSON(), { status: 402 });
  }
  return null;
}

// Helper para obter informações do Clerk
export async function getClerkUser() {
  return await currentUser();
}
