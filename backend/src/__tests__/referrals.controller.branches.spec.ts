import { Test } from '@nestjs/testing';
jest.setTimeout(30000);
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { Sequelize } from 'sequelize-typescript';
import { ReferralsController } from '../modules/referrals/referrals.controller';
import { User } from '../database/models/user.model';
import { SchemaInitService } from '../bootstrap/schema-init.service';

describe('ReferralsController Branches', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let controller: ReferralsController;
  let u1: User;
  let u2: User;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    sequelize = app.get(Sequelize);
    await sequelize.sync({ force: true });
    // Garantia adicional: sincroniza explicitamente a tabela de usuários e aplica migrações internas
    await User.sync();
    await app.get(SchemaInitService).onModuleInit();
    controller = app.get(ReferralsController);

    // Helper com retentativas para contornar SQLITE_BUSY/UNIQUE e condições de corrida
    const createUserWithRetry = async (email: string, nome: string) => {
      for (let i = 0; i < 5; i++) {
        try {
          const existing = await User.findOne({ where: { email } });
          if (existing) return existing;
          return await User.create({ email, senha_hash: 'hash', role: 'membro', nome } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table') || msg.toLowerCase().includes('no such table')) {
            await User.sync();
            await new Promise(res => setTimeout(res, 50));
            continue;
          }
          if (msg.includes('SQLITE_CONSTRAINT') || e?.name === 'SequelizeUniqueConstraintError') {
            const existing = await User.findOne({ where: { email } });
            if (existing) return existing;
          }
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError') {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error(`Falha ao criar usuário ${email} após tentativas`);
    };

    u1 = await createUserWithRetry('rcb1@example.com', 'RCB1');
    u2 = await createUserWithRetry('rcb2@example.com', 'RCB2');
  });

  afterAll(async () => {
    await app.close();
  });

  it('create aceita membro_* como string e converte para número', async () => {
    const res = await controller.create({ membro_origem_id: String(u1.id), membro_destino_id: String(u2.id), descricao: 'via membro_*' });
    expect(res.usuario_origem_id).toBe(u1.id);
    expect(res.usuario_destino_id).toBe(u2.id);
  });

  it('updateStatus aceita agradecimentos_publicos opcional', async () => {
    const r = await controller.create({ usuario_origem_id: u1.id, usuario_destino_id: u2.id, descricao: 'sem agradecimentos' });
    const s1 = await controller.updateStatus(String(r.id), { status: 'em contato' });
    expect(s1.status).toBe('em contato');
    expect(s1.agradecimentos_publicos).toBeNull();

    const s2 = await controller.updateStatus(String(r.id), { status: 'fechada', agradecimentos_publicos: 'valeu!' });
    expect(s2.status).toBe('fechada');
    expect(s2.agradecimentos_publicos).toContain('valeu');
  });
});