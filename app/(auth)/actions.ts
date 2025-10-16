'use server';

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { reconcileUser } from '@/lib/auth/reconcile';
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const supabaseId = data.user.id;
    const userEmail = data.user.email!;

    try {
      const res = await reconcileUser(prisma, { id: supabaseId, email: userEmail }, name);
      console.info('[auth.signUp] reconcile result', res);
    } catch (e: any) {
      console.error('[auth.signUp] reconcile failed', { error: e?.message ?? String(e) });
      throw e;
    }
  }

  revalidatePath('/');
  redirect('/login?registered=true');
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  // Capture the full response so we can inspect status/details in logs
  const signInResponse = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const { data, error } = signInResponse as any;

  if (error) {
    try {
      console.error('[auth.signIn] login failed', {
        // Log only the Supabase URL (not keys) so we can verify the project
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
        email: email ?? null,
        // include returned objects for debugging
        response: {
          message: error.message,
          status: (error as any).status ?? null,
          details: (error as any).details ?? null,
          hint: (error as any).hint ?? null,
        },
        rawData: data ?? null,
      });
    } catch (e) {
      // ignore logging errors
    }

    return { error: error.message };
  }

  revalidatePath('/');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/');
}
