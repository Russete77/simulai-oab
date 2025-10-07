import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui';

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Política de Privacidade</h1>
          <p className="text-navy-400 mb-8">Última atualização: Janeiro de 2025</p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Informações que Coletamos</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                Coletamos as seguintes informações:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li><strong>Informações de conta:</strong> Nome, email, senha (criptografada)</li>
                <li><strong>Dados de uso:</strong> Respostas a questões, tempo gasto, performance</li>
                <li><strong>Dados de navegação:</strong> IP, navegador, dispositivo</li>
                <li><strong>Interações com IA:</strong> Perguntas e conversas com o assistente</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Como Usamos suas Informações</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                Utilizamos seus dados para:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Personalizar sua experiência de aprendizado</li>
                <li>Gerar analytics de desempenho</li>
                <li>Enviar notificações sobre conquistas e progresso</li>
                <li>Comunicações importantes sobre o serviço</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Compartilhamento de Dados</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                Seus dados pessoais NÃO são vendidos a terceiros. Compartilhamos apenas com:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li><strong>Supabase:</strong> Autenticação e banco de dados (criptografado)</li>
                <li><strong>OpenAI:</strong> Geração de explicações (dados anonimizados)</li>
                <li><strong>Vercel:</strong> Hospedagem da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Segurança dos Dados</h2>
              <p className="text-white/80 leading-relaxed">
                Implementamos medidas de segurança como:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 mt-4">
                <li>Criptografia SSL/TLS em todas as comunicações</li>
                <li>Senhas criptografadas com bcrypt</li>
                <li>Banco de dados hospedado em servidor seguro (Supabase)</li>
                <li>Autenticação de dois fatores disponível</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Seus Direitos (LGPD)</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou incorretos</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Portabilidade dos dados</li>
                <li>Revogar consentimento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies</h2>
              <p className="text-white/80 leading-relaxed">
                Utilizamos cookies essenciais para:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 mt-4">
                <li>Manter sua sessão de login</li>
                <li>Lembrar preferências</li>
                <li>Analytics de uso (Google Analytics - opcional)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Retenção de Dados</h2>
              <p className="text-white/80 leading-relaxed">
                Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta,
                os dados são removidos em até 30 dias, exceto informações necessárias para
                cumprimento de obrigações legais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Alterações na Política</h2>
              <p className="text-white/80 leading-relaxed">
                Podemos atualizar esta política periodicamente. Alterações significativas serão
                notificadas por email com 30 dias de antecedência.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contato do DPO</h2>
              <p className="text-white/80 leading-relaxed">
                Para exercer seus direitos ou questões sobre privacidade, contate nosso
                Encarregado de Proteção de Dados (DPO):
              </p>
              <p className="text-white/80 leading-relaxed mt-4">
                <strong>Email:</strong> dpo@simulaioab.com<br />
                <strong>Prazo de resposta:</strong> até 15 dias úteis
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
