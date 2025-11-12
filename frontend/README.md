# Frontend — Plataforma de Gestão para Grupos de Networking

Panorama técnico do frontend: arquitetura, tecnologias, como instalar, configurar, executar e testar.

## Visão Geral

- Aplicação Next.js (App Router) com React, organizada em módulos de UI e páginas.
- Integração com API via Axios, com resolução segura de `baseURL`.
- Testes com Jest + Testing Library.

## Tecnologias

- Next.js `16.x`
- React `19.x`
- Axios
- Tailwind CSS `4.x` (via `@tailwindcss/postcss`)
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- ESLint (`eslint`, `eslint-config-next`)

## Estrutura

- `src/app`: páginas e layouts (App Router)
  - Proteções por layout: `src/app/admin/layout.tsx`, `src/app/indications/layout.tsx`
- `src/components`: componentes reutilizáveis
  - `layout/`: AppShell, Sidebar, Header, Breadcrumb
  - `modules/`: DashboardPerformance, ReferralsManager etc.
  - `admin/`: UsersTable e componentes auxiliares
  - `ui/`: Button, Card, Tabs, Input, etc.
  - `providers/`: `AuthProvider` (estado do usuário e token)
- `src/lib/api.ts`: cliente Axios com resolução de `baseURL` e helpers
- `src/functions`: utilitários (ex.: ações de convites)
- `middleware.ts`: lógica intermediária para rotas/proteções (quando necessário)

## Rotas e Redirecionamentos

- Redirecionamentos configurados em `next.config.ts` (ex.: `/indicacoes` → `/indications`).
- Páginas principais: `/login`, `/dashboard`, `/indications`, `/financeiro`, `/admin`.
- Layout de administração (`/admin`) verifica cookie `token` via `headers()`, redirecionando para `/login` se ausente.

## Variáveis de Ambiente

- `NEXT_PUBLIC_API_URL`: URL base da API. Exemplo: `http://localhost:3001`.
  - Em ambiente de browser, se apontar para `http://localhost:3000`, o cliente ajusta automaticamente para `3001` e registra `console.warn`.
  - Página `src/app/env/page.tsx` exibe o valor atual para diagnóstico.

Crie um `.env.local` na raiz do frontend:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Instalação

```
cd frontend
npm install
```

## Execução

- Desenvolvimento:

```
npm run dev
```

- Build de produção:

```
npm run build
```

- Start de produção:

```
npm start
```

Aplicação por padrão roda em `http://localhost:3000`.

## Testes

- Executar testes:

```
npm test
```

- Cobertura:

```
npm run test:coverage
```

Configuração de testes em `jest.config.js`:
- Ambiente `jsdom`, setup em `jest.setup.ts`
- Transform `ts-jest`
- `moduleNameMapper` para CSS Modules e alias `@/` → `src/`
- `coverageThreshold` global em 75%

## Autenticação

- `AuthProvider` armazena `usuario` e `token` em `localStorage` e cookie `token` (para SSR/redirecionamentos).
- Layouts protegidos verificam cookie presente e redirecionam para `/login`.

## Estilo e UI

- Tailwind CSS 4 integrado via PostCSS.
- Ícones: `lucide-react`.

## Troubleshooting

- API base mal configurada: ajuste `NEXT_PUBLIC_API_URL` no `.env.local`.
- Se o frontend tentar chamar porta `3000`, verifique o ajuste automático para `3001` e corrija a env.
- Certifique-se de que a API backend esteja rodando em `http://localhost:3001` para desenvolvimento local.


.
