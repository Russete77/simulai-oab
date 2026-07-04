import Link from 'next/link';
import { Home, Search, BookOpen, FileText, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Visual */}
        <div className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-ink-1 mb-4">
          Página não encontrada
        </h1>

        <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
          A página que você procura não existe ou foi movida. Que tal continuar seus estudos?
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/"
            className="flex items-center gap-3 p-4 bg-surface-2 border rounded-xl hover:border-accent/50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-accent-soft rounded-lg flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-ink-1 font-medium text-sm">Página inicial</div>
              <div className="text-gray-500 text-xs">Voltar ao início</div>
            </div>
          </Link>

          <Link
            href="/practice"
            className="flex items-center gap-3 p-4 bg-surface-2 border rounded-xl hover:border-accent/50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-purple-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-ink-1 font-medium text-sm">Praticar questões</div>
              <div className="text-gray-500 text-xs">5.875 questões oficiais</div>
            </div>
          </Link>

          <Link
            href="/simulations"
            className="flex items-center gap-3 p-4 bg-surface-2 border rounded-xl hover:border-accent/50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-ink-1 font-medium text-sm">Simulados</div>
              <div className="text-gray-500 text-xs">5 modos de estudo</div>
            </div>
          </Link>

          <Link
            href="/blog"
            className="flex items-center gap-3 p-4 bg-surface-2 border rounded-xl hover:border-accent/50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-ink-1 font-medium text-sm">Blog</div>
              <div className="text-gray-500 text-xs">Dicas e estratégias OAB</div>
            </div>
          </Link>
        </div>

        {/* CTA */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
        >
          Criar conta grátis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
