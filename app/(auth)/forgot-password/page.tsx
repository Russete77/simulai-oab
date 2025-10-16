'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para login com parâmetro de recuperação de senha
    router.push('/login?redirect_url=' + encodeURIComponent(window.location.origin + '/dashboard'));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Simulai OAB - Recuperação de senha"
            width={192}
            height={96}
            priority
            className="h-24 w-auto"
          />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        <p className="text-navy-400 mt-4">Redirecionando...</p>
      </div>
    </div>
  );
}
