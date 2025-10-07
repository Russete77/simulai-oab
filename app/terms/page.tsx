import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <Card variant="glass" className="p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Termos de Uso</h1>
          <p className="text-navy-400 mb-8">Última atualização: Janeiro de 2025</p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
              <p className="text-white/80 leading-relaxed">
                Ao acessar e usar o Simulai OAB, você concorda em cumprir estes Termos de Uso.
                Se você não concordar com qualquer parte destes termos, não deve usar nossa plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                O Simulai OAB é uma plataforma de preparação para o Exame da Ordem dos Advogados do Brasil (OAB),
                oferecendo:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Simulados baseados em questões reais da OAB</li>
                <li>Explicações geradas por inteligência artificial</li>
                <li>Analytics de desempenho</li>
                <li>Sistema de gamificação</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Conta de Usuário</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                Para usar o Simulai OAB, você deve:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a segurança de sua senha</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Conteúdo e Propriedade Intelectual</h2>
              <p className="text-white/80 leading-relaxed">
                Todas as questões, materiais e conteúdos disponíveis na plataforma são protegidos por
                direitos autorais. As questões do Exame da OAB são de propriedade da Ordem dos Advogados do Brasil.
                O uso do conteúdo é permitido apenas para fins de estudo pessoal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Uso da IA</h2>
              <p className="text-white/80 leading-relaxed">
                As explicações geradas por IA são fornecidas como apoio didático. Embora nos esforcemos
                para garantir a precisão, recomendamos sempre consultar fontes oficiais e legislação atualizada.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Limitação de Responsabilidade</h2>
              <p className="text-white/80 leading-relaxed">
                O Simulai OAB não garante aprovação no Exame da OAB. A plataforma é uma ferramenta de estudo
                e o sucesso depende do esforço e dedicação individual do usuário.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Modificações</h2>
              <p className="text-white/80 leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas
                serão notificadas por email ou através da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contato</h2>
              <p className="text-white/80 leading-relaxed">
                Para questões sobre estes termos, entre em contato através de: contato@simulaioab.com
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
