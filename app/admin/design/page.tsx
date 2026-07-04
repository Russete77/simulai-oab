import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Toggle,
  Skeleton,
  Progress,
} from '@/components/ui';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  Search,
  Mail,
  ArrowRight,
  Check,
  Sparkles,
  Bell,
  Plus,
  Filter,
  Zap,
} from 'lucide-react';
import { ShowcaseClient } from './showcase-client';

export const metadata = {
  title: 'Design System · Simulai OAB',
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-surface-overlay backdrop-blur-md">
        <div className="container-page h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-eyebrow">Simulai · Design</span>
            <span className="text-sm text-ink-2">Notion-style · Mai 2026</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container-page py-12 space-y-16">
        {/* Header */}
        <header className="max-w-2xl">
          <p className="text-eyebrow mb-3">Design system</p>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-1 mb-4">
            Linguagem visual.
          </h1>
          <p className="text-lg text-ink-2 leading-relaxed">
            Direção content-first, com tipografia como peça central, espaçamento
            generoso e cor de destaque usada com parcimônia. Funciona claro e escuro.
          </p>
        </header>

        {/* Tokens */}
        <section>
          <SectionHeading
            label="01 · Tokens"
            title="Cores semânticas"
            description="Usadas via CSS vars. Mesma classe (bg-surface, text-ink-1) muda em light/dark automaticamente."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Swatch name="bg" cssVar="--bg" />
            <Swatch name="surface" cssVar="--surface" />
            <Swatch name="surface-2" cssVar="--surface-2" />
            <Swatch name="border" cssVar="--border" />
            <Swatch name="ink-1" cssVar="--text-1" />
            <Swatch name="ink-2" cssVar="--text-2" />
            <Swatch name="ink-3" cssVar="--text-3" />
            <Swatch name="accent" cssVar="--accent" />
            <Swatch name="success" cssVar="--success" />
            <Swatch name="warning" cssVar="--warning" />
            <Swatch name="danger" cssVar="--danger" />
          </div>
        </section>

        {/* Typography */}
        <section>
          <SectionHeading
            label="02 · Tipografia"
            title="Inter · escala calma"
            description="15px base, line-height 1.6 pra leitura confortável. Headings com letter-spacing negativa pra ar premium."
          />
          <div className="space-y-6">
            <div>
              <p className="text-eyebrow mb-1">Display 60</p>
              <p className="text-display">Estude do jeito certo.</p>
            </div>
            <div>
              <p className="text-eyebrow mb-1">Heading 1 — 36</p>
              <h1>5.875 questões. Uma plataforma.</h1>
            </div>
            <div>
              <p className="text-eyebrow mb-1">Heading 2 — 28</p>
              <h2>Simulados, IA e analytics integrados</h2>
            </div>
            <div>
              <p className="text-eyebrow mb-1">Heading 3 — 22</p>
              <h3>Tudo que você precisa pra passar</h3>
            </div>
            <div>
              <p className="text-eyebrow mb-1">Body — 15</p>
              <p className="max-w-2xl text-ink-1">
                Plataforma com 5.875 questões oficiais da OAB, simulados adaptativos,
                analytics de performance e (no Pro) explicações por IA. Sem distração,
                sem complicação — só o necessário pra passar.
              </p>
            </div>
            <div>
              <p className="text-eyebrow mb-1">Body secondary</p>
              <p className="max-w-2xl text-ink-2">
                Texto secundário pra descrição, captions e contexto. Hierarquia
                clara com 3 níveis de tinta (ink-1, ink-2, ink-3).
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <SectionHeading
            label="03 · Botões"
            title="4 variantes, 3 tamanhos"
            description="Sem gradiente, sem glow. Hover sutil, focus ring acessível."
          />
          <div className="space-y-6">
            <Row label="Primary">
              <Button size="sm">Pequeno</Button>
              <Button>Padrão</Button>
              <Button size="lg">
                <Sparkles className="w-4 h-4" />
                Com ícone
              </Button>
              <Button disabled>Disabled</Button>
            </Row>
            <Row label="Secondary">
              <Button variant="secondary" size="sm">Pequeno</Button>
              <Button variant="secondary">Cancelar</Button>
              <Button variant="secondary" size="lg">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </Row>
            <Row label="Ghost">
              <Button variant="ghost" size="sm">Pular</Button>
              <Button variant="ghost">Saiba mais</Button>
              <Button variant="ghost">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Row>
            <Row label="Danger">
              <Button variant="danger" size="sm">Apagar</Button>
              <Button variant="danger">Cancelar assinatura</Button>
            </Row>
          </div>
        </section>

        {/* Cards */}
        <section>
          <SectionHeading
            label="04 · Cards"
            title="Hairline borders, sem glassmorphism"
            description="Apenas elevation no hover quando interativo. Padding generoso por padrão (24px)."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default</CardTitle>
                <CardDescription>
                  Hairline border padrão. Use pra maior parte dos containers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-2">
                  Conteúdo do card. Bem espaçado, leitura confortável.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated</CardTitle>
                <CardDescription>Soft shadow pra destaque visual.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-2">
                  Para painéis flutuantes, dropdowns e popovers.
                </p>
              </CardContent>
            </Card>

            <Card variant="highlighted">
              <CardHeader>
                <CardTitle>Highlighted</CardTitle>
                <CardDescription>Borda com a cor de destaque.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-2">
                  Para item selecionado ou plano em destaque.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <SectionHeading
            label="05 · Inputs"
            title="Formulários sóbrios"
            description="Border de 1px, focus ring suave, mensagens de erro inline."
          />
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
              <Input
                label="Email"
                type="email"
                placeholder="você@exemplo.com"
                leadingIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Buscar questões"
                placeholder="Direito constitucional..."
                leadingIcon={<Search className="w-4 h-4" />}
              />
              <Input
                label="Senha"
                type="password"
                error="Mínimo 8 caracteres"
              />
              <Input
                label="Nome"
                placeholder="Seu nome"
                hint="Como aparece no ranking público"
              />
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <SectionHeading
            label="06 · Badges"
            title="Status compactos"
            description="Para tags, status de subscription, prioridade de notificação."
          />
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="accent">accent</Badge>
            <Badge variant="success">
              <Check className="w-3 h-3" />
              ativo
            </Badge>
            <Badge variant="warning">past due</Badge>
            <Badge variant="danger">cancelado</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="accent" size="sm">11px</Badge>
          </div>
        </section>

        {/* Toggles + Progress */}
        <section>
          <SectionHeading
            label="07 · Controles"
            title="Toggles e progresso"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure como você quer ser avisado</CardDescription>
              </CardHeader>
              <CardContent>
                <ShowcaseClient />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progresso de estudo</CardTitle>
                <CardDescription>Bar com 4px height, accent color</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-ink-2">Constitucional</span>
                      <span className="text-ink-1 text-mono-tabular">68%</span>
                    </div>
                    <Progress value={68} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-ink-2">Civil</span>
                      <span className="text-ink-1 text-mono-tabular">42%</span>
                    </div>
                    <Progress value={42} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-ink-2">Penal</span>
                      <span className="text-ink-1 text-mono-tabular">87%</span>
                    </div>
                    <Progress value={87} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sample: Pricing card */}
        <section>
          <SectionHeading
            label="08 · Sample · Pricing"
            title="Como ficaria a /pricing"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <Card>
              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-semibold">Essencial</h3>
                <p className="text-sm text-ink-2">Tudo pra estudar com seriedade</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-semibold tracking-tight">R$ 19,90</span>
                <span className="text-sm text-ink-3 ml-1">/mês</span>
              </div>
              <ul className="space-y-2 mb-8 text-sm text-ink-2">
                {['5.875 questões oficiais', 'Simulados ilimitados', 'Analytics avançado', 'Flashcards e revisão'].map(
                  (i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>{i}</span>
                    </li>
                  )
                )}
              </ul>
              <Button fullWidth>Assinar Essencial</Button>
            </Card>

            <Card variant="highlighted">
              <div className="flex items-baseline justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Pro</h3>
                  <p className="text-sm text-ink-2">Com IA integrada</p>
                </div>
                <Badge variant="accent">popular</Badge>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-semibold tracking-tight">R$ 89,90</span>
                <span className="text-sm text-ink-3 ml-1">/mês</span>
              </div>
              <ul className="space-y-2 mb-8 text-sm text-ink-2">
                {[
                  'Tudo do Essencial',
                  'Explicações por IA ilimitadas',
                  'Chat com IA em tempo real',
                  'Coaching virtual',
                  'Relatórios em PDF',
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Button fullWidth>Assinar Pro</Button>
            </Card>
          </div>
        </section>

        {/* Sample: Notification list */}
        <section>
          <SectionHeading
            label="09 · Sample · Notificações"
            title="Lista de notificações"
          />
          <Card padding="none">
            <ul>
              {[
                {
                  title: '5.875 questões disponíveis',
                  body: 'O banco completo agora está com você. Comece pelo simulado.',
                  badge: 'novo',
                  badgeVariant: 'accent' as const,
                  unread: true,
                },
                {
                  title: 'Conquista desbloqueada — 7 dias seguidos',
                  body: 'Sua streak passou de 7 dias. Continue mantendo o ritmo.',
                  badge: 'achievement',
                  badgeVariant: 'success' as const,
                  unread: true,
                },
                {
                  title: 'Simulado 2024-03 disponível',
                  body: 'O simulado oficial mais recente já está pronto pra resolver.',
                  badge: 'simulado',
                  badgeVariant: 'default' as const,
                  unread: false,
                },
              ].map((n, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 p-5 hairline first:border-t-0 ${n.unread ? 'bg-accent-soft/30' : ''}`}
                >
                  <Bell className="w-4 h-4 text-ink-3 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="text-sm font-medium text-ink-1">{n.title}</span>
                      <Badge variant={n.badgeVariant} size="sm">
                        {n.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-2">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Skeleton sample */}
        <section>
          <SectionHeading
            label="10 · Loading"
            title="Skeleton states"
          />
          <Card>
            <div className="space-y-3">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </Card>
        </section>

        <hr className="hairline" />

        <footer className="text-center text-sm text-ink-3 pb-8">
          Linguagem visual atualizada · {new Date().toLocaleDateString('pt-BR')}
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="text-eyebrow mb-2">{label}</p>
      <h2 className="text-2xl font-semibold text-ink-1 mb-2">{title}</h2>
      {description && <p className="text-ink-2">{description}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-eyebrow w-24 shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="surface p-3 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-md border shrink-0"
        style={{ background: `var(${cssVar})` }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-1 truncate">{name}</p>
        <p className="text-xs text-ink-3 font-mono truncate">{cssVar}</p>
      </div>
    </div>
  );
}
