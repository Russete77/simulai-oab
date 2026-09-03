import { Suspense } from 'react';
import { AssinaturaClient } from './assinatura-client';

export const metadata = {
  title: 'Assinatura',
  robots: { index: false },
};

// useSearchParams exige Suspense: sem isto a página falha ao ser
// pré-renderizada no build.
export default function AssinaturaPage() {
  return (
    <Suspense fallback={null}>
      <AssinaturaClient />
    </Suspense>
  );
}
