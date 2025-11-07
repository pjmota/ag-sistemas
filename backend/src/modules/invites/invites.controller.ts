import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('convites')
@Controller('convites')
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  // Admin: gerar convite para intenção aprovada
  @Post(':intentionId/gerar')
  @UseGuards(AuthGuard('jwt'), new RolesGuard('admin'))
  async generate(@Param('intentionId') intentionId: string) {
    return this.invitesService.generateForIntention(Number(intentionId));
  }
}