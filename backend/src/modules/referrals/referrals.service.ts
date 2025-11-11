import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Referral } from '../../database/models/referral.model';
import { Thanks } from '../../database/models/thanks.model';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(Referral) private referralModel: typeof Referral,
    // Optional injection to keep tests that instantiate with one arg working
    @InjectModel(Thanks) private thanksModel?: typeof Thanks,
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
          try { await this.referralModel.sync(); } catch {}
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
    usuario_origem_id?: number;
    usuario_destino_id?: number;
    membro_origem_id?: number;
    membro_destino_id?: number;
    descricao: string;
  }) {
    const usuario_origem_id = data.usuario_origem_id ?? data.membro_origem_id;
    const usuario_destino_id = data.usuario_destino_id ?? data.membro_destino_id;
    return this.withRetry(() =>
      this.referralModel.create({ usuario_origem_id, usuario_destino_id, descricao: data.descricao, status: 'nova' } as any),
    );
  }

  async getById(id: number) {
    const r = await this.withRetry(() => this.referralModel.findByPk(id));
    if (!r) throw new NotFoundException('Indicação não encontrada');
    return r;
  }

  async listByUserSent(userId: number) {
    return this.withRetry(() => this.referralModel.findAll({ where: { usuario_origem_id: userId } }));
  }

  async listByUserReceived(userId: number) {
    return this.withRetry(() => this.referralModel.findAll({ where: { usuario_destino_id: userId } }));
  }

  async updateStatus(
    id: number,
    status: 'nova' | 'em contato' | 'fechada' | 'recusada',
    agradecimentos_publicos?: string,
  ) {
    const r = await this.withRetry(() => this.referralModel.findByPk(id));
    if (!r) throw new NotFoundException('Indicação não encontrada');
    r.status = status;
    if (typeof agradecimentos_publicos !== 'undefined') {
      r.agradecimentos_publicos = agradecimentos_publicos;
    }
    await this.withRetry(() => r.save());

    // Se fechada e há agradecimento preenchido, registra também em 'obrigados'
    const hasThanksText = typeof agradecimentos_publicos === 'string' && agradecimentos_publicos.trim().length > 0;
    if (status === 'fechada' && hasThanksText && this.thanksModel) {
      try {
        await this.withRetry(() => this.thanksModel!.create({
          usuario_id: r.usuario_destino_id,
          descricao: agradecimentos_publicos!.trim(),
        } as any));
      } catch (e) {
        // Não falha a operação principal se registro de "obrigado" tiver problema
        // eslint-disable-next-line no-console
        console.warn('[ReferralsService] Falha ao registrar obrigado:', e);
      }
    }
    return r;
  }
}