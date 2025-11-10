import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { InvitesService } from '../invites/invites.service';

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
}