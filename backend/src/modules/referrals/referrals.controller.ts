import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('indicacoes')
@Controller('indicacoes')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    const usuario_origem_id = body?.usuario_origem_id ?? body?.membro_origem_id;
    const usuario_destino_id = body?.usuario_destino_id ?? body?.membro_destino_id;
    const descricao = body?.descricao;
    return this.referralsService.create({ usuario_origem_id, usuario_destino_id, descricao });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getById(@Param('id') id: string) {
    return this.referralsService.getById(Number(id));
  }

  @Get('usuario/:id/enviadas')
  @UseGuards(AuthGuard('jwt'))
  async sent(@Param('id') id: string) {
    return this.referralsService.listByUserSent(Number(id));
  }

  @Get('usuario/:id/recebidas')
  @UseGuards(AuthGuard('jwt'))
  async received(@Param('id') id: string) {
    return this.referralsService.listByUserReceived(Number(id));
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'nova' | 'em contato' | 'fechada' | 'recusada'; agradecimentos_publicos?: string },
  ) {
    return this.referralsService.updateStatus(Number(id), body.status, body.agradecimentos_publicos);
  }
}