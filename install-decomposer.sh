#!/usr/bin/env bash
# ============================================================================
# NextJS Decomposer — Installer
# Instala skills e agents do Claude Code para migração automatizada:
# Next.js → React+Vite+CSS Globals (Front) + Node Express Fetch API (Back)
#
# USO:
#   cd ~/seu-projeto-nextjs
#   bash install-decomposer.sh
#
# Ou instalar globalmente (disponível em TODOS os projetos):
#   bash install-decomposer.sh --global
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Detect mode
GLOBAL=false
TARGET_DIR=".claude"

if [[ "${1:-}" == "--global" ]] || [[ "${1:-}" == "-g" ]]; then
  GLOBAL=true
  TARGET_DIR="$HOME/.claude"
  echo -e "${CYAN}${BOLD}⚡ NextJS Decomposer — Instalação GLOBAL${NC}"
  echo -e "${CYAN}   Skills disponíveis em todos os projetos${NC}"
else
  echo -e "${CYAN}${BOLD}⚡ NextJS Decomposer — Instalação LOCAL${NC}"
  echo -e "${CYAN}   Skills disponíveis neste projeto: $(pwd)${NC}"
fi

echo ""

# Check if .claude already exists
if [[ -d "$TARGET_DIR/skills/nextjs-decompose" ]]; then
  echo -e "${YELLOW}⚠  Skill nextjs-decompose já existe em $TARGET_DIR${NC}"
  read -p "   Sobrescrever? (s/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Instalação cancelada.${NC}"
    exit 0
  fi
fi

# Create directory structure
echo -e "${BLUE}📁 Criando estrutura de diretórios...${NC}"
mkdir -p "$TARGET_DIR/skills/nextjs-decompose/references"
mkdir -p "$TARGET_DIR/skills/nextjs-decompose/templates"
mkdir -p "$TARGET_DIR/agents"

# ============================================================================
# CLAUDE.md
# ============================================================================
echo -e "${BLUE}📝 Criando CLAUDE.md...${NC}"
cat > "$TARGET_DIR/CLAUDE.md" << 'CLAUDE_EOF'
# NextJS Decomposer

Framework de migração automatizada: Next.js → React+Vite+CSS Globals (Front) + Node Express Fetch API (Back)

## Skills Disponíveis

- `/nextjs-decompose [project-path]` — Skill principal que orquestra a migração completa em 7 fases
  - PHASE 1: Inventory (scan e classificação de arquivos)
  - PHASE 2: Scaffold (criar projetos frontend e backend)
  - PHASE 3: Routes (file-system routing → React Router v7)
  - PHASE 4: API Routes (Next.js API → Express handlers)
  - PHASE 5: Components (Server Components → Client + API calls)
  - PHASE 6: Infrastructure (env vars, config, auth, db, storage)
  - PHASE 7: Verification (relatório de migração)

## Agents Disponíveis

- `nextjs-route-analyzer` — Analisa routing e gera router.tsx completo
- `nextjs-api-extractor` — Extrai API routes e server actions para Express
- `nextjs-migration-verifier` — Verifica completude da migração

## Referências

Os arquivos de referência em `.claude/skills/nextjs-decompose/references/` contêm:
- `routing-rules.md` — Tabela completa de transformação de rotas
- `api-routes-rules.md` — Transformação de API routes, middleware, server actions
- `component-rules.md` — Transformação de componentes, imports, env vars, CSS

## Stack de Destino

- **Frontend**: React 19 + Vite 8 + React Router v7 (Data Mode) + CSS Globals
- **Backend**: Node.js + Express 5 + TypeScript + tsx (dev runner)
- **Comunicação**: Fetch API com credentials: 'include'
- **Proxy Dev**: Vite proxy /api → Express localhost:4000

## Regras Importantes

1. NUNCA perder funcionalidade — 100% de paridade funcional
2. NUNCA deixar imports de `next/` no frontend
3. NUNCA deixar `process.env` no frontend (usar `import.meta.env`)
4. NUNCA deixar `"use client"` ou `"use server"` no frontend
5. SEMPRE usar `try/catch` + `next(error)` em handlers Express
6. SEMPRE usar `React.lazy()` + `Suspense` para code splitting
7. SEMPRE gerar relatório de migração ao final
CLAUDE_EOF

# ============================================================================
# SKILL.md — Main orchestrator
# ============================================================================
echo -e "${BLUE}🔧 Criando skill principal (nextjs-decompose)...${NC}"
cat > "$TARGET_DIR/skills/nextjs-decompose/SKILL.md" << 'SKILL_EOF'
---
name: nextjs-decompose
description: >
  Decomposes a Next.js project into React+Vite (frontend) + Express+Node (backend),
  preserving 100% functional fidelity. Handles routing, API routes, server components,
  middleware, auth, images, env vars, and generates two separate deployable projects.
  Use when migrating, refactoring, or decomposing any Next.js App Router or Pages Router project.
argument-hint: [project-path]
disable-model-invocation: true
effort: max
allowed-tools: Read Grep Glob Bash Edit Write
---

# NextJS Decomposer — Migration Skill

You are an expert migration engineer. Your job is to decompose a Next.js project into two separate, fully functional projects:

- **Frontend**: React + Vite + CSS Globals + React Router v7
- **Backend**: Node.js + Express + Fetch API

## CRITICAL RULES

1. **100% functional fidelity** — Every feature in the original Next.js app MUST work identically after migration
2. **Never lose code** — Every file must be accounted for in the migration report
3. **Clean code** — Output must be production-grade, well-organized TypeScript
4. **No shortcuts** — Handle every edge case: dynamic routes, middleware, server components, API routes, auth, images, env vars
5. **Atomic commits** — Migrate in phases, verify each phase before proceeding

## EXECUTION FLOW

Execute these 7 phases IN ORDER. After each phase, report what was done and verify before proceeding.

---

### PHASE 1: INVENTORY

Scan the entire Next.js project and classify every file.

```
!`find $ARGUMENTS -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.json" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | head -200`
```

For each file, classify as:
- **FRONT** — UI components, pages, layouts, styles, client hooks
- **BACK** — API routes, server actions, database connections, server-only utilities
- **SHARED** — Types, constants, utils used by both
- **CONFIG** — next.config, tsconfig, package.json, env files, tailwind config

Detect and report:
- [ ] Router type: App Router or Pages Router (check for `app/` vs `pages/` directory)
- [ ] Auth provider: NextAuth, Clerk, custom JWT, Supabase Auth, etc.
- [ ] Database: Prisma, Drizzle, direct pg/mysql, Supabase client
- [ ] CSS strategy: Tailwind, CSS Modules, styled-components, plain CSS
- [ ] State management: Zustand, Redux, Jotai, Context API
- [ ] Data fetching: Server Components, getServerSideProps, SWR, TanStack Query
- [ ] Image handling: next/image usage count
- [ ] API routes: list all routes in `app/api/` or `pages/api/`
- [ ] Middleware: check for `middleware.ts` at root
- [ ] Server Actions: grep for `"use server"` directives
- [ ] Environment variables: list all `NEXT_PUBLIC_` and server-only vars

Output a `MIGRATION_INVENTORY.md` with the full classification.

---

### PHASE 2: SCAFFOLD

Create the two project directories with boilerplate configs.

**Frontend** (`frontend/`):
- `package.json` — React 19, react-router v7, vite 8, @vitejs/plugin-react
- `vite.config.ts` — React plugin, path aliases (@/), proxy /api → backend
- `tsconfig.json` — Strict, path aliases, vite/client types
- `index.html` — Root HTML entry point
- `src/main.tsx` — React root render
- `src/App.tsx` — Router setup placeholder
- `src/globals.css` — Global styles (migrate from Next.js globals)
- `.env` — VITE_ prefixed vars from NEXT_PUBLIC_ vars

**Backend** (`backend/`):
- `package.json` — Express 5, cors, helmet, dotenv, cookie-parser, tsx
- `tsconfig.json` — Node target, strict
- `src/server.ts` — Express app setup with middleware
- `src/routes/index.ts` — Route aggregator
- `.env` — Server-only vars from original .env

Use the templates in [templates/](templates/) as starting points.

---

### PHASE 3: ROUTES

Transform Next.js file-system routing into React Router v7 Data Mode config.

For complete transformation rules, see [references/routing-rules.md](references/routing-rules.md).

Summary:
1. Scan all `page.tsx` files to build route tree
2. Convert `layout.tsx` → Layout components with `<Outlet />`
3. Convert `loading.tsx` → `<Suspense fallback={}>` wrappers
4. Convert `error.tsx` → `errorElement` in route config
5. Convert `not-found.tsx` → catch-all `path: "*"` route
6. Convert `[param]` → `:param`, `[...catchAll]` → `*`, `(group)` → pathless wrapper
7. Generate `src/router.tsx` with full `createBrowserRouter` config
8. Use `React.lazy()` + `Suspense` for every page (code splitting)
9. Transform all Link/router imports (next/link → react-router, next/navigation → react-router)

---

### PHASE 4: API ROUTES

Extract every API route from Next.js to Express route handlers.

For complete transformation rules, see [references/api-routes-rules.md](references/api-routes-rules.md).

Summary:
1. Find all `route.ts` in `app/api/` or handlers in `pages/api/`
2. Create Express route for each, converting NextRequest/NextResponse → Express req/res
3. Move `middleware.ts` logic to Express middleware
4. Convert Server Actions (`"use server"`) to Express POST endpoints
5. Register all routes in `backend/src/routes/index.ts`
6. Wrap async handlers with try/catch + next(error)

---

### PHASE 5: COMPONENTS

Migrate all React components from Next.js to plain React+Vite.

For complete transformation rules, see [references/component-rules.md](references/component-rules.md).

Summary:
1. Server Components → Client Components + API calls (extract data fetching to Express)
2. Remove `"use client"` and `"use server"` directives
3. Replace next/image → native `<img loading="lazy">`
4. Replace next/head / generateMetadata → react-helmet-async
5. Replace next/link → react-router Link
6. Migrate CSS (copy globals, keep CSS modules, update Tailwind content paths)

---

### PHASE 6: INFRASTRUCTURE

1. Rename `NEXT_PUBLIC_*` → `VITE_*`, replace `process.env.NEXT_PUBLIC_` → `import.meta.env.VITE_`
2. Create `vite-env.d.ts` with ImportMetaEnv interface
3. Migrate next.config.js rewrites/redirects → Vite proxy + Express middleware
4. Move ALL database, storage, email code to backend only
5. Migrate auth (NextAuth → Passport/JWT, Clerk → @clerk/express, Supabase → both sides)

---

### PHASE 7: VERIFICATION

1. Check for remaining `next/` imports, `NEXT_PUBLIC_`, `process.env`, `"use client"`, `"use server"`
2. Compare route counts (original vs migrated)
3. Compare API endpoint counts
4. Verify all source files accounted for
5. Generate `MIGRATION_REPORT.md` with full mapping tables and TODO list

---

## IMPORTANT NOTES

- If Pages Router: `getServerSideProps` → Express + useEffect, `getStaticProps` → Express + cache, `_app.tsx` → App.tsx, `_document.tsx` → index.html
- For SEO-critical projects, recommend Vike (vite-plugin-ssr) instead of plain CSR
- Always ask user before dropping SSR capabilities
SKILL_EOF

# ============================================================================
# REFERENCE: Routing Rules
# ============================================================================
echo -e "${BLUE}📖 Criando referência de rotas...${NC}"
cat > "$TARGET_DIR/skills/nextjs-decompose/references/routing-rules.md" << 'ROUTING_EOF'
# Routing Transformation Rules
# Next.js File-System Routing → React Router v7 Data Mode

## Route Path Conversion

| Next.js Path | React Router Path | Example URL |
|---|---|---|
| `app/page.tsx` | `{ index: true }` | `/` |
| `app/about/page.tsx` | `{ path: "about" }` | `/about` |
| `app/blog/[slug]/page.tsx` | `{ path: "blog/:slug" }` | `/blog/my-post` |
| `app/blog/[...slug]/page.tsx` | `{ path: "blog/*" }` | `/blog/2024/01/post` |
| `app/shop/[[...slug]]/page.tsx` | Two routes: index + catch-all | `/shop` or `/shop/cat` |
| `app/(marketing)/about/page.tsx` | `{ path: "about" }` | `/about` (group stripped) |

## Layout → Outlet

```tsx
// BEFORE: app/dashboard/layout.tsx
export default function Layout({ children }) {
  return <div><Sidebar /><main>{children}</main></div>;
}

// AFTER: frontend/src/layouts/DashboardLayout.tsx
import { Outlet } from 'react-router';
export function DashboardLayout() {
  return <div><Sidebar /><main><Outlet /></main></div>;
}
```

## Loading → Suspense

```tsx
// BEFORE: app/dashboard/loading.tsx → loading UI while page loads
// AFTER: Wrap lazy-loaded page in Suspense
const Dashboard = lazy(() => import('./pages/Dashboard'));
{ path: "dashboard", element: <Suspense fallback={<Loading />}><Dashboard /></Suspense> }
```

## Error → errorElement

```tsx
// BEFORE: app/dashboard/error.tsx
// AFTER:
import { useRouteError, useNavigate } from 'react-router';
export function ErrorBoundary() {
  const error = useRouteError() as Error;
  return <div><h2>Error</h2><p>{error.message}</p><button onClick={() => navigate(0)}>Retry</button></div>;
}
// Route config: { path: "dashboard", errorElement: <ErrorBoundary /> }
```

## Hook Migration

| Next.js | React Router v7 |
|---|---|
| `useRouter().push(url)` | `useNavigate()(url)` |
| `useRouter().replace(url)` | `navigate(url, { replace: true })` |
| `useRouter().back()` | `navigate(-1)` |
| `useRouter().refresh()` | `navigate(0)` |
| `usePathname()` | `useLocation().pathname` |
| `useSearchParams()` | `useSearchParams()` (same name, from 'react-router') |
| `useParams()` | `useParams()` (same name, from 'react-router') |
| `redirect(url)` | In loader: `return redirect(url)` / In component: `navigate(url)` |
| `notFound()` | `throw new Response("", { status: 404 })` |

## Link Migration

```tsx
// BEFORE                           // AFTER
<Link href="/about">               <Link to="/about">
<Link href={`/blog/${s}`}>         <Link to={`/blog/${s}`}>
<Link href="/x" replace>           <Link to="/x" replace>
```

## Full Router Template

```tsx
import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';
import { RootLayout } from './layouts/RootLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { NotFound } from './pages/NotFound';

const Home = lazy(() => import('./pages/Home'));
// ... more lazy imports

function withSuspense(C: React.LazyExoticComponent<any>) {
  return <Suspense fallback={<Loading />}><C /></Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: withSuspense(Home) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```
ROUTING_EOF

# ============================================================================
# REFERENCE: API Routes Rules
# ============================================================================
echo -e "${BLUE}📖 Criando referência de API routes...${NC}"
cat > "$TARGET_DIR/skills/nextjs-decompose/references/api-routes-rules.md" << 'API_EOF'
# API Route & Middleware Transformation Rules

## API Route → Express Handler

```typescript
// BEFORE: app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const users = await prisma.user.findMany({ skip: (page-1)*10, take: 10 });
  return NextResponse.json(users);
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}

// AFTER: backend/src/routes/users.ts
import { Router, Request, Response, NextFunction } from 'express';
const router = Router();
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const users = await prisma.user.findMany({ skip: (page-1)*10, take: 10 });
    res.json(users);
  } catch (error) { next(error); }
});
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
  } catch (error) { next(error); }
});
export { router as usersRouter };
```

## Request/Response Mapping

| Next.js | Express |
|---|---|
| `request.url` | `req.originalUrl` |
| `request.json()` | `req.body` (with express.json()) |
| `request.formData()` | `req.body` (with multer) |
| `new URL(request.url).searchParams` | `req.query` |
| `request.cookies.get('name')` | `req.cookies.name` (cookie-parser) |
| `request.headers.get('x')` | `req.headers['x']` |
| `NextResponse.json(data)` | `res.json(data)` |
| `NextResponse.json(d, {status:201})` | `res.status(201).json(d)` |
| `NextResponse.redirect(url)` | `res.redirect(url)` |
| `NextResponse.next()` | `next()` |
| `cookies().set(n,v,opts)` | `res.cookie(n,v,opts)` |
| `cookies().delete(n)` | `res.clearCookie(n)` |
| Dynamic params (2nd arg) | `req.params` |

## Middleware Conversion

```typescript
// BEFORE: middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token && request.nextUrl.pathname.startsWith('/dashboard'))
    return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };

// AFTER: backend/src/middleware/auth.ts
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // verify token...
  next();
}
// Usage: app.use('/api/dashboard', authMiddleware, dashboardRouter);
```

NOTE: Auth redirect splits — backend returns 401, frontend catches and redirects to /login.

## Server Action → Express POST

```typescript
// BEFORE: 'use server' function
// AFTER: Express POST endpoint + frontend fetch call
```

## Route Registration

```typescript
// backend/src/routes/index.ts
import { Router } from 'express';
const router = Router();
router.use('/auth', authRouter);
router.use('/users', authMiddleware, usersRouter);
router.use('/posts', postsRouter);
export { router as apiRouter };
// In server.ts: app.use('/api', apiRouter);
```
API_EOF

# ============================================================================
# REFERENCE: Component Rules
# ============================================================================
echo -e "${BLUE}📖 Criando referência de componentes...${NC}"
cat > "$TARGET_DIR/skills/nextjs-decompose/references/component-rules.md" << 'COMP_EOF'
# Component & Import Transformation Rules

## Import Find & Replace (ALL frontend files)

```
import Link from 'next/link'                    → import { Link } from 'react-router'
import { useRouter } from 'next/navigation'     → import { useNavigate } from 'react-router'
import { usePathname } from 'next/navigation'   → import { useLocation } from 'react-router'
import { useSearchParams } from 'next/navigation' → import { useSearchParams } from 'react-router'
import { useParams } from 'next/navigation'     → import { useParams } from 'react-router'
import Image from 'next/image'                  → REMOVE (use <img loading="lazy">)
import Script from 'next/script'                → REMOVE (use <script> or react-helmet-async)
import Head from 'next/head'                    → import { Helmet } from 'react-helmet-async'
import { cookies } from 'next/headers'          → REMOVE (server-only, moved to Express)
import { headers } from 'next/headers'          → REMOVE (server-only, moved to Express)
import { redirect } from 'next/navigation'      → import { useNavigate } from 'react-router'
import { revalidatePath } from 'next/cache'     → REMOVE (use SWR mutate or query invalidation)
```

## Directives — REMOVE ALL
```
'use client'  → REMOVE (everything is client in Vite)
'use server'  → REMOVE (server code moved to Express)
```

## Server Component → Client + API

BEFORE (async server component with DB access):
```tsx
export default async function UsersPage() {
  const users = await prisma.user.findMany();
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

AFTER — two files:
```typescript
// backend/src/routes/users.ts
router.get('/', async (req, res, next) => {
  try { res.json(await prisma.user.findMany()); }
  catch (e) { next(e); }
});
```
```tsx
// frontend/src/pages/Users.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/users').then(setUsers).finally(() => setLoading(false));
  }, []);
  if (loading) return <div>Loading...</div>;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

## next/image → native img
```tsx
// BEFORE
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />
// AFTER
<img src="/hero.jpg" alt="Hero" width={1200} height={600} />

// BEFORE (fill mode)
<Image src="/bg.jpg" alt="" fill className="object-cover" />
// AFTER
<img src="/bg.jpg" alt="" className="w-full h-full object-cover" />
```

## Metadata → react-helmet-async
```tsx
// Setup once in main.tsx:
import { HelmetProvider } from 'react-helmet-async';
<HelmetProvider><App /></HelmetProvider>

// In pages:
import { Helmet } from 'react-helmet-async';
<Helmet><title>Page Title</title><meta name="description" content="..." /></Helmet>
```

## Environment Variables
```
process.env.NEXT_PUBLIC_API_URL → import.meta.env.VITE_API_URL
NEXT_PUBLIC_XXX=               → VITE_XXX=
```

Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_API_URL: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
```

## CSS Migration
- `globals.css` → copy to `frontend/src/globals.css`, import in main.tsx
- CSS Modules → no changes (Vite supports .module.css natively)
- Tailwind → copy config, update content paths to `['./index.html', './src/**/*.{ts,tsx}']`
- Static assets: `public/` → `frontend/public/`

## API Client Utility
```typescript
// frontend/src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api';
export async function api<T>(endpoint: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HTTP ${res.status}`); }
  if (res.status === 204) return undefined as T;
  return res.json();
}
export const apiGet = <T>(url: string) => api<T>(url);
export const apiPost = <T>(url: string, body?: unknown) => api<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T>(url: string, body?: unknown) => api<T>(url, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = <T>(url: string) => api<T>(url, { method: 'DELETE' });
```
COMP_EOF

# ============================================================================
# TEMPLATES
# ============================================================================
echo -e "${BLUE}📋 Criando templates...${NC}"

cat > "$TARGET_DIR/skills/nextjs-decompose/templates/vite-config.md" << 'TVITE_EOF'
# Vite Config Template

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
})
```
TVITE_EOF

cat > "$TARGET_DIR/skills/nextjs-decompose/templates/express-server.md" << 'TEXPR_EOF'
# Express Server Template

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { apiRouter } from './routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message });
});

app.listen(PORT, () => console.log(`Backend: http://localhost:${PORT}`));
```

## Route Aggregator (`src/routes/index.ts`)

```typescript
import { Router } from 'express';
const router = Router();
// router.use('/auth', authRouter);
// router.use('/users', authMiddleware, usersRouter);
router.get('/', (_req, res) => res.json({ message: 'API running' }));
export { router as apiRouter };
```
TEXPR_EOF

cat > "$TARGET_DIR/skills/nextjs-decompose/templates/package-frontend.md" << 'TPKGF_EOF'
# Frontend package.json Template

```json
{
  "name": "PROJECT-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.6.0",
    "react-helmet-async": "^2.0.5"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "~5.8.0",
    "vite": "^8.0.0"
  }
}
```

Add conditionally: tailwindcss, swr, @tanstack/react-query, zustand as needed.
TPKGF_EOF

cat > "$TARGET_DIR/skills/nextjs-decompose/templates/package-backend.md" << 'TPKGB_EOF'
# Backend package.json Template

```json
{
  "name": "PROJECT-backend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "dotenv": "^16.5.0",
    "cookie-parser": "^1.4.7"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.7",
    "typescript": "~5.8.0",
    "tsx": "^4.19.0"
  }
}
```

Add conditionally: @prisma/client, drizzle-orm, @supabase/supabase-js, jsonwebtoken, multer, sharp, resend, bullmq as needed.
TPKGB_EOF

# ============================================================================
# AGENTS
# ============================================================================
echo -e "${BLUE}🤖 Criando agents...${NC}"

cat > "$TARGET_DIR/agents/nextjs-route-analyzer.md" << 'AGENT1_EOF'
---
name: nextjs-route-analyzer
description: >
  Analyzes a Next.js project's routing structure and generates a complete
  React Router v7 configuration. Use when mapping file-system routes to
  code-based routes during Next.js decomposition.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are an expert at Next.js and React Router. Analyze the project's file-system routing and produce:
1. `ROUTE_MAP.md` — Table: every Next.js route → React Router route
2. `router.tsx` — Complete createBrowserRouter config with lazy imports + Suspense

Rules:
- EVERY page.tsx = route entry
- EVERY layout.tsx = component with <Outlet />
- EVERY loading.tsx = <Suspense fallback={}>
- EVERY error.tsx = errorElement
- Use React.lazy() for ALL pages
- [param] → :param, [...catch] → *, (group) → pathless wrapper
AGENT1_EOF

cat > "$TARGET_DIR/agents/nextjs-api-extractor.md" << 'AGENT2_EOF'
---
name: nextjs-api-extractor
description: >
  Extracts all API routes and server actions from a Next.js project and
  converts them to Express route handlers.
tools: Read, Grep, Glob, Bash, Write
model: sonnet
---

You are an expert at Next.js API routes and Express. Extract every API route, server action, and middleware:

1. Find all route.ts in app/api/ and pages/api/
2. Find all "use server" functions
3. Find middleware.ts
4. Convert each to Express handlers:
   - NextRequest → Express Request
   - NextResponse.json() → res.json()
   - request.json() → req.body
   - searchParams → req.query
   - Wrap in try/catch + next(error)
5. Register in routes/index.ts
6. Output API_MAP.md with original → express mapping
AGENT2_EOF

cat > "$TARGET_DIR/agents/nextjs-migration-verifier.md" << 'AGENT3_EOF'
---
name: nextjs-migration-verifier
description: >
  Verifies a completed Next.js migration for completeness. Checks for
  remaining Next.js artifacts, missing routes, and generates a report.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a QA engineer. Audit the migration:

1. Grep for remaining next/ imports in frontend (MUST be zero)
2. Grep for "use client"/"use server" directives (MUST be zero)
3. Grep for NEXT_PUBLIC_ and process.env in frontend (MUST be zero)
4. Grep for "next" in package.json (MUST be zero)
5. Compare page.tsx count vs router.tsx route count
6. Compare route.ts count vs backend route file count
7. Check public/ assets were copied

Output MIGRATION_REPORT.md with:
- Passed/failed checks
- Route parity table
- API parity table
- Env var mapping table
- Manual TODO list
AGENT3_EOF

# ============================================================================
# Done!
# ============================================================================
echo ""
echo -e "${GREEN}${BOLD}✅ NextJS Decomposer instalado com sucesso!${NC}"
echo ""
echo -e "   ${BOLD}Arquivos criados:${NC}"
echo -e "   📄 $TARGET_DIR/CLAUDE.md"
echo -e "   🔧 $TARGET_DIR/skills/nextjs-decompose/SKILL.md"
echo -e "   📖 $TARGET_DIR/skills/nextjs-decompose/references/ (3 arquivos)"
echo -e "   📋 $TARGET_DIR/skills/nextjs-decompose/templates/ (4 arquivos)"
echo -e "   🤖 $TARGET_DIR/agents/ (3 agents)"
echo ""
echo -e "   ${BOLD}Como usar:${NC}"
echo -e "   ${CYAN}cd seu-projeto-nextjs${NC}"
echo -e "   ${CYAN}claude${NC}"
echo -e "   ${CYAN}> /nextjs-decompose .${NC}"
echo ""

if [[ "$GLOBAL" == true ]]; then
  echo -e "   ${YELLOW}Modo global: skill disponível em QUALQUER projeto.${NC}"
else
  echo -e "   ${YELLOW}Modo local: skill disponível apenas neste projeto.${NC}"
  echo -e "   ${YELLOW}Para instalar globalmente: bash install-decomposer.sh --global${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Pronto para decompor Next.js!${NC}"
