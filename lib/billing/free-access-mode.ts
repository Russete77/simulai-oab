/**
 * MODO DE ACESSO GRATUITO TEMPORÁRIO
 * 
 * Permite ativar acesso PREMIUM para todos os usuários
 * sem alterar a estrutura de planos existente.
 * 
 * Uso: Definir ENABLE_FREE_ACCESS_MODE=true no .env
 */

/**
 * Verifica se o modo de acesso gratuito está ativo
 */
export function isFreeAccessModeEnabled(): boolean {
  return process.env.ENABLE_FREE_ACCESS_MODE === 'true';
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
  if (isFreeAccessModeEnabled()) {
    return '🎉 Acesso Premium GRATUITO por tempo limitado! Aproveite todas as funcionalidades.';
  }
  return null;
}
