'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CORTE_APROVACAO, TOTAL_DA_PROVA } from '@/lib/simulado/exame';

export interface AlternativaJogo {
  label: string;
  texto: string;
  correta: boolean;
}

export interface QuestaoJogo {
  id: string;
  numero: number;
  materia: string;
  enunciado: string;
  alternativas: AlternativaJogo[];
}

interface Props {
  slug: string;
  rotuloExame: string;
  questoes: QuestaoJogo[];
}

type Respostas = Record<string, string>;

function relogio(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const dd = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dd(m)}:${dd(s)}` : `${dd(m)}:${dd(s)}`;
}

/**
 * Simulado que roda sem cadastro.
 *
 * POR QUE SEM LOGIN
 *
 * Quem busca "simulado oab" quer FAZER um simulado. A página mandava para
 * /register, a pessoa voltava para o Google e clicava no concorrente — que
 * deixa começar na hora. Esse retorno é sinal direto de que a página não
 * respondeu à busca, e nenhuma otimização técnica compensa isso.
 *
 * Nada aqui vai ao servidor: as respostas ficam em estado local, salvas no
 * localStorage para sobreviver a um refresh acidental no meio de 80
 * questões. O gabarito viaja junto com a página — o que não é problema,
 * porque as respostas já são públicas em /questoes/[id] desde que abrimos o
 * gabarito comentado.
 *
 * TODAS as questões ficam no DOM, com as inativas em `hidden`. Assim o
 * enunciado inteiro está no HTML servido — é o conteúdo que faz a página
 * valer para busca — enquanto a navegação continua uma questão por vez.
 */
export function SimuladoJogo({ slug, rotuloExame, questoes }: Props) {
  const [respostas, setRespostas] = useState<Respostas>({});
  const [indice, setIndice] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [restaurado, setRestaurado] = useState(false);

  const chave = `simulado:${slug}`;

  // Restaura antes de qualquer escrita, senão o primeiro save apaga o
  // progresso de quem só recarregou a página.
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chave);
      if (salvo) {
        const dados = JSON.parse(salvo) as {
          respostas?: Respostas;
          segundos?: number;
          finalizado?: boolean;
        };
        if (dados.respostas) setRespostas(dados.respostas);
        if (typeof dados.segundos === 'number') setSegundos(dados.segundos);
        if (dados.finalizado) setFinalizado(true);
      }
    } catch {
      // localStorage bloqueado (janela anônima, cookies desligados): o
      // simulado funciona igual, só não sobrevive a um refresh.
    }
    setRestaurado(true);
  }, [chave]);

  useEffect(() => {
    if (!restaurado) return;
    try {
      localStorage.setItem(chave, JSON.stringify({ respostas, segundos, finalizado }));
    } catch {
      // idem
    }
  }, [chave, respostas, segundos, finalizado, restaurado]);

  useEffect(() => {
    if (finalizado || !restaurado) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finalizado, restaurado]);

  const responder = useCallback((questaoId: string, label: string) => {
    setRespostas((r) => ({ ...r, [questaoId]: label }));
  }, []);

  const respondidas = Object.keys(respostas).length;

  const resultado = useMemo(() => {
    let acertos = 0;
    const porMateria: Record<string, { acertos: number; total: number }> = {};

    for (const q of questoes) {
      const escolhida = respostas[q.id];
      const certa = q.alternativas.find((a) => a.correta)?.label;
      const acertou = Boolean(escolhida) && escolhida === certa;
      if (acertou) acertos++;

      porMateria[q.materia] ??= { acertos: 0, total: 0 };
      porMateria[q.materia].total++;
      if (acertou) porMateria[q.materia].acertos++;
    }

    // A prova oficial tem 80 questões e corta em 40. Quando o exame tem
    // menos, a nota é projetada para a escala de 80 — senão "32 acertos"
    // não diz nada sobre passar ou não.
    const projetada = Math.round((acertos / questoes.length) * TOTAL_DA_PROVA);

    return {
      acertos,
      total: questoes.length,
      projetada,
      passou: projetada >= CORTE_APROVACAO,
      porMateria: Object.entries(porMateria)
        .map(([materia, m]) => ({ materia, ...m, taxa: m.acertos / m.total }))
        .sort((a, b) => a.taxa - b.taxa),
    };
  }, [questoes, respostas]);

  const recomecar = () => {
    setRespostas({});
    setIndice(0);
    setSegundos(0);
    setFinalizado(false);
    setConfirmando(false);
  };

  // ---------------------------------------------------------------- resultado

  if (finalizado) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-4">
            <p className="text-eyebrow mb-3">Resultado · {rotuloExame}</p>
            <p className="text-5xl font-semibold tracking-tight text-ink-1 text-mono-tabular">
              {resultado.acertos}
              <span className="text-2xl text-ink-3">/{resultado.total}</span>
            </p>
            <p
              className={[
                'inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full border text-sm font-medium',
                resultado.passou
                  ? 'bg-success-soft border-success/30 text-success'
                  : 'bg-warning-soft border-warning/30 text-warning',
              ].join(' ')}
            >
              {resultado.passou ? <Check className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
              {resultado.passou
                ? `Passaria: ${resultado.projetada} de 80, corte é ${CORTE_APROVACAO}`
                : `Faltaram ${CORTE_APROVACAO - resultado.projetada} para o corte de ${CORTE_APROVACAO}`}
            </p>
            <p className="text-sm text-ink-3 mt-3">
              Tempo: {relogio(segundos)} · {respondidas} de {resultado.total} respondidas
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink-1 mb-1">Por matéria</h2>
          <p className="text-sm text-ink-2 mb-5">Da pior para a melhor — comece por cima.</p>
          <div className="space-y-3">
            {resultado.porMateria.map((m) => (
              <div key={m.materia}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm text-ink-1">{m.materia}</span>
                  <span className="text-sm text-mono-tabular text-ink-2">
                    {m.acertos}/{m.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className={m.taxa >= 0.5 ? 'h-full bg-success' : 'h-full bg-warning'}
                    style={{ width: `${Math.round(m.taxa * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-accent/40">
          <div className="text-center py-4 max-w-xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-ink-1 mb-2">
              Você errou {resultado.total - resultado.acertos}. Sabe por quê?
            </h2>
            <p className="text-ink-2 mb-6 leading-relaxed">
              Crie sua conta e treine só as questões que você errou, acompanhe a
              evolução por matéria e pergunte à IA o que ficou em aberto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg">
                  <span className="flex items-center gap-2">
                    Criar conta grátis
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </Link>
              <Button variant="ghost" size="lg" onClick={recomecar}>
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Refazer
                </span>
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink-1 mb-1">Gabarito comentado</h2>
          <p className="text-sm text-ink-2 mb-5">
            Cada questão tem a explicação completa, com fundamento legal.
          </p>
          <div className="space-y-2">
            {questoes.map((q) => {
              const escolhida = respostas[q.id];
              const certa = q.alternativas.find((a) => a.correta)?.label;
              const acertou = escolhida === certa;

              return (
                <Link
                  key={q.id}
                  href={`/questoes/${q.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-surface-2 hover:bg-surface transition-colors"
                >
                  <span
                    className={[
                      'w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold',
                      !escolhida
                        ? 'bg-surface text-ink-3 border'
                        : acertou
                          ? 'bg-success text-white'
                          : 'bg-danger text-white',
                    ].join(' ')}
                  >
                    {!escolhida ? '—' : acertou ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <X className="w-3.5 h-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-sm text-ink-1 flex-1 min-w-0">
                    Questão {q.numero} · {q.materia}
                  </span>
                  <span className="text-xs text-ink-3 shrink-0">
                    {escolhida ? `Você: ${escolhida}` : 'em branco'} · Certa: {certa}
                  </span>
                  <ChevronRight className="w-4 h-4 text-ink-3 shrink-0" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // ------------------------------------------------------------------ jogando

  const atual = questoes[indice];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-sm text-ink-2">
            Questão <strong className="text-ink-1">{indice + 1}</strong> de {questoes.length}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-2 text-mono-tabular">
            <Clock className="w-4 h-4" />
            {relogio(segundos)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${(respondidas / questoes.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-ink-3 mt-2">{respondidas} respondidas</p>
      </Card>

      {/* Todas no DOM: as inativas ficam em `hidden`. O enunciado inteiro
          precisa estar no HTML servido — é o conteúdo da página. */}
      {questoes.map((q, i) => (
        <Card key={q.id} hidden={i !== indice}>
          <p className="text-eyebrow mb-3">
            {q.materia} · Questão {q.numero}
          </p>
          <p className="text-ink-1/90 leading-relaxed whitespace-pre-wrap mb-6">
            {q.enunciado}
          </p>

          <div
            role="radiogroup"
            aria-label={`Alternativas da questão ${q.numero}`}
            className="space-y-3"
          >
            {q.alternativas.map((alt) => {
              const escolhida = respostas[q.id] === alt.label;
              return (
                <button
                  key={alt.label}
                  type="button"
                  role="radio"
                  aria-checked={escolhida}
                  onClick={() => responder(q.id, alt.label)}
                  className={[
                    'w-full text-left p-4 rounded-xl border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                    escolhida
                      ? 'border-accent bg-accent-soft'
                      : 'bg-surface-2 hover:bg-surface',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-semibold',
                        escolhida ? 'bg-accent text-white' : 'bg-accent-soft text-accent',
                      ].join(' ')}
                    >
                      {alt.label}
                    </span>
                    <span className="text-ink-1/90 leading-relaxed flex-1">{alt.texto}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setIndice((i) => Math.max(0, i - 1))}
          disabled={indice === 0}
        >
          <span className="flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </span>
        </Button>

        {indice < questoes.length - 1 ? (
          <Button onClick={() => setIndice((i) => Math.min(questoes.length - 1, i + 1))}>
            <span className="flex items-center gap-1.5">
              Próxima
              <ChevronRight className="w-4 h-4" />
            </span>
          </Button>
        ) : (
          <Button onClick={() => setConfirmando(true)}>
            <span className="flex items-center gap-1.5">
              <Flag className="w-4 h-4" />
              Finalizar
            </span>
          </Button>
        )}
      </div>

      {/* Atalho para quem quer parar antes do fim, sem ter que navegar até a
          última questão. */}
      {indice < questoes.length - 1 && respondidas > 0 && (
        <p className="text-center">
          <button
            onClick={() => setConfirmando(true)}
            className="text-sm text-ink-3 hover:text-ink-1 underline underline-offset-2 transition-colors"
          >
            Finalizar e ver o resultado
          </button>
        </p>
      )}

      {confirmando && (
        <Card className="border border-warning/40">
          <p className="text-ink-1 font-medium mb-1.5">
            Finalizar com {respondidas} de {questoes.length} respondidas?
          </p>
          <p className="text-sm text-ink-2 mb-5">
            As em branco contam como erro, igual na prova.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setFinalizado(true)}>Ver resultado</Button>
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Continuar respondendo
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
