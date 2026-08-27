'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

interface AssinarButtonProps {
  children?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Leva o usuário ao checkout da Stripe.
 *
 * Não existe formulário de cartão nosso: pedimos a sessão ao servidor e
 * redirecionamos. O dado do cartão nunca toca a nossa infraestrutura.
 */
export function AssinarButton({
  children = 'Assinar por R$ 9,99/mês',
  className,
  fullWidth,
  variant = 'primary',
  size = 'lg',
}: AssinarButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const assinar = async () => {
    setErro(null);

    if (!isSignedIn) {
      router.push('/register?next=/pricing');
      return;
    }

    // O pagamento acontece dentro do app, em /assinar — sem redirecionar
    // para um domínio da Stripe.
    setCarregando(true);
    router.push('/assinar');
  };

  return (
    <div className={fullWidth ? 'w-full' : undefined}>
      <Button
        onClick={assinar}
        disabled={carregando || !isLoaded}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
      >
        {carregando ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Abrindo...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {children}
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {erro}
        </p>
      )}
    </div>
  );
}
