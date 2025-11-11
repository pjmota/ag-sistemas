import { Test } from '@nestjs/testing';
jest.setTimeout(30000);
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../database/models/user.model';
import { UsersService } from '../modules/users/users.service';
import * as bcrypt from 'bcryptjs';
import { getModelToken } from '@nestjs/sequelize';
// Garante admin válido independentemente do InitService

describe('API E2E', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let token: string;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    // Inicializa a aplicação primeiro para garantir modelos registrados
    await app.init();
    // Depois sincroniza o schema para garantir criação das tabelas antes do seed
    sequelize = app.get(Sequelize);
    await sequelize.sync({ force: true });

    // Garante que o usuário admin exista com senha correta antes do login
    const userModel = app.get<typeof User>(getModelToken(User));
    // Helper de retentativas para contornar travas/concurrency do SQLite e tabelas ausentes
    const withRetry = async <T>(action: () => Promise<T>, attempts = 5, delayMs = 100): Promise<T> => {
      let lastErr: any;
      for (let i = 0; i < attempts; i++) {
        try {
          return await action();
        } catch (err: any) {
          const msg = String(err?.parent?.message || err?.message || '');
          const isBusy = msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || err?.name === 'SequelizeTimeoutError';
          const noTable = msg.includes('no such table');
          if (noTable) {
            try { await userModel.sync(); } catch {}
          }
          if ((!isBusy && !noTable) || i === attempts - 1) {
            throw err;
          }
          await new Promise(res => setTimeout(res, delayMs));
          lastErr = err;
        }
      }
      throw lastErr;
    };
    const adminEmail = 'admin@exemplo.com';
    const adminPassword = '123456';
    const existing = await withRetry(() => userModel.findOne({ where: { email: adminEmail } }));
    const hash = await bcrypt.hash(adminPassword, 10);
    // Usa findOrCreate com retentativas para evitar CONSTRAINT/LOCK em SQLite
    const defaults = { email: adminEmail, senha_hash: hash, role: 'admin' } as any;
    if (!existing) {
      const [user, created] = await (withRetry(() => (userModel as any).findOrCreate({ where: { email: adminEmail }, defaults })) as Promise<any>);
      if (!created) {
        user.senha_hash = hash;
        user.role = 'admin';
        await withRetry(() => user.save());
      }
    } else {
      existing.senha_hash = hash;
      existing.role = 'admin';
      await withRetry(() => existing.save());
    }

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@exemplo.com', senha: '123456' })
      .expect(201);
    token = res.body.token;
  });

  afterAll(async () => {
    // Close the Nest application first to allow providers to clean up
    await app.close();
    // Avoid double-closing Sequelize which may be handled by app shutdown hooks
  });

  it('submete intenção pública, lista e aprova', async () => {
    const submit = await request(app.getHttpServer())
      .post('/intencoes')
      .send({ nome: 'João', email: 'joao@example.com', empresa: 'ACME', motivo: 'Quero participar' })
      .expect(201);
    const id = submit.body.id;

    await request(app.getHttpServer())
      .get('/intencoes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/intencoes/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'aprovada' })
      .expect(200);
  });

  it('gera convite e faz cadastro completo com token', async () => {
    const intention = await request(app.getHttpServer())
      .post('/intencoes')
      .send({ nome: 'Maria', email: 'maria@example.com', motivo: 'Participação' })
      .expect(201);
    const id = intention.body.id;
    await request(app.getHttpServer())
      .patch(`/intencoes/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'aprovada' })
      .expect(200);
    const convite = await request(app.getHttpServer())
      .post(`/convites/${id}/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    const tokenConvite = convite.body.token;

    await request(app.getHttpServer())
      .post('/usuarios/cadastro')
      .query({ token: tokenConvite })
      .send({ email: 'maria@example.com', senha: 'abc123', telefone: '11999999999', cargo: 'Dev' })
      .expect(201);
  });

  it('atualiza status de membro existente com sucesso', async () => {
    const submit = await request(app.getHttpServer())
      .post('/intencoes')
      .send({ nome: 'Maria', email: 'maria@example.com', empresa: 'Beta', motivo: 'Networking' })
      .expect(201);
    const intentionId = submit.body.id;

    await request(app.getHttpServer())
      .patch(`/intencoes/${intentionId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'aprovada' })
      .expect(200);

    const inviteRes = await request(app.getHttpServer())
      .post(`/convites/${intentionId}/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    const tokenInvite = inviteRes.body.token;

    await request(app.getHttpServer())
      .post('/usuarios/cadastro')
      .query({ token: tokenInvite })
      .send({ email: 'maria2@example.com', senha: 'abc123', telefone: '9999-1234', cargo: 'Dev' })
      .expect(201);

    // Busca membro criado via aprovação da intenção
    const members = await request(app.getHttpServer())
      .get('/membros/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const memberId = (members.body as any[]).find((m) => m.email === 'maria@example.com')?.id;

    const upd = await request(app.getHttpServer())
      .patch(`/membros/${memberId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'recusado' })
      .expect(200);
    expect(upd.body.status).toBe('recusado');
  });

  it('atualiza status de indicação existente com sucesso', async () => {
    // cria dois membros ativos
    const submitA = await request(app.getHttpServer())
      .post('/intencoes')
      .send({ nome: 'Carlos', email: 'carlos@example.com', empresa: 'Gamma', motivo: 'Quero participar' })
      .expect(201);
    const submitB = await request(app.getHttpServer())
      .post('/intencoes')
      .send({ nome: 'Ana', email: 'ana@example.com', empresa: 'Delta', motivo: 'Quero participar' })
      .expect(201);

    for (const s of [submitA.body.id, submitB.body.id]) {
      await request(app.getHttpServer())
        .patch(`/intencoes/${s}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'aprovada' })
        .expect(200);
      const inv = await request(app.getHttpServer())
        .post(`/convites/${s}/gerar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
      const reg = await request(app.getHttpServer())
        .post('/usuarios/cadastro')
        .query({ token: inv.body.token })
        .send({
          email: s === submitA.body.id ? 'carlos@example.com' : 'ana@example.com',
          senha: 'abc123',
          telefone: '11999999999',
          cargo: 'Membro',
        })
        .expect(201);
    }

    const indicacao = await request(app.getHttpServer())
      .post('/indicacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ membro_origem_id: 1, membro_destino_id: 2, descricao: 'Indicação teste' })
      .expect(201);

    const upd = await request(app.getHttpServer())
      .patch(`/indicacoes/${indicacao.body.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'fechada' })
      .expect(200);
    expect(upd.body.status).toBe('fechada');
  });

  it('tenta aprovar intenção inexistente e recebe 404', async () => {
    await request(app.getHttpServer())
      .patch('/intencoes/9999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'aprovada' })
      .expect(404);
  });

  it('cria indicação e atualiza status', async () => {
    const created = await request(app.getHttpServer())
      .post('/indicacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ membro_origem_id: 1, membro_destino_id: 2, descricao: 'Parceria' })
      .expect(201);
    const id = created.body.id;
    await request(app.getHttpServer())
      .patch(`/indicacoes/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'em contato' })
      .expect(200);
  });

  it('retorna KPIs do dashboard', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/kpis')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('impede gerar convite se intenção não aprovada', async () => {
    const intention = await request(app.getHttpServer())
      .post('/intencoes')
      .send({ nome: 'Carlos', email: 'carlos@example.com', motivo: 'Participar' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/convites/${intention.body.id}/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('validação de token inválido retorna erro', async () => {
    await request(app.getHttpServer())
      .post('/usuarios/cadastro')
      .query({ token: 'token-invalido' })
      .send({ email: 'eva@example.com', senha: 'abc123', telefone: '11999999999', cargo: 'Dev' })
      .expect(400);
  });

  it('referral getById inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/indicacoes/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('atualizar status de membro inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .patch('/membros/9999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ativo' })
      .expect(404);
  });
});