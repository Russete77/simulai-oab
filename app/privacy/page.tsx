import Link from 'next/link';
import { ArrowLeft, Mail, Globe } from 'lucide-react';
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

        <Card variant="glass" className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">📜 Política de Privacidade</h1>
            <p className="text-navy-400">Última atualização: 16 de outubro de 2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introdução */}
            <section>
              <p className="text-white/90 leading-relaxed">
                Bem-vindo ao <strong>SIMULAI OAB</strong> (&quot;nós&quot;, &quot;nosso&quot;, &quot;aplicativo&quot;). Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as informações dos usuários (&quot;você&quot;, &quot;usuário&quot;) que utilizam nosso app ou site acessível via{' '}
                <a href="https://www.simulaioab.com" className="text-blue-400 hover:text-blue-300">
                  www.simulaioab.com
                </a>
                .
              </p>
              <p className="text-white/90 leading-relaxed mt-4">
                Ao utilizar o SIMULAI OAB, você concorda com esta Política de Privacidade. Caso não concorde, não utilize o aplicativo.
              </p>
            </section>

            {/* 1. Informações que Coletamos */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Informações que Coletamos</h2>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">1.1. Informações pessoais fornecidas pelo usuário</h3>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Nome completo</li>
                <li>E-mail</li>
                <li>Senha (armazenada de forma segura)</li>
                <li>Dados opcionais de perfil (foto, curso, número da OAB etc.)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">1.2. Informações de uso</h3>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Estatísticas de simulados (acertos, erros, tempo, histórico)</li>
                <li>Dados técnicos do dispositivo (versão do app, SO usado, modelo)</li>
                <li>Informações de navegação e IP</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">1.3. Cookies / tecnologias semelhantes (para versão web)</h3>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Cookies para manter sessão, lembrar preferências, análise de tráfego etc.</li>
              </ul>
            </section>

            {/* 2. Finalidade do Uso dos Dados */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Finalidade do Uso dos Dados</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Os dados coletados servem para:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Criar e gerenciar sua conta</li>
                <li>Permitir acesso às funcionalidades (simulados, estatísticas etc.)</li>
                <li>Exibir relatórios e performance</li>
                <li>Personalizar experiência de estudo</li>
                <li>Enviar notificações e comunicações úteis</li>
                <li>Melhorar o app e corrigir falhas</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            {/* 3. Armazenamento e Segurança */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Armazenamento e Segurança dos Dados</h2>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Dados guardados em servidores do Supabase</li>
                <li>Senhas criptografadas</li>
                <li>Transmissão via TLS/SSL</li>
                <li>Uso de Row Level Security no banco para isolar dados de usuários</li>
                <li>Backups e auditorias periódicas</li>
                <li>Em caso de violação, notificaremos os usuários conforme exigido por lei</li>
              </ul>
            </section>

            {/* 4. Compartilhamento de Dados */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                <strong>Não vendemos nem comercializamos seus dados pessoais.</strong><br />
                Compartilhamos apenas quando:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Necessário para operação do serviço (Supabase, ferramentas analíticas, processamento de pagamentos)</li>
                <li>Quando exigido por lei ou por ordem judicial</li>
                <li>Para estatísticas agregadas anonimizadas</li>
              </ul>
            </section>

            {/* 5. Retenção e Exclusão */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Retenção e Exclusão de Dados</h2>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Dados mantidos enquanto a conta estiver ativa</li>
                <li>Você pode pedir exclusão de conta e dados via e-mail</li>
                <li>Após exclusão, dados podem manter-se anonimizados para fins estatísticos</li>
              </ul>
            </section>

            {/* 6. Direitos do Usuário (LGPD) */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Direitos do Usuário (LGPD)</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Você tem direito de:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Confirmar existência de tratamento</li>
                <li>Acessar, corrigir ou excluir seus dados</li>
                <li>Revogar consentimento</li>
                <li>Solicitar portabilidade ou anonimização</li>
              </ul>
              <p className="text-white/90 leading-relaxed mt-4">
                Exercer esses direitos enviando e-mail para{' '}
                <a href="mailto:privacidade@simulaioab.com" className="text-blue-400 hover:text-blue-300">
                  privacidade@simulaioab.com
                </a>
              </p>
            </section>

            {/* 7. Menores de Idade */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Uso por Menores de Idade</h2>
              <p className="text-white/90 leading-relaxed">
                O aplicativo não se destina a menores de 16 anos. Contas identificadas como pertencentes a menores podem ser removidas sem prévia comunicação.
              </p>
            </section>

            {/* 8. Transferência Internacional */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Transferência Internacional de Dados</h2>
              <p className="text-white/90 leading-relaxed">
                Seus dados podem ser armazenados em servidores no exterior (via Supabase), com segurança compatível com a LGPD.
              </p>
            </section>

            {/* 9. Alterações na Política */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Alterações na Política</h2>
              <p className="text-white/90 leading-relaxed">
                Podemos atualizar esta Política a qualquer momento. A versão mais recente ficará disponível em{' '}
                <a href="https://www.simulaioab.com" className="text-blue-400 hover:text-blue-300">
                  www.simulaioab.com
                </a>
                {' '}e dentro do app. Mudanças significativas serão comunicadas aos usuários.
              </p>
            </section>

            {/* 10. Contato */}
            <section className="bg-navy-800/30 rounded-lg p-6 border border-navy-700">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contato</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Para dúvidas ou solicitações relativas à privacidade:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <a href="mailto:privacidade@simulaioab.com" className="text-blue-400 hover:text-blue-300">
                    privacidade@simulaioab.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <a href="https://www.simulaioab.com" className="text-blue-400 hover:text-blue-300">
                    www.simulaioab.com
                  </a>
                </div>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
