import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

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
          console.log('[auth.getCurrentUser] Updating existing user with clerkId', {
            email,
            clerkId: userId,
          });

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

          console.log('[auth.getCurrentUser] User updated successfully');
        } else {
          // Criar novo usuário
          console.log('[auth.getCurrentUser] Creating new user', {
            clerkId: userId,
            email,
          });

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

          console.log('[auth.getCurrentUser] User created successfully');
        }
      }
    }

    return dbUser;
  } catch (error: any) {
    console.error('[auth.getCurrentUser] Failed to fetch/create user', {
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

// Helper para obter informações do Clerk
export async function getClerkUser() {
  return await currentUser();
}
