'use client';

import Image from 'next/image';
import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
  /** Altura do logo em px. A largura é derivada da proporção. */
  height?: number;
  alt?: string;
  priority?: boolean;
  /** Só o selo, sem a palavra. Para espaços estreitos e para o menu mobile. */
  markOnly?: boolean;
}

// Proporções reais dos recortes em public/
const WORDMARK_RATIO = 1018 / 487; // ~2.09
const BADGE_RATIO = 486 / 487; // ~1 (quadrado)

/**
 * Logo do Simulai OAB.
 *
 * O logo é composto de duas peças com necessidades opostas de tema:
 *
 *   SIMUL  — texto vazado, precisa inverter com o tema
 *   [Ai]   — selo azul-marinho com glifos brancos DENTRO
 *
 * Antes era um PNG único com `brightness-0` no modo claro. Isso pintava a
 * imagem inteira de preto, inclusive o "Ai" branco de dentro do selo — o
 * resultado era um bloco preto sólido no lugar da marca.
 *
 * Agora são dois recortes: o filtro de tema cai só no wordmark, e o selo
 * mantém as cores originais nos dois temas.
 */
export function Logo({
  className,
  height = 32,
  alt = 'Simulai OAB',
  priority = false,
  markOnly = false,
}: LogoProps) {
  const badge = (
    <Image
      src="/logo-badge.png"
      alt={markOnly ? alt : ''}
      aria-hidden={markOnly ? undefined : true}
      width={Math.round(height * BADGE_RATIO)}
      height={height}
      priority={priority}
      className="w-auto select-none"
      style={{ height }}
    />
  );

  if (markOnly) {
    return <span className={clsx('inline-flex items-center', className)}>{badge}</span>;
  }

  return (
    <span
      className={clsx('inline-flex items-center', className)}
      style={{ gap: Math.round(height * 0.22) }}
    >
      <Image
        src="/logo-wordmark.png"
        alt={alt}
        width={Math.round(height * WORDMARK_RATIO)}
        height={height}
        priority={priority}
        className={clsx(
          'w-auto select-none',
          // O wordmark é branco no arquivo: preto no claro, branco no escuro.
          'brightness-0 dark:brightness-100',
          'transition-[filter] duration-150'
        )}
        style={{ height }}
      />
      {badge}
    </span>
  );
}
