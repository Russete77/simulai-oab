import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, Badge } from '@/components/ui';
import {
  BookOpen,
  ClipboardList,
  Target,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper';
import { OABCountdown } from '@/components/countdown/oab-countdown';
import { ReadinessCard } from '@/components/readiness/readiness-card';
import { FriendChallengeAnnouncement } from '@/components/announcements/friend-challenge-announcement';
import { getContinuacao, META_DIARIA } from '@/lib/dashboard/continuar';

export const dynamic = 'force-dynamic';

interface ActionProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
}

function ActionCard({ href, icon: Icon, title, body, cta }: ActionProps) {
  return (
    <Link href={href} className="block group">
      <Card interactive className="h-full">
        <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-base font-semibold text-ink-1 mb-1">{title}</h3>
        <p className="text-sm text-ink-2 leading-relaxed mb-4">{body}</p>
        <div className="flex items-center gap-1 text-sm text-accent font-medium group-hover:gap-1.5 transition-all">
          {cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Card>
    </Link>
  );
}

/**
 * Primeiro acesso — nenhuma questão respondida.
 *
 * Antes esta pessoa via quatro zeros ("0 questões · 0% · 0 dias · nível 1")
 * e, logo abaixo, "chance de passar: 3%". 40% dos cadastrados nunca voltaram.
 * Sem histórico não existe desempenho a mostrar: uma ação só, com o custo em
 * minutos declarado e permissão explícita para parar no meio.
 */
function PrimeiroAcesso({ nome }: { nome: string }) {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <OnboardingWrapper />

      <main id="main-content" role="main" className="container-page py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <p className="text-eyebrow mb-3">Bem-vindo, {nome}</p>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-3 leading-tight">
              Vamos descobrir onde
              <br />
              você está agora.
            </h1>

            <p className="text-ink-2 leading-relaxed mb-8 max-w-md">
              20 questões da última prova, sem tempo cronometrado. No fim você vê
              sua nota projetada e as três matérias que mais pesam contra você.
            </p>

            {/* As classes vão no próprio Link: um <a> inline com um span de
                48px dentro fica com caixa de 19px — o botão parece certo, mas
                o alvo de toque e o anel de foco saem errados. */}
            <Link
              href="/diagnostico"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all"
            >
              Começar o diagnóstico
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                <Clock className="w-3.5 h-3.5" />
                cerca de 14 minutos
              </span>
              <span className="text-xs text-ink-3">
                não precisa terminar de uma vez
              </span>
            </div>

            <div className="hairline mt-8 pt-6 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <div className="text-lg font-semibold text-ink-1 text-mono-tabular">
                  5.875
                </div>
                <div className="text-xs text-ink-3 mt-0.5">questões oficiais</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-ink-1 text-mono-tabular">
                  2010–2026
                </div>
                <div className="text-xs text-ink-3 mt-0.5">todos os exames</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-ink-1 text-mono-tabular">
                  17
                </div>
                <div className="text-xs text-ink-3 mt-0.5">matérias</div>
              </div>
            </div>
          </Card>

          <p className="text-center text-sm text-ink-3 mt-6">
            Prefere começar por uma matéria específica?{' '}
            <Link href="/practice" className="text-accent">
              Ir para as questões
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const totalQuestoes = user.profile?.totalQuestions ?? 0;
  const primeiroNome = (user.name || 'Estudante').split(' ')[0];

  // Atalho para revisar a tela de primeiro acesso sem precisar de uma conta
  // zerada. Só em desenvolvimento — em produção o parâmetro é ignorado.
  const previewPrimeiroAcesso =
    process.env.NODE_ENV === 'development' && (await searchParams).novo === '1';

  if (totalQuestoes === 0 || previewPrimeiroAcesso) {
    return <PrimeiroAcesso nome={primeiroNome} />;
  }

  const accuracy = totalQuestoes
    ? Math.round(((user.profile?.correctAnswers ?? 0) / totalQuestoes) * 100)
    : 0;

  const c = await getContinuacao(user.id);
  const metaCumprida = c.faltam === 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <OnboardingWrapper />
      <FriendChallengeAnnouncement />

      <main id="main-content" role="main" className="container-page py-10">
        {/* ================================================================
            UMA AÇÃO PRIMÁRIA — e ela continua o que estava acontecendo.
            Substitui a saudação genérica seguida de seis atalhos iguais.
        ================================================================ */}
        <Card variant="highlighted" className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="flex-1 min-w-0">
              <p className="text-eyebrow text-accent mb-2">
                {c.simuladoEmAndamento
                  ? 'Simulado em andamento'
                  : metaCumprida
                    ? 'Meta de hoje cumprida'
                    : 'Continue de onde parou'}
              </p>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-1 mb-2">
                {c.simuladoEmAndamento ? (
                  <>
                    Você parou na questão{' '}
                    <span className="text-mono-tabular">
                      {c.simuladoEmAndamento.respondidas + 1}
                    </span>{' '}
                    de{' '}
                    <span className="text-mono-tabular">
                      {c.simuladoEmAndamento.total}
                    </span>
                  </>
                ) : metaCumprida ? (
                  <>Você fechou as {META_DIARIA} de hoje, {primeiroNome}.</>
                ) : c.materiaFoco ? (
                  <>
                    {c.materiaFoco.label} — {c.faltam}{' '}
                    {c.faltam === 1 ? 'questão restante' : 'questões restantes'}
                  </>
                ) : (
                  <>
                    {c.faltam} {c.faltam === 1 ? 'questão' : 'questões'} para
                    fechar o dia
                  </>
                )}
              </h1>

              <p className="text-sm text-ink-2 leading-relaxed max-w-lg">
                {c.simuladoEmAndamento ? (
                  <>Retome de onde parou — suas respostas estão salvas.</>
                ) : metaCumprida ? (
                  <>
                    Sequência mantida. Se quiser seguir, um simulado completo é
                    o próximo passo natural.
                  </>
                ) : c.materiaFoco ? (
                  <>
                    É onde você está em {c.materiaFoco.acerto}% de acerto.
                    Terminar leva cerca de {Math.max(1, Math.round(c.faltam * 0.75))}{' '}
                    minutos.
                  </>
                ) : (
                  <>
                    Sessões curtas e diárias valem mais que maratonas. Terminar
                    leva cerca de {Math.max(1, Math.round(c.faltam * 0.75))} minutos.
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Link
                  href={
                    c.simuladoEmAndamento
                      ? `/simulations/${c.simuladoEmAndamento.id}`
                      : metaCumprida
                        ? '/simulations'
                        : c.materiaFoco
                          ? `/practice?subject=${c.materiaFoco.subject}`
                          : '/practice'
                  }
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all"
                >
                  {c.simuladoEmAndamento
                    ? 'Retomar simulado'
                    : metaCumprida
                      ? 'Fazer um simulado'
                      : 'Continuar'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {!c.simuladoEmAndamento && !metaCumprida && (
                  <span className="text-sm text-ink-2">
                    ou{' '}
                    <Link href="/practice" className="text-accent">
                      escolher outra matéria
                    </Link>
                  </span>
                )}
              </div>
            </div>

            {/* Progresso do dia */}
            <div className="lg:w-48 shrink-0">
              <div className="flex items-baseline gap-1.5 lg:justify-end">
                <span className="text-4xl font-semibold tracking-tight text-ink-1 text-mono-tabular">
                  {c.hoje}
                </span>
                <span className="text-xl font-medium text-ink-3 text-mono-tabular">
                  /{META_DIARIA}
                </span>
              </div>
              <div className="text-xs text-ink-3 lg:text-right mt-0.5">
                questões hoje
              </div>
              <div
                className="h-2 rounded-full bg-surface-2 mt-3 overflow-hidden"
                role="progressbar"
                aria-valuenow={c.hoje}
                aria-valuemin={0}
                aria-valuemax={META_DIARIA}
                aria-label="Progresso da meta diária"
              >
                <div
                  className={metaCumprida ? 'h-full bg-success' : 'h-full bg-accent'}
                  style={{
                    width: `${Math.min(100, (c.hoje / META_DIARIA) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-ink-3 lg:text-right mt-2">
                {c.diasNaSemana} de 7 dias com estudo
              </div>
            </div>
          </div>
        </Card>

        {/* Contexto: quanto falta e onde chega */}
        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          <ReadinessCard />
          <OABCountdown />
        </div>

        {/* ================================================================
            TRÊS DESTINOS, NA ORDEM DO USO REAL
            (simulado 80,3% · praticar 48,9% · plano). Os outros vivem no
            menu "Mais" — davam o mesmo peso visual a features de 1%.
        ================================================================ */}
        <section className="mb-10">
          <h2 className="text-eyebrow mb-3">Ir para</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActionCard
              href="/simulations"
              icon={ClipboardList}
              title="Simulado completo"
              body="80 questões, 5 horas, no formato oficial do exame."
              cta="Começar"
            />
            <ActionCard
              href="/practice"
              icon={BookOpen}
              title="Praticar por matéria"
              body="Escolha o assunto e responda no seu ritmo."
              cta="Escolher"
            />
            <ActionCard
              href="/plano-estudos"
              icon={Target}
              title="Plano de estudos"
              body="Cronograma até o dia da prova, ajustado ao seu desempenho."
              cta="Ver plano"
            />
          </div>
        </section>

        {/* ================================================================
            DESEMPENHO — desceu de propósito: é consequência do estudo,
            não uma chamada para a ação.
        ================================================================ */}
        <section>
          <h2 className="text-eyebrow mb-3">Seu desempenho</h2>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-x-10 gap-y-5">
                <div>
                  <div className="text-xl font-semibold text-ink-1 text-mono-tabular">
                    {totalQuestoes}
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">Questões</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-ink-1 text-mono-tabular">
                    {accuracy}%
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">Acerto</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-ink-1 text-mono-tabular">
                    {user.profile?.streak ?? 0}
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {(user.profile?.streak ?? 0) === 1 ? 'Dia seguido' : 'Dias seguidos'}
                  </div>
                </div>
                {c.materiaFoco && (
                  <div>
                    <div className="text-xl font-semibold text-ink-1">
                      {c.materiaFoco.label}
                    </div>
                    <div className="text-xs text-ink-3 mt-0.5">
                      Ponto mais fraco · {c.materiaFoco.acerto}%
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/analytics"
                className="inline-flex items-center gap-1 text-sm text-accent font-medium"
              >
                Ver analytics
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
