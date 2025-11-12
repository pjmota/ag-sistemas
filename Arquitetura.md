# Plataforma de Gestão para Grupos de Networking

## 1. Visão Geral

A Plataforma de Gestão para Grupos de Networking tem como objetivo centralizar e digitalizar a administração de grupos voltados à geração de negócios, substituindo planilhas e processos manuais por um sistema integrado, escalável e seguro. O sistema permitirá o cadastro e gestão de membros, comunicação interna, registro de indicações e negócios fechados, controle de presença e performance, além de relatórios de desempenho.

A arquitetura proposta foi desenhada para oferecer modularidade, segurança e manutenibilidade, utilizando tecnologias modernas tanto no Frontend (Next.js + React) quanto no Backend (NestJS + Node.js), com persistência em SQLite3 e autenticação baseada em JWT.

---

## 2. Diagrama da Arquitetura

O diagrama a seguir ilustra a comunicação e a separação de responsabilidades entre os principais blocos da solução: Frontend, Backend (API REST) e Banco de Dados.

```mermaid
flowchart LR
    subgraph Bloco Frontend [Frontend - Next.js / React]
    A[Interface do Usuário] -->|HTTP/Axios| B[API REST]
    end

    subgraph Bloco Backend [Backend - NestJS]
    B --> C[Serviço de Autenticação (JWT)]
    B --> D[Serviço de Membros]
    B --> E[Serviço de Indicações]
    B --> F[Serviço de Reuniões e Desempenho]
    B --> G[Serviço Financeiro]
    end

    subgraph Bloco BancoDeDados [Banco de Dados - SQLite3]
    D --> H[(Tabela Membros)]
    E --> I[(Tabela Indicações)]
    F --> J[(Tabela Reuniões)]
    G --> K[(Tabela Mensalidades)]
    C --> L[(Tabela Usuários)]
    end
```

> **Observação:** O JWT é utilizado como mecanismo de autenticação entre o Frontend e o Backend, não sendo uma camada separada, mas sim um serviço transversal responsável por segurança e autorização nas requisições HTTP.

---

## 3. Camadas da Solução

### 3.1 Frontend (Next.js + React + TypeScript)

| Aspecto | Detalhe |
| :--- | :--- |
| **Framework** | React 19 com Next.js 16 (App Router) |
| **Linguagem** | TypeScript 5 |
| **UI/UX** | Material UI (MUI 7) + Tailwind CSS 4 |
| **Ícones** | Lucide React + MUI Icons |
| **Notificações** | React Toastify |
| **Estado Global** | Redux Toolkit (store tipada) |
| **Autenticação** | Context API com JWT armazenado em cookies (HTTP-only) |
| **HTTP Client** | Axios 1 |
| **Testes** | Jest 30 + React Testing Library |

**Detalhes do Gerenciamento de Estado:**
*   `src/state/store.ts` com `configureStore`
*   `src/state/slices/*` para módulos (ex.: `membros.slice.ts`, `indicacoes.slice.ts`)
*   Hooks tipados: `useAppDispatch`, `useAppSelector`

**Estrutura Sugerida de Pastas (`src/`):**

```
src/
├── app/                  # Rotas e layouts do Next.js App Router
│   ├── (auth)/           # Grupo de rotas para autenticação (login, cadastro, etc.)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (main)/           # Grupo de rotas principais (protegidas)
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── referrals/
│   │   ├── finance/
│   │   └── layout.tsx    # Layout principal com navegação e autenticação
│   └── layout.tsx        # Layout raiz (configurações globais, providers)
├── components/           # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI genéricos (botões, inputs, cards)
│   ├── modules/          # Componentes complexos específicos de funcionalidades (ex: MemberForm, ReferralTracker)
│   └── providers/        # Context Providers (ex: AuthProvider, ThemeProvider)
├── state/                # Gerenciamento de Estado (Redux Toolkit)
│   ├── store.ts          # Configuração do store tipado
│   ├── hooks.ts          # Hooks tipados (useAppDispatch, useAppSelector)
│   └── slices/           # Slices de estado (ex: members.slice.ts, finance.slice.ts)
├── services/             # Lógica de comunicação com a API (Axios instances, wrappers)
├── types/                # Definições de tipos globais (interfaces, enums)
└── utils/                # Funções utilitárias diversas
```

---

### 3.2 Backend (NestJS + Node.js + TypeScript)

| Aspecto | Detalhe |
| :--- | :--- |
| **Framework** | NestJS 11 |
| **Linguagem** | TypeScript 5 |
| **Banco de Dados** | SQLite3 |
| **ORM** | Sequelize 6 |
| **Autenticação** | JWT (via Passport + @nestjs/jwt) |
| **Documentação** | Swagger (OpenAPI 3) |
| **Testes** | Jest 30 |

**Estrutura Sugerida de Módulos (`src/`):**

```
src/
 ├─ main.ts
 ├─ app.module.ts
 ├─ modules/
 │   ├─ auth/
 │   ├─ membros/
 │   ├─ indicacoes/
 │   ├─ reunioes/
 │   ├─ desempenho/
 │   └─ financeiro/
 ├─ database/
 │   ├─ models/
 │   └─ migrations/
 └─ common/
     ├─ guards/
     ├─ interceptors/
     └─ utils/
```

---

## 4. Modelo de Dados (Banco SQLite3)

### Tabelas Principais

| Tabela | Descrição |
| :--- | :--- |
| **Membros** | Armazena dados de membros e administradores. |
| **Indicações** | Registro de indicações de negócios entre membros. |
| **Reuniões** | Controle de presença e reuniões 1 a 1. |
| **Mensalidades** | Controle de mensalidades e status de pagamento. |
| **Usuários (Admin)** | Login e perfis de acesso. |

**Detalhes da Tabela `Membros`:**

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Identificador único |
| `nome` | TEXT | Nome completo do membro |
| `email` | TEXT | Email único |
| `telefone` | TEXT | Contato |
| `status` | TEXT | [pendente, ativo, recusado] |
| `data_cadastro` | DATETIME | Registro da entrada |

**Detalhes da Tabela `Indicações`:**

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Identificador |
| `membro_origem_id` | INTEGER (FK) | Quem indicou |
| `membro_destino_id` | INTEGER (FK) | Quem recebeu |
| `descricao` | TEXT | Descrição da indicação |
| `status` | TEXT | [nova, em andamento, concluída] |
| `data` | DATETIME | Data da criação |

**Detalhes da Tabela `Reuniões`:**

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Identificador |
| `data` | DATETIME | Data da reunião |
| `tipo` | TEXT | [semanal, 1a1, especial] |
| `presencas` | JSON | Lista de IDs de membros presentes |

**Detalhes da Tabela `Mensalidades`:**

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Identificador |
| `membro_id` | INTEGER (FK) | Membro vinculado |
| `valor` | DECIMAL | Valor da mensalidade |
| `status` | TEXT | [pendente, pago, atrasado] |
| `data_referencia` | DATE | Competência |

**Detalhes da Tabela `Usuários (Admin)`:**

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Identificador |
| `email` | TEXT | Login do usuário |
| `senha_hash` | TEXT | Hash da senha |
| `role` | TEXT | [admin, membro] |

---

## 5. Definição da API

### 5.1 Autenticação

| Rota | Método | Descrição | Exemplo de Request | Exemplo de Response |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Autentica o usuário e retorna o token JWT. | `{ "email": "user@exemplo.com", "senha": "123456" }` | `{ "token": "jwt_token_aqui", "usuario": { "id": 1, "nome": "Paulo" } }` |

### 5.2 Membros

| Rota | Método | Descrição |
| :--- | :--- | :--- |
| `/membros` | `GET` | Lista todos os membros ativos. |
| `/membros` | `POST` | Cria novo membro após aprovação. |
| `/membros/:id/status` | `PATCH` | Atualiza status (pendente → ativo, etc.) |

### 5.3 Indicações

| Rota | Método | Descrição | Exemplo de Request |
| :--- | :--- | :--- | :--- |
| `/indicacoes` | `POST` | Registra uma nova indicação de negócio. | `{ "membro_origem_id": 1, "membro_destino_id": 2, "descricao": "Possível parceria comercial" }` |
| `/indicacoes/:id` | `GET` | Retorna detalhes da indicação. |
| `/indicacoes/:id/status` | `PATCH` | Atualiza o status da indicação. |

---

## 6. Fluxo de Autenticação JWT

1.  O usuário (membro ou administrador) realiza login pelo Frontend.
2.  O Frontend envia credenciais ao endpoint `/auth/login` do Backend.
3.  O Backend valida as credenciais e gera um token JWT assinado.
4.  O token é armazenado em cookie HTTP-only ou no localStorage (modo seguro).
5.  Em cada requisição subsequente, o Frontend envia o token no cabeçalho `Authorization: Bearer <token>`.
6.  O Backend valida o token via middleware (guard NestJS) antes de permitir acesso às rotas protegidas.

---

## 7. Considerações Finais

*   O sistema é projetado com foco em modularidade e expansão futura (ex: dashboards, exportação de relatórios, integração com gateways de pagamento reais).
*   O uso de SQLite3 facilita o ambiente local, podendo ser substituído por PostgreSQL ou MySQL sem grandes refatorações.
*   A separação entre Frontend, Backend e Banco de Dados garante independência de deploy e escalabilidade.
*   Testes automatizados com Jest asseguram a estabilidade das principais funcionalidades.

**Conclusão:** A arquitetura apresentada consolida uma base sólida e escalável para a Plataforma de Gestão de Grupos de Networking, unindo simplicidade operacional e boas práticas de engenharia de software. Com o uso de Next.js e React no Frontend e NestJS no Backend, o sistema garante separação clara de responsabilidades, alta manutenibilidade e suporte nativo a expansão modular. O modelo de autenticação via JWT oferece segurança e praticidade para o controle de acesso, permitindo a futura implementação de perfis e permissões mais granulares. O SQLite3 atua como banco de dados leve e ágil durante o desenvolvimento, com possibilidade de migração transparente para PostgreSQL ou MySQL em ambientes de produção. Essa proposta não apenas cobre as necessidades atuais de gestão de membros, indicações e desempenho, como também prepara o terreno para evoluções futuras — incluindo integrações com APIs externas, dashboards avançados e relatórios automatizados. Em resumo, trata-se de uma arquitetura moderna, modular e sustentável, projetada para crescer junto com o negócio e manter a consistência e a performance a longo prazo.
