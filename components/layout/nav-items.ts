import {
  Home,
  BookOpen,
  ClipboardList,
  Target,
  Trophy,
  Users,
  BarChart3,
  User,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Navegação primária — o laço diário do aluno.
 *
 * Quatro itens, escolhidos pelo uso real medido em 25/08/2026 sobre 309
 * usuários ativos: simulados (80,3%), praticar (48,9%), plano e o início.
 * O resto desceu para o menu "Mais": aparecia com o mesmo peso visual de
 * coisas usadas por 1% da base.
 */
export const NAV_PRIMARY: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/practice', label: 'Praticar', icon: BookOpen },
  { href: '/simulations', label: 'Simulados', icon: ClipboardList },
  { href: '/plano-estudos', label: 'Plano', icon: Target },
];

/** Secundária — acessada de vez em quando, não todo dia. */
export const NAV_SECONDARY: NavItem[] = [
  { href: '/simulado-amigos', label: 'Desafiar um amigo', icon: Users },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/perfil', label: 'Meu perfil', icon: User },
  { href: '/pricing', label: 'Planos', icon: Sparkles },
];
