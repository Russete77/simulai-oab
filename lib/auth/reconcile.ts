import { PrismaClient } from '@prisma/client';

export async function reconcileUser(prisma: PrismaClient, supabaseUser: any, name?: string) {
  const supabaseId = supabaseUser.id;
  const userEmail = supabaseUser.email;

  const result: any = { action: null, details: null };

  // Verificar existência por supabaseId e por email
  const existingBySupabaseId = await prisma.user.findUnique({
    where: { supabaseId },
    include: { profile: true }
  });
  const existingByEmail = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { profile: true }
  });

  // Caso 1: Usuário já existe pelo supabaseId - apenas atualizar
  if (existingBySupabaseId) {
    await prisma.user.update({
      where: { supabaseId },
      data: {
        email: userEmail,
        name: name || existingBySupabaseId.name,
        updatedAt: new Date()
      }
    });

    // Garantir que o profile existe
    if (!existingBySupabaseId.profile) {
      await prisma.userProfile.create({
        data: {
          userId: existingBySupabaseId.id,
          totalPoints: 0,
          level: 1,
          streak: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          dailyGoal: 20,
        }
      });
      result.action = 'updated-by-supabaseId-with-profile-creation';
    } else {
      result.action = 'updated-by-supabaseId';
    }

    result.details = { supabaseId };
    return result;
  }

  // Caso 2: Email já existe mas sem supabaseId - associar
  if (existingByEmail) {
    if (existingByEmail.supabaseId && existingByEmail.supabaseId !== supabaseId) {
      // CONFLITO: Email já pertence a outro usuário do Supabase
      console.warn('[reconcile] Email conflict detected', {
        email: userEmail,
        existingSupabaseId: existingByEmail.supabaseId,
        incomingSupabaseId: supabaseId,
      });

      result.action = 'conflict-skipped';
      result.details = {
        existingSupabaseId: existingByEmail.supabaseId,
        incomingSupabaseId: supabaseId,
        message: 'Email already associated with different Supabase user'
      };
      return result;
    } else {
      // Email existe mas sem supabaseId - associar
      await prisma.user.update({
        where: { email: userEmail },
        data: {
          supabaseId,
          name: name || existingByEmail.name,
          updatedAt: new Date()
        }
      });

      // Garantir que o profile existe
      if (!existingByEmail.profile) {
        await prisma.userProfile.create({
          data: {
            userId: existingByEmail.id,
            totalPoints: 0,
            level: 1,
            streak: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            dailyGoal: 20,
          }
        });
        result.action = 'associated-supabaseId-with-profile-creation';
      } else {
        result.action = 'associated-supabaseId';
      }

      result.details = { supabaseId, email: userEmail };
      return result;
    }
  }

  // Caso 3: Usuário não existe - criar novo
  await prisma.user.create({
    data: {
      supabaseId,
      email: userEmail,
      name,
      profile: {
        create: {
          totalPoints: 0,
          level: 1,
          streak: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          dailyGoal: 20
        }
      }
    }
  });

  result.action = 'created';
  result.details = { supabaseId, email: userEmail };
  return result;
}

export default reconcileUser;
