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
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Smartphone,
  MessageSquare,
  FileText,
  Users,
  Lock,
  Globe,
  HeadphonesIcon,
  Trophy,
  Flame,
  X,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Subtle gradient background - MANTIDO (1/2 gradientes) */}
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
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Atualizado com o último exame da OAB
                </div>
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  ÚNICO com IA integrada
                </div>
              </div>

              {/* Headline com gradiente (mantido) */}
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
                  <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
                    <span className="flex items-center gap-2 text-lg">
                      Começar grátis agora
                      <ArrowRight className="w-5 h-5" />
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

        {/* NOVA SEÇÃO: IA Diferencial - CRÍTICO! */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
                <Sparkles className="w-4 h-4" />
                EXCLUSIVO - ÚNICO NO MERCADO
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Inteligência Artificial do Seu Lado
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Somos o único sistema de simulados OAB com IA integrada para explicações personalizadas e chat inteligente
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Explicações com IA */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Explicações Personalizadas com IA
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Cada questão vem com explicação detalhada gerada por GPT-4, em linguagem clara e didática.
                  Entenda não só a resposta certa, mas o porquê de cada alternativa.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Explicações automáticas para todas as questões</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Linguagem clara e objetiva</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Contextualização com a lei e doutrina</span>
                  </li>
                </ul>
              </div>

              {/* Chat com IA */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Chat Inteligente com IA
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Tire dúvidas sobre qualquer questão conversando diretamente com a IA.
                  Como ter um professor particular 24/7 ao seu lado.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Conversas ilimitadas com a IA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Respostas instantâneas e contextualizadas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Aprenda no seu ritmo, sem limites</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition - SEM GRADIENTE */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
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

        {/* Features Expandidas - SEM GRADIENTES */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Tudo que você precisa para aprovar
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Funcionalidades completas para uma preparação eficiente e focada
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Banco Oficial */}
              <div className="bg-white/5 border border-white/10 hover:border-green-500/50 rounded-2xl p-6 transition-all">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Banco Oficial Completo
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  5.605 questões oficiais da OAB de 2010 a 2025. Atualizado automaticamente a cada novo exame.
                </p>
              </div>

              {/* 2. Simulados */}
              <div className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all">
                <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Simulados Realistas
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Simule o exame real com a mesma distribuição de questões por matéria da FGV. Formato idêntico à prova.
                </p>
              </div>

              {/* 3. Analytics Avançados */}
              <div className="bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-all">
                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Analytics Avançados
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Performance por matéria, predição de aprovação, evolução ao longo do tempo e muito mais.
                </p>
              </div>

              {/* 4. 5 Modos de Estudo */}
              <div className="bg-white/5 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 transition-all">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  5 Modos de Estudo
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Completo (80q), Adaptativo (40q), Rápido (20q), Revisão de Erros (30q) e Por Matéria (50q).
                </p>
              </div>

              {/* 5. Revisão Inteligente */}
              <div className="bg-white/5 border border-white/10 hover:border-amber-500/50 rounded-2xl p-6 transition-all">
                <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Revisão Inteligente
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Sistema aprende com seus erros e recomenda questões personalizadas. Foco em matérias fracas.
                </p>
              </div>

              {/* 6. PWA - App Instalável */}
              <div className="bg-white/5 border border-white/10 hover:border-pink-500/50 rounded-2xl p-6 transition-all">
                <div className="w-14 h-14 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Funciona como App
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Instalável no celular, estude offline, receba notificações. Sem precisar baixar da loja!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NOVA SEÇÃO: Gamificação */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Gamificação que Motiva
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Transforme seus estudos em uma jornada épica com conquistas, ranking e muito mais
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Conquistas */}
              <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Conquistas
                </h3>
                <p className="text-gray-400 text-sm">
                  20+ badges desbloqueáveis. Mostre seu progresso!
                </p>
              </div>

              {/* Ranking */}
              <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ranking
                </h3>
                <p className="text-gray-400 text-sm">
                  Compare-se com outros estudantes. Suba no leaderboard!
                </p>
              </div>

              {/* Pontos e Níveis */}
              <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Pontos e Níveis
                </h3>
                <p className="text-gray-400 text-sm">
                  Ganhe XP a cada questão. Suba de nível!
                </p>
              </div>

              {/* Streak */}
              <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Streak de Estudos
                </h3>
                <p className="text-gray-400 text-sm">
                  Dias consecutivos estudando. Não quebre a corrente!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NOVA SEÇÃO: Comparativo com Concorrentes */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Por que escolher o Simulai OAB?
              </h2>
              <p className="text-xl text-gray-400">
                Compare e veja o diferencial
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-white font-semibold">Funcionalidade</th>
                    <th className="text-center py-4 px-4">
                      <div className="text-white font-bold">Simulai OAB</div>
                      <div className="text-sm text-purple-400">Você está aqui</div>
                    </th>
                    <th className="text-center py-4 px-4 text-gray-400">Gran Cursos</th>
                    <th className="text-center py-4 px-4 text-gray-400">Estratégia OAB</th>
                    <th className="text-center py-4 px-4 text-gray-400">CEISC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">IA - Explicações</td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">Chat com IA</td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">Gamificação</td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4 text-gray-500 text-sm">Básica</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">PWA / App Instalável</td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">5.605 Questões</td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5 bg-purple-500/5">
                    <td className="py-4 px-4 text-white font-bold">Preço</td>
                    <td className="text-center py-4 px-4 text-purple-400 font-bold text-lg">R$ 49,90</td>
                    <td className="text-center py-4 px-4 text-gray-400">R$ 89,90</td>
                    <td className="text-center py-4 px-4 text-gray-400">R$ 129,90</td>
                    <td className="text-center py-4 px-4 text-gray-400">R$ 99,90</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8">
              <Link href="/register">
                <Button variant="primary" size="lg">
                  Começar grátis agora
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works - SEM GRADIENTES NOS CIRCLES */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
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
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Crie sua conta grátis</h3>
                <p className="text-gray-400">Sem cartão de crédito, sem burocracia</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pratique questões</h3>
                <p className="text-gray-400">5.605 questões oficiais esperando por você</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl text-white font-medium mb-6">
              &ldquo;O Simulai mudou completamente minha preparação. As explicações com IA são incríveis e o sistema de gamificação me mantém motivado todos os dias!&rdquo;
            </blockquote>
            <div className="text-gray-400">
              <p className="font-semibold text-white">Maria Silva</p>
              <p className="text-sm">Aprovada OAB XXXVIII</p>
            </div>
          </div>
        </section>

        {/* CTA Final com gradiente - MANTIDO (2/2 gradientes) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Comece sua jornada rumo à aprovação
                </h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Junte-se a milhares de estudantes que já estão usando o Simulai OAB para alcançar a aprovação
                </p>
                <Link href="/register">
                  <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-lg">
                    Criar conta grátis agora
                  </button>
                </Link>
                <p className="text-white/80 text-sm mt-4">
                  30 dias grátis • Sem cartão de crédito • Cancele quando quiser
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white/[0.02] border-t border-white/5 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <Image
                  src="/logo.png"
                  alt="Simulai OAB"
                  width={140}
                  height={70}
                  className="h-10 w-auto mb-4"
                />
                <p className="text-gray-400 text-sm">
                  O sistema mais completo de preparação para a OAB com IA integrada.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Produto</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/practice" className="hover:text-white transition">Praticar</Link></li>
                  <li><Link href="/simulations" className="hover:text-white transition">Simulados</Link></li>
                  <li><Link href="/analytics" className="hover:text-white transition">Analytics</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition">Planos</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Empresa</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/privacy" className="hover:text-white transition">Privacidade</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition">Termos</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Contato</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>suporte@simulaioab.com.br</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/5 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2025 Simulai OAB. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
