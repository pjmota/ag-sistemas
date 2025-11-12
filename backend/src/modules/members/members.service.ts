import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Member } from '../../database/models/member.model';

@Injectable()
export class MembersService {
  constructor(@InjectModel(Member) private memberModel: typeof Member) {}

  private async withRetry<T>(action: () => Promise<T>, attempts = 5, delayMs = 100): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await action();
      } catch (err: any) {
        const msg = String(err?.parent?.message || err?.message || '');
        const isBusy = msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || err?.name === 'SequelizeTimeoutError';
        const noTable = msg.includes('no such table') || msg.includes('No description found');
        if (noTable) {
          try { await this.memberModel.sync(); } catch {}
        }
        if ((!isBusy && !noTable) || i === attempts - 1) {
          throw err;
        }
        await new Promise(r => setTimeout(r, delayMs));
        lastErr = err;
      }
    }
    throw lastErr;
  }

  async create(data: {
    nome: string;
    email: string;
    telefone?: string;
    empresa?: string;
    cargo?: string;
    bio_area_atuacao?: string;
  }) {
    return this.withRetry(() => this.memberModel.create({ ...data, status: 'ativo' } as any));
  }

  async listActive() {
    return this.withRetry(() => this.memberModel.findAll({ where: { status: 'ativo' } }));
  }

  async updateStatus(id: number, status: 'pendente' | 'ativo' | 'recusado') {
    const m = await this.withRetry(() => this.memberModel.findByPk(id));
    if (!m) throw new NotFoundException('Membro não encontrado');
    m.status = status;
    await this.withRetry(() => m.save());
    return m;
  }
}