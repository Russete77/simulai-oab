'use client';

import Image from 'next/image';
import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  priority?: boolean;
}

/**
 * Logo do Simulai OAB que adapta ao tema.
 *
 * O logo PNG é branco. Em light mode aplicamos filter: brightness(0)
 * que vira preto puro. Em dark mode mantém branco.
 *
 * Solução temporária. Pra qualidade superior, criar 2 PNGs:
 *   /logo-light.png (texto preto)
 *   /logo-dark.png (texto branco)
 * E trocar via useTheme().
 */
export function Logo({
  className,
  width = 96,
  height = 32,
  alt = 'Simulai OAB',
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={clsx(
        'w-auto select-none',
        // brightness-0 vira tudo preto em light, dark:brightness-100 mantém original
        'brightness-0 dark:brightness-100',
        // suaviza o switch ao trocar tema
        'transition-[filter] duration-150',
        className
      )}
    />
  );
}
