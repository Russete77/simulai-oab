#!/bin/bash

# Script para triggerar eventos de teste do Stripe
# Uso: ./scripts/stripe-trigger-test.sh [event_type]

EVENT_TYPE=${1:-"customer.subscription.created"}

echo "🧪 Triggering test event: $EVENT_TYPE"
echo ""

# Detectar o caminho correto do Stripe CLI
if [ -f "/c/Users/$USER/scoop/shims/stripe.exe" ]; then
  STRIPE_CMD="/c/Users/$USER/scoop/shims/stripe.exe"
elif [ -f "$HOME/scoop/shims/stripe.exe" ]; then
  STRIPE_CMD="$HOME/scoop/shims/stripe.exe"
elif command -v stripe.exe &> /dev/null; then
  STRIPE_CMD="stripe.exe"
elif command -v stripe &> /dev/null; then
  STRIPE_CMD="stripe"
else
  echo "❌ Erro: Stripe CLI não encontrado!"
  exit 1
fi

"$STRIPE_CMD" trigger "$EVENT_TYPE"

echo ""
echo "✅ Event triggered! Check:"
echo "  1. Stripe CLI terminal for webhook delivery"
echo "  2. Stripe Dashboard: https://dashboard.stripe.com/test/events"
echo "  3. Run: npx tsx scripts/check-webhook-logs.ts"
