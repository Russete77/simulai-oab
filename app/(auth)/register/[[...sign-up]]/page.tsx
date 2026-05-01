'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-1">Simulai OAB</h1>
          </Link>
          <p className="text-sm text-ink-2 mt-2">
            Crie sua conta em 30 segundos
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-surface border shadow-md',
                headerTitle: 'text-ink-1',
                headerSubtitle: 'text-ink-2',
                formButtonPrimary:
                  'bg-accent hover:bg-accent-hover text-accent-fg shadow-sm transition-colors',
                formFieldInput:
                  'bg-surface border text-ink-1 placeholder:text-ink-3 focus:border-accent focus:ring-accent',
                formFieldLabel: 'text-ink-1',
                formFieldInputShowPasswordButton: 'text-ink-3 hover:text-ink-1',
                formFieldAction: 'text-accent hover:text-accent-hover',
                footerActionLink: 'text-accent hover:text-accent-hover',
                footerActionText: 'text-ink-2',
                identityPreviewText: 'text-ink-1',
                identityPreviewEditButton: 'text-accent hover:text-accent-hover',
                dividerLine: 'bg-divider',
                dividerText: 'text-ink-3',
                socialButtonsBlockButton:
                  'bg-surface border text-ink-1 hover:bg-surface-2 transition-colors',
                socialButtonsBlockButtonText: 'text-ink-1 font-medium',
                otpCodeFieldInput: 'bg-surface border text-ink-1',
                alternativeMethodsBlockButton:
                  'bg-surface border text-ink-1 hover:bg-surface-2',
                alert: 'bg-danger-soft border-danger text-danger',
                formResendCodeLink: 'text-accent hover:text-accent-hover',
                identityPreview: 'bg-surface-2 border',
              },
            }}
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
          />
        </div>

        <p className="text-center text-xs text-ink-3 mt-8">
          Ao criar conta, você concorda com nossos{' '}
          <Link href="/terms" className="text-accent hover:text-accent-hover">
            Termos
          </Link>{' '}
          e{' '}
          <Link href="/privacy" className="text-accent hover:text-accent-hover">
            Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
