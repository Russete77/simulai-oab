#!/bin/bash

# Script para iniciar o Stripe webhook listener
# Uso: ./scripts/start-stripe-listener.sh

echo "🚀 Iniciando Stripe webhook listener..."
echo "📡 Encaminhando para: http://localhost:3000/api/webhooks/stripe"
echo ""
echo "💡 Mantenha este terminal aberto para receber eventos de webhook"
echo "⏹️  Pressione Ctrl+C para parar"
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
  echo ""
  echo "Tente executar manualmente:"
  echo '  "$USERPROFILE/scoop/shims/stripe.exe" listen --forward-to localhost:3000/api/webhooks/stripe'
  exit 1
fi

"$STRIPE_CMD" listen --forward-to localhost:3000/api/webhooks/stripe
