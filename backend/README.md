# Backend — Plataforma de Gestão para Grupos de Networking

Este documento apresenta um panorama técnico do backend: arquitetura, tecnologias usadas, como instalar, configurar, executar e testar o projeto.

## Visão Geral

- API construída com NestJS (TypeScript), organizada por módulos de domínio (autenticação, usuários, convites, intenções, membros, indicações, finanças, etc.).
- Persistência com Sequelize (sequelize-typescript) usando SQLite por padrão. O schema é sincronizado automaticamente na inicialização.
- Testes com Jest e Supertest, incluindo testes unitários e E2E.

## Tecnologias

- NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- Configuração via `@nestjs/config`
- ORM: `sequelize` + `sequelize-typescript`
- Banco: `sqlite3`
- Autenticação: `@nestjs/jwt`, `passport`, `passport-jwt`
- Documentação (lib disponível): `@nestjs/swagger` e `swagger-ui-express` (pode ser habilitada na `main.ts` conforme necessidade)
- Testes: `jest`, `supertest`, `@nestjs/testing`

## Estrutura do Projeto

- `src/app.module.ts`: módulo raiz; configura Sequelize (SQLite), carrega env e registra módulos.
- `src/modules/*`: módulos de domínio (exemplos abaixo).
- `src/database/models/*`: modelos do Sequelize com decorators.
- `src/main.ts`: bootstrap do NestJS.
- `src/__tests__`: suíte de testes.

### Módulos e responsabilidades

- `AuthModule`: autenticação baseada em JWT.
- `UsersModule`: cadastro de usuários, integração com convites.
- `InvitesModule`: geração, validação e marcação de tokens de convite.
- `IntentionsModule`: intenções de participação; atualização de status.
- `MembersModule`: gestão de membros.
- `ReferralsModule` e `Thanks`: indicações e agradecimentos entre membros.
- `FinanceModule`: mensalidades (fees) — geração, listagem, marcação como paga/cancelada, atualização automática de atraso.
- `DashboardModule`: agregações para visualização.

### Modelos principais

- `User`, `Member`, `Intention`, `Invite`, `Referral`, `Thanks`, `Plan`, `MemberPlan`, `Fee`.
- O `AppModule` registra esses modelos e habilita `autoLoadModels` com `sync: {}` para sincronização básica do schema.

## Configuração de Ambiente

Variáveis suportadas (principais):

- `DB_PATH`: caminho do arquivo SQLite. Padrão: `db.sqlite` na raiz de `backend`.
  - Em testes, pode-se usar `':memory:'` para banco em memória.
- `DEFAULT_ADMIN_EMAIL`: e-mail do usuário administrador criado/atualizado no bootstrap. Padrão: `admin@exemplo.com`.
- `DEFAULT_ADMIN_PASSWORD`: senha do usuário administrador. Padrão: `123456`.

Exemplos (PowerShell no Windows):

```
# Banco em arquivo
$env:DB_PATH = "db.sqlite"

# Banco em memória (apenas para testes locais)
$env:DB_PATH = ":memory:"
 
# Usuário admin padrão (opcional)
$env:DEFAULT_ADMIN_EMAIL = "admin@exemplo.com"
$env:DEFAULT_ADMIN_PASSWORD = "123456"
```

## Instalação

1) Instale dependências:

```
cd backend
npm install
```

2) Opcional: configure `DB_PATH` se quiser alterar o caminho do banco.

## Execução

- Desenvolvimento (hot-reload):

```
npm run dev
```

- Produção (build + start):

```
npm run build
npm start
```

Por padrão, a API roda em `http://localhost:3000`.

## Testes

- Testes completos:

```
npm test
```

- Cobertura de testes:

```
npm run test:coverage
```

- Cobertura (sem threshold de falha):

```
npm run test:coverage:loose
```

- Cobertura apenas unit (pula E2E):

```
npm run test:coverage:unit
```

Observações:
- Em ambientes com SQLite `:memory:` e alta concorrência, alguns testes E2E podem exigir execução serial:

```
npm test -i
```

## Convenções e Observações Técnicas

- ORM: `sequelize-typescript` com decorators. Relacionamentos são definidos nos modelos em `src/database/models`.
- Sincronização: `autoLoadModels` + `sync: {}` no `SequelizeModule`. Para alterações de schema em produção, recomenda-se migrações.
- Erros SQLite: foram adicionados mecanismos de retry e sincronização defensiva em pontos críticos de escrita (ex.: finanças, convites) para lidar com `SQLITE_BUSY`, `READONLY` e visibilidade tardia.
- Autenticação: JWT com `@nestjs/jwt`/`passport-jwt`; configure o segredo e opções conforme sua necessidade (via `ConfigModule`).
- Usuário Admin padrão: durante inicialização do módulo de autenticação, o `InitService` cria ou atualiza um usuário admin usando `DEFAULT_ADMIN_EMAIL` e `DEFAULT_ADMIN_PASSWORD` (padrões: `admin@exemplo.com` / `123456`). Em ambientes de teste/dev, isso garante um login funcional imediato.

## Troubleshooting

- `SQLITE_BUSY` / bloqueios concorrentes: reexecute o comando/teste; considere reduzir concorrência ou usar execução serial (`jest -i`).
- Banco somente leitura (`SQLITE_READONLY`): verifique permissões do arquivo em `DB_PATH` e se o processo tem direito de escrita.
- Tabelas ausentes: em dev, a sincronização básica deve criar o schema ao subir a API. Se persistir, valide `DB_PATH` e limpeza do arquivo.
- Admin não criado: verifique logs do servidor e variáveis `DEFAULT_ADMIN_EMAIL`/`DEFAULT_ADMIN_PASSWORD`. O serviço `InitService` roda ao iniciar o `AuthModule` e usa `findOrCreate` com retentativas para contornar locks do SQLite.

## Próximos Passos (opcional)

- Habilitar Swagger na inicialização para documentação interativa.
- Adicionar migrações para evolução de schema em produção.
- Configurar variáveis adicionais (segredos JWT, etc.) em `.env` e documentá-las em um `.env.example`.