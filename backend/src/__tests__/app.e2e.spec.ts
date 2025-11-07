import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../database/models/user.model';
import * as bcrypt from 'bcryptjs';

describe('API E2E', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let token: string;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    sequelize = app.get(Sequelize);
    await sequelize.sync({ force: true });

    const hash = await bcrypt.hash('123456', 10);
    await User.create({ email: 'admin@exemplo.com', senha_hash: hash, role: 'admin' } as any);

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
      .post('/membros/cadastro')
      .query({ token: tokenConvite })
      .send({ nome: 'Maria', email: 'maria@example.com' })
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

    const reg = await request(app.getHttpServer())
      .post('/membros/cadastro')
      .query({ token: tokenInvite })
      .send({ nome: 'Maria', email: 'maria2@example.com', telefone: '9999-1234' })
      .expect(201);
    const memberId = reg.body.id;

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
        .post('/membros/cadastro')
        .query({ token: inv.body.token })
        .send({ nome: s === submitA.body.id ? 'Carlos' : 'Ana', email: s === submitA.body.id ? 'carlos@example.com' : 'ana@example.com' })
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
      .post('/membros/cadastro')
      .query({ token: 'token-invalido' })
      .send({ nome: 'Eva', email: 'eva@example.com' })
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