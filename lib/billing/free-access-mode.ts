/**
 * MODO DE ACESSO GRATUITO TEMPORÁRIO
 *
 * Permite ativar acesso PREMIUM para todos os usuários
 * sem alterar a estrutura de planos existente.
 *
 * Uso:
 * - ENABLE_FREE_ACCESS_MODE=true
 * - FREE_ACCESS_END_DATE=2025-12-31 (opcional)
 */

/**
 * Verifica se o modo de acesso gratuito está ativo
 */
export function isFreeAccessModeEnabled(): boolean {
  const enabled = process.env.ENABLE_FREE_ACCESS_MODE === 'true';

  // Se não está habilitado, retorna false
  if (!enabled) return false;

  // Se tem data de término, verifica se ainda não expirou
  const endDate = process.env.FREE_ACCESS_END_DATE;
  if (endDate) {
    // Zerar horas para comparar apenas datas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Fim do dia

    return today <= end; // Ativo até o fim do dia especificado
  }

  // Se não tem data de término, está ativo indefinidamente
  return true;
}

/**
 * Retorna a data de término do modo gratuito, se configurada
 */
export function getFreeAccessEndDate(): Date | null {
  const endDate = process.env.FREE_ACCESS_END_DATE;
  if (!endDate) return null;

  try {
    return new Date(endDate);
  } catch {
    return null;
  }
}

/**
 * Retorna quantos dias faltam para o término
 */
export function getDaysUntilEnd(): number | null {
  const endDate = getFreeAccessEndDate();
  if (!endDate) return null;

  // Zerar horas para comparar apenas datas
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
}

/**
 * Verifica se está próximo do fim (2 semanas ou menos)
 */
export function isNearingEnd(): boolean {
  const daysLeft = getDaysUntilEnd();
  return daysLeft !== null && daysLeft <= 14;
}

/**
 * Se modo gratuito ativo, retorna PREMIUM
 * Caso contrário, retorna o plano real do usuário
 */
export function getEffectivePlanType(userPlanType: string): string {
  if (isFreeAccessModeEnabled()) {
    console.log('[FREE_ACCESS_MODE] Modo gratuito ativo - usuário tem acesso PREMIUM');
    return 'PREMIUM';
  }
  return userPlanType;
}

/**
 * Mensagem para exibir no frontend quando modo gratuito está ativo
 */
export function getFreeAccessModeMessage(): string | null {
  if (!isFreeAccessModeEnabled()) return null;

  const daysLeft = getDaysUntilEnd();

  // Se não tem data definida
  if (daysLeft === null) {
    return '🎉 Acesso Premium GRATUITO por tempo limitado! Aproveite todas as funcionalidades.';
  }

  // Se faltam 0 dias (último dia)
  if (daysLeft === 0) {
    return '⚠️ ÚLTIMO DIA de Acesso Premium GRATUITO! Assine para continuar com todos os recursos.';
  }

  // Se está próximo do fim (2 semanas ou menos)
  if (daysLeft <= 14) {
    return `⏰ Acesso Premium GRATUITO termina em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}! Garanta seu plano agora.`;
  }

  // Normal
  const endDate = getFreeAccessEndDate();
  const dateStr = endDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  return `🎉 Acesso Premium GRATUITO até ${dateStr}! Aproveite sem limites.`;
}

/**
 * Dados completos do modo gratuito para o frontend
 */
export interface FreeAccessModeData {
  enabled: boolean;
  message: string | null;
  endDate: string | null;
  daysLeft: number | null;
  isNearingEnd: boolean;
}

export function getFreeAccessModeData(): FreeAccessModeData {
  const enabled = isFreeAccessModeEnabled();
  const endDate = getFreeAccessEndDate();

  return {
    enabled,
    message: getFreeAccessModeMessage(),
    endDate: endDate ? endDate.toISOString() : null,
    daysLeft: getDaysUntilEnd(),
    isNearingEnd: isNearingEnd(),
  };
}
