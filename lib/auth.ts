import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { reconcileUser } from "@/lib/auth/reconcile";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    // Usar reconcileUser para evitar conflitos de constraint único
    await reconcileUser(
      prisma,
      { id: user.id, email: user.email! },
      user.user_metadata?.name || null
    );

    // Buscar o usuário atualizado com profile
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        profile: true,
      },
    });

    if (!dbUser) {
      console.error('[auth.getCurrentUser] User not found after reconciliation', {
        supabaseId: user.id,
        email: user.email,
      });
      return null;
    }

    return dbUser;
  } catch (error: any) {
    console.error('[auth.getCurrentUser] Failed to reconcile user', {
      supabaseId: user.id,
      email: user.email,
      error: error?.message ?? String(error),
    });

    // Em caso de erro, tentar buscar o usuário existente
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        profile: true,
      },
    });

    return existingUser;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
