import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Invite } from '../../database/models/invite.model';
import { Intention } from '../../database/models/intention.model';
import { randomUUID, randomBytes } from 'crypto';

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Invite) private inviteModel: typeof Invite,
    @InjectModel(Intention) private intentionModel: typeof Intention,
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
          try { await this.inviteModel.sync(); } catch {}
          try { await this.intentionModel.sync(); } catch {}
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

  async generateForIntention(intentionId: number) {
    let intention = await this.withRetry(() => this.intentionModel.findByPk(intentionId));
    if (!intention) throw new NotFoundException('Intenção não encontrada');
    // Espera eventual pela gravação de status 'aprovada' em ambiente concorrente
    for (let i = 0; i < 5 && intention.status !== 'aprovada'; i++) {
      await new Promise(r => setTimeout(r, 100));
      intention = await this.withRetry(() => this.intentionModel.findByPk(intentionId));
      if (!intention) throw new NotFoundException('Intenção não encontrada');
    }
    if (intention.status !== 'aprovada') throw new BadRequestException('Intenção não está aprovada');
    if (intention.convite_gerado) throw new BadRequestException('Convite já gerado para esta intenção');
    // Gera token robusto mesmo em ambientes sem support a randomUUID (Node < 14.17)
    let token: string;
    try {
      token = typeof randomUUID === 'function' ? randomUUID() : randomBytes(16).toString('hex');
    } catch (_e) {
      token = randomBytes(16).toString('hex');
    }
    const invite = await this.withRetry(() => this.inviteModel.create({
      token,
      intention_id: intentionId,
      used: false,
    }));
    // marca flag persistida para evitar reenvio
    intention.convite_gerado = true;
    await this.withRetry(() => intention.save());
    // Simulação de envio de e-mail
    // eslint-disable-next-line no-console
    console.log(`Convite gerado: http://localhost:3000/cadastro?token=${token}`);
    return invite;
  }

  async validate(token: string) {
    // Robustez extra: em ambientes concorrentes, pode haver leve atraso de visibilidade
    // após criação do convite. Tente algumas vezes antes de concluir que é inválido.
    let invite: Invite | null = null as any;
    for (let i = 0; i < 10; i++) {
      try {
        invite = await this.withRetry(() => this.inviteModel.findOne({ where: { token } }));
      } catch (e: any) {
        // Em caso de erro transitório, apenas aguarde e tente novamente
      }
      if (invite) break;
      await new Promise(r => setTimeout(r, 120));
    }
    if (!invite || (invite as any).used) throw new BadRequestException('Convite inválido ou já utilizado');
    return invite;
  }

  async markUsed(token: string) {
    const invite = await this.withRetry(() => this.inviteModel.findOne({ where: { token } }));
    if (!invite) throw new NotFoundException('Convite não encontrado');
    invite.used = true;
    await this.withRetry(() => invite.save());
    return invite;
  }

  async getPrefillByToken(token: string) {
    const invite = await this.withRetry(() => this.inviteModel.findOne({ where: { token } }));
    if (!invite || invite.used) throw new BadRequestException('Convite inválido ou já utilizado');

    const intention = await this.withRetry(() => this.intentionModel.findByPk(invite.intention_id));
    if (!intention) throw new NotFoundException('Intenção vinculada ao convite não encontrada');

    return {
      nome: intention.nome,
      email: intention.email,
      empresa: intention.empresa ?? null,
    };
  }
}