'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import Link from 'next/link';
import { signIn } from '../actions';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

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
            <img
              src="/logo.png"
              alt="Simulai OAB"
              className="h-24 w-auto"
            />
          </div>
          <p className="text-navy-600">
            Preparação inteligente para o Exame da OAB
          </p>
        </div>

        {/* Mensagem de confirmação de email */}
        {registered && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-400 mt-0.5" size={20} />
              <div>
                <p className="text-blue-400 font-medium mb-1">Email de confirmação enviado!</p>
                <p className="text-sm text-navy-400">
                  Verifique sua caixa de entrada e confirme seu email antes de fazer login.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card de Login */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Entre com seu email e senha para acessar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                name="email"
                label="Email"
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  label="Senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-600 hover:text-navy-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-navy-700 bg-navy-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-navy-600">Lembrar de mim</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-navy-600">
                Não tem uma conta?{' '}
                <Link
                  href="/register"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Cadastre-se grátis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-center text-sm text-navy-700 mt-8">
          Ao entrar, você concorda com nossos{' '}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-navy-950"><div className="text-white">Carregando...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
