import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { InvitesService } from '../invites/invites.service';

@ApiTags('membros')
@Controller('membros')
export class MembersController {
  constructor(private membersService: MembersService, private invitesService: InvitesService) {}

  // Cadastro completo via token
  @Post('cadastro')
  async register(
    @Query('token') token: string,
    @Body() body: { nome: string; email: string; telefone?: string },
  ) {
    await this.invitesService.validate(token);
    const member = await this.membersService.create(body);
    await this.invitesService.markUsed(token);
    return member;
  }

  // Lista de membros ativos
  @Get()
  async listActive() {
    return this.membersService.listActive();
  }

  // Admin: atualizar status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pendente' | 'ativo' | 'recusado' },
  ) {
    return this.membersService.updateStatus(Number(id), body.status);
  }
}