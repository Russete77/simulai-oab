'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.push(
      '/login?redirect_url=' + encodeURIComponent(window.location.origin + '/dashboard')
    );
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-ink-1 mb-6">Simulai OAB</h1>
        <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
        <p className="text-sm text-ink-2 mt-4">Redirecionando...</p>
      </div>
    </div>
  );
}
