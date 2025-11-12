# Plataforma de Gestão para Grupos de Networking — Visão Geral do Projeto

Este documento apresenta o funcionamento completo da aplicação (frontend + backend), arquitetura, módulos, papéis de usuário, principais fluxos (autenticação, cadastro por convite, indicações, financeiro), como instalar e executar.

## Sumário

- Visão Geral e Arquitetura
- Módulos do Sistema
- Papéis e Permissões (Admin x Membro)
- Primeira Tela e Fluxos Principais
- Como criar usuário (fluxo de convite)
- Instalação e Execução
- Variáveis de Ambiente
- Estrutura de Pastas
- Troubleshooting

## Visão Geral e Arquitetura

- Backend: API REST construída com NestJS (TypeScript), ORM Sequelize (sequelize-typescript) e banco SQLite por padrão.
- Frontend: Next.js (App Router) com React, autenticação baseada em JWT, integração com a API via Axios.
- Testes: Jest (backend e frontend) com cenários unitários e E2E.
- Autenticação: JWT; token é gravado em cookie (`token`) e em `localStorage` no navegador.

## Módulos do Sistema

- Autenticação (backend: `AuthModule` / frontend: `AuthProvider`)
  - Login gera JWT; frontend armazena cookie e estado do usuário.
- Usuários (backend: `UsersModule` / frontend: Admin › Users)
  - Listar, editar dados do usuário, ativar/inativar, alterar papel (admin/membro).
- Convites (backend: `InvitesModule`)
  - Geração e validação de tokens de convite para cadastro de novos usuários.
- Intenções (backend: `IntentionsModule`)
  - Solicitações/intenções de participação; atualização de status.
- Membros (backend: `MembersModule`)
  - Entidades de membros com dados básicos.
- Indicações (backend: `ReferralsModule` e `Thanks`; frontend: páginas em `/indications` e layout protegido)
  - Indicações enviadas/recebidas, status e agradecimentos públicos.
- Finanças (backend: `FinanceModule` / frontend: página `/financeiro`)
  - Planos, associações, mensalidades (fees), geração por mês/ano, ações (pagar, cancelar, marcar como atrasado), totais.
- Dashboard (backend: `DashboardModule` / frontend: página `/dashboard`)
  - KPIs e visão geral do desempenho no período.

## Papéis e Permissões

- Admin
  - Acessa Área do Administrador (`/admin`), gerencia usuários (editar, ativar/inativar), planos e associações.
  - Acessa Dashboard (`/dashboard`) e páginas de Indicações (`/indications` / `/indicacoes`).
  - No Financeiro, pode filtrar por qualquer usuário e executar ações administrativas (gerar mensalidades, marcar pago, cancelar, alterar status, enviar notificações/lembretes).
- Membro
  - Acessa Dashboard e Indicações.
  - No Financeiro, visualiza apenas suas mensalidades e não vê ações administrativas.

## Primeira Tela e Fluxos Principais

- Acesso protegido: middleware do frontend exige cookie `token` em `/admin`, `/dashboard` e `/indicacoes`.
- Usuários não autenticados nessas rotas são redirecionados para `/login`.
- Páginas públicas:
  - `/intentions`: página pública de intenções (quando habilitada) — não requer login.
- Fluxo de autenticação:
  - Login em `/login` (email/senha) → API `/auth/login` retorna `token` e dados do usuário.
  - Cookie `token` é gravado com validade (7 dias) para permitir proteção via middleware e SSR em layouts.

## Como criar usuário (fluxo por convite)

- O cadastro de novos usuários ocorre via convite com token:
  - Admin gera um convite (token) pela API (módulo de convites).
  - Usuário acessa endpoint de cadastro no backend com o token: `POST /usuarios/cadastro?token=...`.
  - Backend valida o token (`InvitesService.validate`) e marca como usado após cadastro (`InvitesService.markUsed`).
- Após o cadastro:
  - Usuário pode autenticar em `/login`.
  - Admin pode ajustar dados, papel e ativação/inativação no painel.

## Fluxos por Módulo (resumo)

- Indicações
  - Enviar e receber indicações; status: "nova", "em contato", "fechada", "recusada".
  - Layout protegido exige token; rotas em pt-BR redirecionam para `/indications`.
- Financeiro
  - Listagem: `GET /financeiro/mensalidades` com filtros (`month`, `year`, `status`, `usuario_id`).
  - Geração: `POST /financeiro/mensalidades/gerar` (admin) para mês/ano e opcionalmente um usuário específico.
  - Ações por mensalidade:
    - Pagar: `POST /financeiro/mensalidades/:id/pagar` (data opcional).
    - Cancelar: `POST /financeiro/mensalidades/:id/cancelar`.
    - Alterar status: `PATCH /financeiro/mensalidades/:id/status`.
    - Notificar atraso: `POST /financeiro/mensalidades/:id/notificar-atraso`.
    - Enviar lembrete: `POST /financeiro/mensalidades/:id/enviar-lembrete`.
  - Totais: `GET /financeiro/mensalidades/totais?month=&year=`.
- Usuários
  - Listar: `GET /usuarios`.
  - Editar: `PATCH /usuarios/:id`.
  - Ativar/Inativar: `PATCH /usuarios/:id/ativo`.
- Planos e Associações
  - Listar planos: `GET /financeiro/planos`.
  - Criar plano: `POST /financeiro/planos`.
  - Ativar/Inativar plano: `PATCH /financeiro/planos/:id/ativo`.
  - Associar usuário a plano: `POST /financeiro/associacoes`.

## Instalação e Execução

- Backend
  - `cd backend && npm install`
  - Desenvolvimento: `npm run dev` (API em `http://localhost:3001` se configurado)
  - Produção: `npm run build && npm start`
- Frontend
  - `cd frontend && npm install`
  - Desenvolvimento: `npm run dev` (app em `http://localhost:3000`)
  - Produção: `npm run build && npm start`

## Variáveis de Ambiente

- Frontend
  - `NEXT_PUBLIC_API_URL`: URL base da API. Exemplo: `http://localhost:3001`.
  - Em browser, se apontar para `http://localhost:3000`, o cliente ajusta automaticamente para `3001`.
- Backend
  - `DB_PATH`: caminho do SQLite. Padrão: `db.sqlite`. Em testes: `':memory:'`.

## Estrutura de Pastas

- `backend/`: API NestJS, módulos de domínio, modelos Sequelize.
- `frontend/`: Next.js com App Router, componentes e integrações.
- `Plataforma de Gestão para Grupos de Networking.md`: documento funcional do produto.

## Troubleshooting

- Login não mantém sessão: verifique cookie `token` criado no navegador e validade.
- Chamadas para a porta errada: ajuste `NEXT_PUBLIC_API_URL` no `.env.local` do frontend.
- Erros de escrita no SQLite: validar permissões do arquivo em `DB_PATH` e uso em produção (evitar `:memory:`).
- Testes E2E instáveis em memória: rode `npm test -i` no backend para execução serial.

---

Para detalhes mais específicos, consulte `backend/README.md` e `frontend/README.md`.