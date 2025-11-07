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
  async create(
    @Body() body: { membro_origem_id: number; membro_destino_id: number; descricao: string },
  ) {
    return this.referralsService.create(body);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getById(@Param('id') id: string) {
    return this.referralsService.getById(Number(id));
  }

  @Get('membro/:id/enviadas')
  @UseGuards(AuthGuard('jwt'))
  async sent(@Param('id') id: string) {
    return this.referralsService.listByMemberSent(Number(id));
  }

  @Get('membro/:id/recebidas')
  @UseGuards(AuthGuard('jwt'))
  async received(@Param('id') id: string) {
    return this.referralsService.listByMemberReceived(Number(id));
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'nova' | 'em contato' | 'fechada' | 'recusada' },
  ) {
    return this.referralsService.updateStatus(Number(id), body.status);
  }
}