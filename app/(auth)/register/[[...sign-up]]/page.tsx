'use client';

import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Simulai OAB - Cadastro"
              width={192}
              height={96}
              priority
              className="h-24 w-auto"
            />
          </div>
          <p className="text-navy-400">
            Comece sua preparação agora
          </p>
        </div>

        {/* Clerk SignUp Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-navy-900/50 backdrop-blur-xl border border-navy-800/50 shadow-2xl",
                headerTitle: "text-white text-2xl font-bold",
                headerSubtitle: "text-navy-400",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 transition-all duration-300",
                formFieldInput: "bg-navy-800/50 border-navy-700 !text-white placeholder:text-navy-500 focus:border-blue-500 focus:ring-blue-500",
                formFieldLabel: "!text-white",
                formFieldInputShowPasswordButton: "text-navy-400 hover:text-white",
                formFieldLabelRow: "!text-white",
                formFieldAction: "text-blue-400 hover:text-blue-300",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                footerActionText: "text-navy-400",
                identityPreviewText: "!text-white",
                identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
                dividerLine: "bg-navy-700",
                dividerText: "text-navy-500",
                dividerRow: "text-navy-500",
                socialButtonsBlockButton: "bg-navy-800/50 border-navy-700 !text-white hover:bg-navy-800 hover:border-navy-600",
                socialButtonsBlockButtonText: "!text-white font-medium",
                socialButtonsBlockButtonArrow: "!text-white",
                formHeaderTitle: "!text-white",
                formHeaderSubtitle: "text-navy-400",
                otpCodeFieldInput: "bg-navy-800/50 border-navy-700 !text-white",
                alternativeMethodsBlockButton: "bg-navy-800/50 border-navy-700 !text-white hover:bg-navy-800",
                alertText: "!text-white",
                alert: "bg-red-500/10 border-red-500/20 text-red-400",
                formResendCodeLink: "text-blue-400 hover:text-blue-300",
                identityPreview: "bg-navy-800/50 border-navy-700",
                formFieldRow: "!text-white",
              }
            }}
            routing="path"
            path="/register"
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
          />
        </div>

        {/* Rodapé */}
        <p className="text-center text-sm text-navy-400 mt-8">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link href="/terms" className="text-blue-400 hover:text-blue-300">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
