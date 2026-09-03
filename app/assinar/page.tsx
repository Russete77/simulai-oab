import { Suspense } from 'react';
import { AssinarClient } from './assinar-client';

export const metadata = {
  title: 'Finalizar assinatura',
  robots: { index: false },
};

// useSearchParams (o `?ciclo=`) exige Suspense: sem isto a página falha ao
// ser pré-renderizada no build.
export default function AssinarPage() {
  return (
    <Suspense fallback={null}>
      <AssinarClient />
    </Suspense>
  );
}
