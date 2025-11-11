import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { InvitesService } from '../invites/invites.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsersController {
  constructor(private usersService: UsersService, private invitesService: InvitesService) {}

  @Get()
  // Liberado para qualquer usuário autenticado
  @UseGuards(AuthGuard('jwt'))
  async listAll() {
    return this.usersService.listAll();
  }

  // Cadastro completo via token (cria apenas usuário)
  @Post('cadastro')
  async register(
    @Query('token') token: string,
    @Body()
    body: {
      email: string;
      senha: string;
      nome?: string;
      empresa?: string;
      telefone?: string;
      cargo?: string;
      bio_area_atuacao?: string;
    },
  ) {
    await this.invitesService.validate(token);
    const usuario = await this.usersService.create(body.email, body.senha, 'membro', {
      nome: body.nome,
      empresa: body.empresa,
      telefone: body.telefone,
      cargo: body.cargo,
      bio_area_atuacao: body.bio_area_atuacao,
    });
    await this.invitesService.markUsed(token);
    return usuario;
  }

  // Admin: atualizar dados do usuário
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), new RolesGuard('admin'))
  async update(
    @Param('id') id: string,
    @Body() body: {
      nome?: string;
      empresa?: string;
      telefone?: string;
      cargo?: string;
      bio_area_atuacao?: string;
      role?: 'admin' | 'membro';
    },
  ) {
    return this.usersService.update(Number(id), body as any);
  }

  // Admin: ativar/inativar usuário
  @Patch(':id/ativo')
  @UseGuards(AuthGuard('jwt'), new RolesGuard('admin'))
  async setActive(@Param('id') id: string, @Body() body: { ativo: boolean }) {
    return this.usersService.setActive(Number(id), !!body.ativo);
  }
}