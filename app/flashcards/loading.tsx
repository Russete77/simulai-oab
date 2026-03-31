import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';

export default function FlashcardsLoading() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-navy-800 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-4 w-96 bg-navy-800 rounded-lg animate-pulse"></div>
        </div>

        {/* Subject Selector Skeleton */}
        <Card variant="glass" className="mb-8">
          <div className="h-6 w-40 bg-navy-800 rounded-lg mb-4 animate-pulse"></div>
          <div className="flex flex-wrap gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-navy-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </Card>

        {/* Flashcard Skeleton */}
        <div className="mb-8">
          <div className="h-96 bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl animate-pulse border border-white/10"></div>
        </div>

        {/* Subject Badge Skeleton */}
        <div className="text-center mb-6">
          <div className="inline-block h-8 w-24 bg-navy-800 rounded-lg animate-pulse"></div>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-32 bg-navy-800 rounded-lg mb-2 animate-pulse"></div>
          <div className="w-full h-2 bg-navy-800 rounded-full animate-pulse"></div>
        </div>

        {/* Controls Skeleton */}
        <div className="flex items-center justify-between gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 flex-1 bg-navy-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </main>
    </div>
  );
}
