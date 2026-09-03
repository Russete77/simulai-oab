import { Suspense } from 'react';
import { ConfirmacaoClient } from './confirmacao-client';

export const metadata = {
  title: 'Confirmando pagamento',
  robots: { index: false },
};

// useSearchParams exige Suspense: sem isto a página inteira falha ao ser
// pré-renderizada no build.
export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmacaoClient />
    </Suspense>
  );
}
