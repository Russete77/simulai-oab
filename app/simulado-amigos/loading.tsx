import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';

export default function SimuladoAmigosLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-surface-2 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-4 w-96 bg-surface-2 rounded-lg animate-pulse"></div>
        </div>

        {/* Main Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i} variant="glass" className="h-48 animate-pulse"></Card>
          ))}
        </div>

        {/* Tips Skeleton */}
        <Card variant="glass" className="h-32 animate-pulse"></Card>
      </main>
    </div>
  );
}
