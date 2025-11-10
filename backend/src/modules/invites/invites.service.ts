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

  async generateForIntention(intentionId: number) {
    const intention = await this.intentionModel.findByPk(intentionId);
    if (!intention) throw new NotFoundException('Intenção não encontrada');
    if (intention.status !== 'aprovada') throw new BadRequestException('Intenção não está aprovada');
    if (intention.convite_gerado) throw new BadRequestException('Convite já gerado para esta intenção');
    // Gera token robusto mesmo em ambientes sem support a randomUUID (Node < 14.17)
    let token: string;
    try {
      token = typeof randomUUID === 'function' ? randomUUID() : randomBytes(16).toString('hex');
    } catch (_e) {
      token = randomBytes(16).toString('hex');
    }
    const invite = await this.inviteModel.create({
      token,
      intention_id: intentionId,
      used: false,
    });
    // marca flag persistida para evitar reenvio
    intention.convite_gerado = true;
    await intention.save();
    // Simulação de envio de e-mail
    // eslint-disable-next-line no-console
    console.log(`Convite gerado: http://localhost:3000/cadastro?token=${token}`);
    return invite;
  }

  async validate(token: string) {
    const invite = await this.inviteModel.findOne({ where: { token } });
    if (!invite || invite.used) throw new BadRequestException('Convite inválido ou já utilizado');
    return invite;
  }

  async markUsed(token: string) {
    const invite = await this.inviteModel.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Convite não encontrado');
    invite.used = true;
    await invite.save();
    return invite;
  }

  async getPrefillByToken(token: string) {
    const invite = await this.inviteModel.findOne({ where: { token } });
    if (!invite || invite.used) throw new BadRequestException('Convite inválido ou já utilizado');

    const intention = await this.intentionModel.findByPk(invite.intention_id);
    if (!intention) throw new NotFoundException('Intenção vinculada ao convite não encontrada');

    return {
      nome: intention.nome,
      email: intention.email,
      empresa: intention.empresa ?? null,
    };
  }
}