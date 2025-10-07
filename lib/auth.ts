import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Buscar ou criar usuário no Prisma
  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {
      email: user.email!,
      updatedAt: new Date(),
    },
    create: {
      supabaseId: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
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

  return dbUser;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
