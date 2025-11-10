import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { InvitesService } from '../invites/invites.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('membros')
@Controller('membros')
export class MembersController {
  constructor(
    private membersService: MembersService,
    private invitesService: InvitesService,
    private usersService: UsersService,
  ) {}

  // Cadastro completo via token
  @Post('cadastro')
  async register(
    @Query('token') token: string,
    @Body()
    body: {
      nome: string;
      email: string;
      telefone?: string;
      empresa?: string;
      cargo?: string;
      bio_area_atuacao?: string;
      senha: string;
    },
  ) {
    // Valida o token de convite, mas não grava membro.
    // O cadastro completo deve criar apenas o usuário para login.
    await this.invitesService.validate(token);
    const usuario = await this.usersService.create(body.email, body.senha, 'membro', {
      nome: body.nome,
      empresa: body.empresa,
      telefone: body.telefone,
      cargo: body.cargo,
      bio_area_atuacao: body.bio_area_atuacao,
    });
    await this.invitesService.markUsed(token);
    // Retorna somente dados do usuário criado; informações de perfil permanecem na intenção/membros.
    return usuario;
  }

  // Lista de membros ativos
  @Get()
  async listActive() {
    return this.membersService.listActive();
  }

  // Admin: listar todos os membros (qualquer status)
  @Get('todos')
  @UseGuards(AuthGuard('jwt'), new RolesGuard('admin'))
  async listAll() {
    // Reutiliza o model diretamente via service
    return (this.membersService as any).memberModel.findAll();
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