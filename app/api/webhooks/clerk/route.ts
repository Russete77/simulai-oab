import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET não configurado')
  }

  // Obter headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Obter body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Criar nova instância Svix com o secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verificar payload com headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[webhook.clerk] Erro ao verificar webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  // Obter dados do evento
  const { id } = evt.data
  const eventType = evt.type

  console.log(`[webhook.clerk] Webhook recebido: ${eventType}`, { id })

  try {
    // Evento: Usuário criado
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data

      const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id)
      const email = primaryEmail?.email_address

      if (!email) {
        console.error('[webhook.clerk] Email não encontrado no evento user.created')
        return new Response('Error: Email not found', { status: 400 })
      }

      const name = [first_name, last_name].filter(Boolean).join(' ') || null

      // Criar usuário no banco de dados
      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name,
          profile: {
            create: {
              totalPoints: 0,
              level: 1,
              streak: 0,
              totalQuestions: 0,
              correctAnswers: 0,
              dailyGoal: 20,
            },
          },
        },
      })

      console.log(`[webhook.clerk] Usuário criado: ${email}`, { clerkId: id })
    }

    // Evento: Usuário atualizado
    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data

      const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id)
      const email = primaryEmail?.email_address

      if (!email) {
        console.error('[webhook.clerk] Email não encontrado no evento user.updated')
        return new Response('Error: Email not found', { status: 400 })
      }

      const name = [first_name, last_name].filter(Boolean).join(' ') || null

      // Atualizar usuário no banco de dados
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email,
          name,
          updatedAt: new Date(),
        },
      })

      console.log(`[webhook.clerk] Usuário atualizado: ${email}`, { clerkId: id })
    }

    // Evento: Usuário deletado
    if (eventType === 'user.deleted') {
      const { id } = evt.data

      if (!id) {
        console.error('[webhook.clerk] ID não encontrado no evento user.deleted')
        return new Response('Error: ID not found', { status: 400 })
      }

      // Deletar usuário do banco de dados (cascade deletará profile e relacionados)
      await prisma.user.delete({
        where: { clerkId: id },
      })

      console.log(`[webhook.clerk] Usuário deletado`, { clerkId: id })
    }

    return new Response('Webhook processado com sucesso', { status: 200 })
  } catch (error: any) {
    console.error('[webhook.clerk] Erro ao processar webhook:', {
      eventType,
      error: error?.message ?? String(error),
    })
    return new Response('Error: Processing failed', { status: 500 })
  }
}
