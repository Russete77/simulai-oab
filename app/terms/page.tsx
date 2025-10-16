import Link from 'next/link';
import { ArrowLeft, Mail, Globe, AlertTriangle } from 'lucide-react';
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

        <Card variant="glass" className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">📝 Termos de Uso</h1>
            <p className="text-navy-400">Última atualização: 16 de outubro de 2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introdução */}
            <section>
              <p className="text-white/90 leading-relaxed">
                Bem-vindo ao <strong>SIMULAI OAB</strong>! Estes Termos de Uso (&quot;Termos&quot;) regulam o acesso e uso da plataforma SIMULAI OAB, disponível em{' '}
                <a href="https://www.simulaioab.com" className="text-blue-400 hover:text-blue-300">
                  www.simulaioab.com
                </a>
                {' '}e em nossos aplicativos móveis.
              </p>
              <p className="text-white/90 leading-relaxed mt-4">
                Ao utilizar o SIMULAI OAB, você concorda integralmente com estes Termos. Caso não concorde, não utilize a plataforma.
              </p>
            </section>

            {/* 1. Aceitação dos Termos */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
              <p className="text-white/90 leading-relaxed">
                Ao criar uma conta ou utilizar nossos serviços, você declara que:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 mt-4">
                <li>Leu, compreendeu e concorda com estes Termos de Uso</li>
                <li>É maior de 16 anos ou possui consentimento dos responsáveis legais</li>
                <li>Fornecerá informações verdadeiras e atualizadas</li>
                <li>Usará a plataforma de forma legal e ética</li>
              </ul>
            </section>

            {/* 2. Descrição do Serviço */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                O SIMULAI OAB é uma plataforma de preparação para o Exame da Ordem dos Advogados do Brasil (OAB), oferecendo:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Mais de 2.469 questões reais de provas anteriores (2010-2025)</li>
                <li>Simulados personalizados e adaptativos</li>
                <li>Explicações detalhadas geradas por Inteligência Artificial</li>
                <li>Analytics e estatísticas de desempenho</li>
                <li>Sistema de gamificação (pontos, níveis, conquistas)</li>
                <li>Ranking e competição entre usuários</li>
                <li>Revisão de erros e questões incorretas</li>
              </ul>
            </section>

            {/* 3. Conta de Usuário */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Cadastro e Conta de Usuário</h2>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">3.1. Criação de Conta</h3>
              <p className="text-white/90 leading-relaxed mb-4">
                Para acessar o SIMULAI OAB, você deve criar uma conta fornecendo:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail válido</li>
                <li>Senha segura</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">3.2. Responsabilidades do Usuário</h3>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Manter a confidencialidade da senha</li>
                <li>Notificar imediatamente sobre qualquer acesso não autorizado</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                <li>Não compartilhar sua conta com terceiros</li>
                <li>Não criar múltiplas contas para burlar sistemas de pontuação</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">3.3. Suspensão e Encerramento</h3>
              <p className="text-white/90 leading-relaxed">
                Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos, incluindo casos de:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 mt-4">
                <li>Fornecimento de informações falsas</li>
                <li>Uso fraudulento ou abusivo da plataforma</li>
                <li>Violação de direitos autorais</li>
                <li>Comportamento inadequado ou ofensivo</li>
              </ul>
            </section>

            {/* 4. Uso Aceitável */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Uso Aceitável da Plataforma</h2>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">4.1. Condutas Proibidas</h3>
              <p className="text-white/90 leading-relaxed mb-4">
                É expressamente proibido:
              </p>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                <li>Copiar, reproduzir ou distribuir conteúdo da plataforma sem autorização</li>
                <li>Usar bots, scripts ou automação para acessar a plataforma</li>
                <li>Tentar hackear, descompilar ou reverter engenharia do sistema</li>
                <li>Coletar dados de outros usuários sem consentimento</li>
                <li>Utilizar a plataforma para fins comerciais não autorizados</li>
                <li>Publicar conteúdo ofensivo, difamatório ou ilegal</li>
                <li>Interferir no funcionamento normal da plataforma</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">4.2. Consequências</h3>
              <p className="text-white/90 leading-relaxed">
                Violações podem resultar em suspensão imediata, encerramento de conta e medidas legais cabíveis.
              </p>
            </section>

            {/* 5. Propriedade Intelectual */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Conteúdo e Propriedade Intelectual</h2>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">5.1. Questões da OAB</h3>
              <p className="text-white/90 leading-relaxed">
                As questões do Exame da OAB são de propriedade da <strong>Ordem dos Advogados do Brasil</strong> e da <strong>FGV</strong>.
                O SIMULAI OAB utiliza estas questões para fins educacionais, conforme permitido pela legislação brasileira.
              </p>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">5.2. Conteúdo da Plataforma</h3>
              <p className="text-white/90 leading-relaxed">
                Todo o código-fonte, design, layout, explicações geradas por IA, analytics e demais materiais originais são de propriedade exclusiva do SIMULAI OAB e protegidos por direitos autorais.
              </p>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">5.3. Uso Permitido</h3>
              <p className="text-white/90 leading-relaxed">
                O uso do conteúdo é permitido <strong>apenas para fins de estudo pessoal e não comercial</strong>.
                Qualquer reprodução, distribuição ou uso comercial requer autorização prévia por escrito.
              </p>
            </section>

            {/* 6. Inteligência Artificial */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Uso de Inteligência Artificial</h2>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-amber-200 font-semibold mb-2">Importante:</p>
                    <p className="text-white/80 text-sm leading-relaxed">
                      As explicações geradas por IA (GPT-4) são fornecidas como <strong>apoio didático complementar</strong>.
                      Embora nos esforcemos para garantir a precisão, recomendamos sempre consultar:
                    </p>
                    <ul className="list-disc list-inside text-white/70 text-sm space-y-1 ml-4 mt-2">
                      <li>Legislação oficial atualizada</li>
                      <li>Jurisprudência dos tribunais superiores</li>
                      <li>Doutrina especializada</li>
                      <li>Materiais didáticos de fontes confiáveis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-white/90 leading-relaxed">
                O SIMULAI OAB <strong>não se responsabiliza</strong> por eventuais imprecisões nas explicações geradas por IA.
                Utilize-as como guia de estudo, não como fonte definitiva.
              </p>
            </section>

            {/* 7. Limitação de Responsabilidade */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitação de Responsabilidade</h2>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">7.1. Sem Garantia de Aprovação</h3>
              <p className="text-white/90 leading-relaxed">
                O SIMULAI OAB é uma <strong>ferramenta de apoio ao estudo</strong>. Não garantimos aprovação no Exame da OAB.
                O sucesso depende do esforço, dedicação e preparo individual de cada estudante.
              </p>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">7.2. Disponibilidade do Serviço</h3>
              <p className="text-white/90 leading-relaxed">
                Não garantimos disponibilidade 100% ininterrupta. Podem ocorrer manutenções programadas ou falhas técnicas.
                Faremos o possível para minimizar interrupções e notificar previamente sobre manutenções.
              </p>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">7.3. Limitação de Danos</h3>
              <p className="text-white/90 leading-relaxed">
                Em nenhuma hipótese seremos responsáveis por danos indiretos, incidentais, especiais ou consequenciais
                decorrentes do uso ou impossibilidade de uso da plataforma.
              </p>
            </section>

            {/* 8. Alterações */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Modificações dos Termos</h2>
              <p className="text-white/90 leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão
                notificadas por e-mail ou através da plataforma com antecedência mínima de 15 dias.
              </p>
              <p className="text-white/90 leading-relaxed mt-4">
                O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* 9. Lei Aplicável */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Lei Aplicável e Foro</h2>
              <p className="text-white/90 leading-relaxed">
                Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de [Cidade], Estado de [Estado],
                para dirimir quaisquer controvérsias decorrentes destes Termos.
              </p>
            </section>

            {/* 10. Contato */}
            <section className="bg-navy-800/30 rounded-lg p-6 border border-navy-700">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contato e Suporte</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Para dúvidas, sugestões ou questões sobre estes Termos de Uso:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white/60 text-sm">Suporte Geral:</div>
                    <a href="mailto:contato@simulaioab.com" className="text-blue-400 hover:text-blue-300">
                      contato@simulaioab.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white/60 text-sm">Questões Jurídicas:</div>
                    <a href="mailto:juridico@simulaioab.com" className="text-blue-400 hover:text-blue-300">
                      juridico@simulaioab.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <a href="https://www.simulaioab.com" className="text-blue-400 hover:text-blue-300">
                    www.simulaioab.com
                  </a>
                </div>
              </div>
              <p className="text-white/60 text-sm mt-4">
                Prazo de resposta: até 5 dias úteis
              </p>
            </section>

            {/* Nota Final */}
            <section className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-white/80 text-sm leading-relaxed">
                <strong>Nota:</strong> Ao utilizar o SIMULAI OAB, você reconhece que leu, compreendeu e concorda com estes Termos de Uso
                e com nossa <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Política de Privacidade</Link>.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
