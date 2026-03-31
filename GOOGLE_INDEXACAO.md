# 🚀 Guia Completo: Indexação no Google

## ✅ O que já está pronto

- [x] **Sitemap.xml**: https://simulaioab.com/sitemap.xml
- [x] **Robots.txt**: https://simulaioab.com/robots.txt
- [x] **Google Tag Manager instalado** (GTM-K6H4V9KQ)
- [x] **Metadata SEO**: Título, descrição, keywords
- [x] **Open Graph**: Para compartilhamento no Facebook/LinkedIn
- [x] **Twitter Cards**: Para compartilhamento no Twitter

---

## 📋 Passo a Passo para Indexar

### 1️⃣ Google Search Console

1. **Acesse**: https://search.google.com/search-console
2. **Adicione propriedade**:
   - Escolha "Prefixo do URL"
   - Digite: `https://simulaioab.com`
3. **Verificação**:
   - **Método recomendado**: Tag HTML
   - O Google vai dar um código tipo: `<meta name="google-site-verification" content="ABC123...">`
   - Me avise para eu adicionar no `layout.tsx`

   **OU usar Google Tag Manager** (já instalado):
   - No GSC, escolha "Google Analytics"
   - Como GTM já está instalado, vai verificar automaticamente

4. **Enviar sitemap**:
   - Menu lateral → Sitemaps
   - Digite: `sitemap.xml`
   - Clique em "Enviar"

5. **Solicitar indexação**:
   - Inspeção de URL → Digite sua URL
   - Clique em "Solicitar indexação"
   - Faça isso para as páginas principais:
     - `https://simulaioab.com/`
     - `https://simulaioab.com/pricing`
     - `https://simulaioab.com/login`
     - `https://simulaioab.com/register`

### 2️⃣ Google Analytics 4 (via GTM)

1. **Criar propriedade GA4**:
   - Acesse: https://analytics.google.com
   - Admin → Criar propriedade
   - Nome: "Simulai OAB"
   - Fuso: Brasil (GMT-3)
   - Moeda: Real (BRL)

2. **Criar stream de dados**:
   - Plataforma: Web
   - URL: `https://simulaioab.com`
   - Nome: "Site Simulai OAB"
   - **Copie o ID de medição** (tipo: `G-XXXXXXXXXX`)

3. **Configurar no GTM**:
   - Acesse: https://tagmanager.google.com
   - Container: GTM-K6H4V9KQ
   - **Nova tag**:
     - Tipo: "Google Analytics: GA4 Configuration"
     - ID de medição: `G-XXXXXXXXXX` (cole aqui)
     - Acionador: "All Pages"
   - Clique em "Enviar" → "Publicar"

4. **Eventos para rastrear**:
   - Cadastro completo
   - Login
   - Assinatura de plano
   - Simulado iniciado
   - Simulado concluído
   - Questão respondida

### 3️⃣ Google Business Profile (opcional mas recomendado)

1. **Acesse**: https://business.google.com
2. **Adicione negócio**:
   - Nome: Simulai OAB
   - Categoria: Empresa de software / Educação
   - Website: https://simulaioab.com
3. **Complete informações**:
   - Descrição
   - Horário de atendimento
   - Logo
   - Fotos

---

## 🎯 Metas de conversão no GA4 (configurar depois)

- **Cadastro**: Quando usuário completa sign-up
- **Upgrade**: Quando assina plano pago
- **Engajamento**: Quando completa simulado
- **Retenção**: Login após 7 dias

---

## 🔍 Palavras-chave para monitorar

- simulado oab online
- questões oab
- preparação exame da oab
- simulado oab grátis
- questões comentadas oab
- simulado oab com ia
- oab 1ª fase
- oab 2ª fase
- exame de ordem simulado

---

## 📊 Acompanhamento (primeiras semanas)

1. **Google Search Console**:
   - Desempenho → Ver impressões e cliques
   - Cobertura → Ver páginas indexadas
   - Experiência → Ver Core Web Vitals

2. **Google Analytics**:
   - Aquisição → Ver de onde vêm os usuários
   - Engajamento → Ver páginas mais visitadas
   - Conversões → Ver cadastros/upgrades

---

## ⚡ Próximos passos (após indexação)

- [ ] Criar conta no Bing Webmaster Tools
- [ ] Configurar Google Ads (se for fazer campanhas)
- [ ] Criar Schema.org markup (FAQPage, Course)
- [ ] Otimizar imagens (criar og-image.png 1200x630)
- [ ] Adicionar FAQ na página inicial
- [ ] Criar blog para SEO (opcional)

---

## 📝 Notas importantes

- **Tempo de indexação**: 1-7 dias normalmente
- **Pico de tráfego**: Espere 2-3 semanas para ver resultados
- **Core Web Vitals**: Site já está otimizado (Next.js 15)
- **Mobile-first**: Site totalmente responsivo

**Dúvidas?** Me avise quando terminar cada etapa! 🚀
