import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import {
  Check,
  ArrowRight,
  Star,
  Brain,
  BarChart3,
  Zap,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-purple-950/20 pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0a0e27]/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center relative z-10">
              <Image
                src="/logo.png"
                alt="Simulai OAB"
                width={140}
                height={70}
                className="h-12 w-auto"
              />
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="hidden sm:block text-gray-400 hover:text-white font-medium transition"
              >
                Planos
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-300">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Começar grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <Check className="w-4 h-4" />
                Atualizado com o último exame da OAB
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl mx-auto">
                Todas as questões oficiais da OAB{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  em um só lugar
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                5.605 questões de 2010 a 2025 atualizadas automaticamente.
                Pratique, simule e acompanhe sua evolução até a aprovação.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link href="/register">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2 text-lg">
                      Começar grátis agora
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
                <Link href="/pricing">
                  <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all text-lg">
                    Ver planos
                  </button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-8 pt-8 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Banco oficial sempre atualizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>16 anos de provas (2010-2025)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Grátis para começar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-3xl p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Banco de questões sempre atualizado automaticamente
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Nosso sistema monitora e adiciona automaticamente as questões de cada novo exame da OAB.
                    Você sempre terá acesso ao banco mais completo e atualizado do mercado, sem precisar buscar questões em vários lugares.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">5.605</div>
                  <div className="text-gray-400 text-sm">Questões oficiais</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">2010-2025</div>
                  <div className="text-gray-400 text-sm">16 anos de provas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">17</div>
                  <div className="text-gray-400 text-sm">Matérias cobertas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">100%</div>
                  <div className="text-gray-400 text-sm">Oficial FGV</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Tudo que você precisa para aprovar
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Pratique, simule e acompanhe sua evolução com o banco oficial completo
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-green-500/50 transition-all duration-300">
                <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Banco Oficial Completo
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  5.605 questões oficiais da OAB de 2010 a 2025. Atualizado automaticamente a cada novo exame.
                </p>
              </div>

              <div className="group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Simulados Realistas
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Simule o exame real com a mesma distribuição de questões por matéria da FGV.
                </p>
              </div>

              <div className="group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Acompanhe sua Evolução
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Analytics detalhado por matéria, dificuldade e histórico de desempenho.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Simples, inteligente e eficaz
              </h2>
              <p className="text-xl text-gray-400">
                Comece a estudar em menos de 1 minuto
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/50">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Crie sua conta grátis</h3>
                <p className="text-gray-400">Sem cartão de crédito, sem burocracia</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-purple-500/50">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pratique questões</h3>
                <p className="text-gray-400">5.605 questões oficiais esperando por você</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-green-500/50">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aprove na OAB</h3>
                <p className="text-gray-400">Acompanhe sua evolução até a aprovação</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-white mb-6">
                &quot;Ter acesso a TODAS as questões oficiais em um só lugar fez toda a diferença.
                Consegui praticar muito mais e entender o padrão das provas.&quot;
              </blockquote>
              <div className="text-gray-400">
                <div className="font-semibold text-white">Maria Silva</div>
                <div>Aprovada no XXXVIII Exame da OAB</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Comece sua jornada de aprovação hoje
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Junte-se a milhares de estudantes que já estão se preparando com a melhor plataforma
                </p>
                <Link href="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-50 border-0 shadow-xl"
                  >
                    Criar conta grátis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <p className="text-blue-100 mt-4 text-sm">
                  Sem cartão de crédito • Comece em 1 minuto
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-white mb-3">Produto</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link href="/pricing" className="hover:text-white transition">
                      Planos
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-white transition">
                      Começar Grátis
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Legal</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link href="/terms" className="hover:text-white transition">
                      Termos de Uso
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-white transition">
                      Privacidade
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Recursos</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link href="/dashboard" className="hover:text-white transition">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/practice" className="hover:text-white transition">
                      Prática
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Contato</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>suporte@simulaioab.com</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-sm">
              <p>&copy; 2025 Simulai OAB. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
