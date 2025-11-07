import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Invite } from '../../database/models/invite.model';
import { Intention } from '../../database/models/intention.model';
import { randomUUID } from 'crypto';

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
    const token = randomUUID();
    const invite = await this.inviteModel.create({
      token,
      intention_id: intentionId,
      used: false,
    });
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
}