import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../database/models/user.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InitService implements OnModuleInit {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async onModuleInit() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@exemplo.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123456';
    const hash = await bcrypt.hash(adminPassword, 10);
    const defaults = { email: adminEmail, senha_hash: hash, role: 'admin' } as any;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [user, created] = await this.userModel.findOrCreate({ where: { email: adminEmail }, defaults });
        if (created) {
          // eslint-disable-next-line no-console
          console.log(`[InitService] Usuário admin criado: ${adminEmail}`);
        } else {
          // Garante credenciais válidas sempre que já existir (test/dev)
          user.senha_hash = hash;
          user.role = 'admin' as any;
          await user.save();
          // eslint-disable-next-line no-console
          console.log('[InitService] Usuário admin existente atualizado com senha padrão');
        }
        return;
      } catch (e: any) {
        const msg = String(e?.parent?.message || e?.message || '');
        // Ignora erros esperados de bootstrap: tabela inexistente, unicidade, ou busy/timeout durante corrida
        if (
          msg.includes('no such table') ||
          msg.includes('SQLITE_CONSTRAINT') ||
          e?.name === 'SequelizeUniqueConstraintError'
        ) {
          return;
        }
        if (msg.includes('SQLITE_BUSY') || e?.name === 'SequelizeTimeoutError') {
          await new Promise(res => setTimeout(res, 100));
          continue;
        }
        // eslint-disable-next-line no-console
        console.error('[InitService] Falha ao inicializar usuário admin:', e);
        return;
      }
    }
  }
}