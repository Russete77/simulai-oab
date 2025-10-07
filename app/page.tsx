import Link from 'next/link';
import { Button } from '@/components/ui';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-64 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 -right-64 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center mb-6 animate-slide-up">
            <img
              src="/logo.png"
              alt="Simulai OAB"
              className="h-32 md:h-40 w-auto"
            />
          </div>
          <p className="text-xl md:text-2xl text-navy-600 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Preparação inteligente para o Exame da OAB
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/login">
            <Button variant="primary" size="lg">
              Fazer Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="ghost" size="lg">
              Cadastrar Grátis
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-white mb-2">2.469 Questões Reais</h3>
            <p className="text-sm text-navy-600">
              Questões autênticas da OAB de 2010 a 2025
            </p>
          </div>

          <div className="bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Simulados Adaptativos</h3>
            <p className="text-sm text-navy-600">
              IA que se adapta ao seu nível de conhecimento
            </p>
          </div>

          <div className="bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics Completo</h3>
            <p className="text-sm text-navy-600">
              Acompanhe sua evolução e áreas de melhoria
            </p>
          </div>
        </div>

        <div className="text-sm text-navy-700 mt-8">
          <p>
            Plataforma completa com backend pronto e 16 matérias cobertas
          </p>
        </div>
      </div>
    </div>
  );
}
