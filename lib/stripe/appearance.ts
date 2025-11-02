/**
 * Configuração de aparência do Stripe Elements
 * Personalizado para o design system do Simulai OAB
 */

import { Appearance } from '@stripe/stripe-js';

/**
 * Tema customizado para Stripe Elements
 * Cores baseadas no design system navy/blue do app
 */
export const stripeAppearance: Appearance = {
  theme: 'night',
  variables: {
    // Cores primárias
    colorPrimary: '#3B82F6',        // Blue-500
    colorBackground: '#1E293B',     // Navy-900
    colorText: '#F1F5F9',           // Slate-100
    colorDanger: '#EF4444',         // Red-500
    colorSuccess: '#10B981',        // Green-500

    // Tipografia
    fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
    fontSizeBase: '16px',
    fontWeightNormal: '400',
    fontWeightBold: '600',

    // Espaçamento
    spacingUnit: '4px',
    borderRadius: '12px',

    // Outros
    focusBoxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
  },

  rules: {
    // Inputs gerais
    '.Input': {
      backgroundColor: '#334155',      // Navy-800
      border: '2px solid #475569',     // Navy-700
      color: '#FFFFFF',
      padding: '12px 16px',
      fontSize: '16px',
      boxShadow: 'none',
      transition: 'all 0.2s ease',
    },

    '.Input:hover': {
      borderColor: '#64748B',          // Navy-600
    },

    '.Input:focus': {
      borderColor: '#3B82F6',          // Blue-500
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
      outline: 'none',
    },

    '.Input--invalid': {
      borderColor: '#EF4444',          // Red-500
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)',
    },

    // Labels
    '.Label': {
      color: '#94A3B8',                // Slate-400
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      textTransform: 'none',
    },

    // Mensagens de erro
    '.Error': {
      color: '#FCA5A5',                // Red-300
      fontSize: '14px',
      marginTop: '8px',
    },

    // Tabs (para múltiplos métodos de pagamento)
    '.Tab': {
      backgroundColor: 'transparent',
      border: '2px solid #475569',     // Navy-700
      color: '#94A3B8',                // Slate-400
      padding: '12px 20px',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
    },

    '.Tab:hover': {
      borderColor: '#64748B',          // Navy-600
      color: '#E2E8F0',                // Slate-200
    },

    '.Tab--selected': {
      backgroundColor: '#3B82F6',      // Blue-500
      borderColor: '#3B82F6',
      color: '#FFFFFF',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    },

    // Ícones de métodos de pagamento
    '.TabIcon': {
      fill: 'currentColor',
    },

    '.TabIcon--selected': {
      fill: '#FFFFFF',
    },

    // Container do Payment Element
    '.Block': {
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },

    // Links
    '.Link': {
      color: '#60A5FA',                // Blue-400
      textDecoration: 'none',
    },

    '.Link:hover': {
      color: '#93C5FD',                // Blue-300
      textDecoration: 'underline',
    },
  },
};

/**
 * Opções do Payment Element
 */
export const paymentElementOptions = {
  layout: {
    type: 'tabs' as const,
    defaultCollapsed: false,
  },

  fields: {
    billingDetails: {
      name: 'auto' as const,
      email: 'auto' as const,
      phone: 'auto' as const,
      address: 'auto' as const,
    },
  },

  terms: {
    card: 'auto' as const,
  },

  wallets: {
    applePay: 'auto' as const,
    googlePay: 'auto' as const,
  },
};
