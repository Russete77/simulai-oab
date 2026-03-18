/**
 * P3 FIX: Zod schema para validação de UserQuestionChat.messages
 *
 * O campo `messages` no Prisma é Json (sem tipagem).
 * Usar estes schemas para validar em runtime antes de salvar/ler.
 */

import { z } from "zod";

// Schema de uma mensagem individual
export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
  timestamp: z.string().datetime({ offset: true }).or(z.string().datetime()),
});

// Schema do array de mensagens
export const ChatMessagesSchema = z.array(ChatMessageSchema).max(100); // Max 100 mensagens por sessão

// Tipos derivados do Zod
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatMessages = z.infer<typeof ChatMessagesSchema>;

/**
 * Valida e faz parse seguro de messages Json do banco
 * Retorna array vazio se inválido (graceful degradation)
 */
export function parseChatMessages(json: unknown): ChatMessages {
  const result = ChatMessagesSchema.safeParse(json);
  if (result.success) {
    return result.data;
  }
  // Log para debug mas não quebra — retorna array vazio
  console.warn("[CHAT] Invalid messages format in DB:", result.error.message);
  return [];
}
