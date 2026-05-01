import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';

export default function DesafiosLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-surface-2 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-4 w-96 bg-surface-2 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} variant="glass" className="h-24 animate-pulse"></Card>
          ))}
        </div>

        {/* Overall Progress Skeleton */}
        <Card variant="glass" className="mb-8 h-16 animate-pulse"></Card>

        {/* Challenges Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} variant="glass" className="h-80 animate-pulse"></Card>
          ))}
        </div>
      </main>
    </div>
  );
}
