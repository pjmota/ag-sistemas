import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Intention } from '../../database/models/intention.model';
import { Member } from '../../database/models/member.model';

@Injectable()
export class IntentionsService {
  constructor(
    @InjectModel(Intention) private intentionModel: typeof Intention,
    @InjectModel(Member) private memberModel: typeof Member,
  ) {}

  private async withRetry<T>(action: () => Promise<T>, attempts = 5, delayMs = 100): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await action();
      } catch (err: any) {
        const msg = String(err?.parent?.message || err?.message || '');
        const isBusy = msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || msg.includes('SequelizeTimeoutError');
        const noTable = msg.includes('no such table');
        if (noTable) {
          try { await (this.intentionModel as any).sync(); } catch {}
          try { await (this.memberModel as any).sync(); } catch {}
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

  async submit(data: { nome: string; email: string; empresa?: string; motivo: string }) {
    return this.withRetry(() => this.intentionModel.create({ ...data, status: 'pendente' }));
  }

  async listAll() {
    return this.withRetry(() => this.intentionModel.findAll({ order: [['data', 'DESC']] }));
  }

  async updateStatus(id: number, status: 'aprovada' | 'recusada') {
    const intention = await this.withRetry(() => this.intentionModel.findByPk(id));
    if (!intention) throw new NotFoundException('Intenção não encontrada');
    intention.status = status;
    await this.withRetry(() => intention.save());
    // Quando intenção é aprovada, cria (ou garante) registro em membros com dados da intenção
    if (status === 'aprovada') {
      const existing = await this.withRetry(() => this.memberModel.findOne({ where: { email: intention.email } }));
      if (!existing) {
        // Idempotente: tenta criar e ignora erro de UNIQUE se já existir
        try {
          await this.withRetry(() => this.memberModel.create({
            nome: intention.nome,
            email: intention.email,
            empresa: intention.empresa || null,
            status: 'pendente',
          } as any));
        } catch (err: any) {
          const msg = String(err?.parent?.message || err?.message || '');
          const isUnique = msg.includes('UNIQUE') || err?.name === 'SequelizeUniqueConstraintError';
          if (!isUnique) throw err;
          // UNIQUE: entrada já criada em corrida concorrente; segue sem falhar
        }
      }
    }
    return intention;
  }
}