import { Body, Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntentionsService } from './intentions.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('intencoes')
@Controller('intencoes')
export class IntentionsController {
  constructor(private intentionsService: IntentionsService) {}

  // Pública
  @Post()
  async submit(@Body() body: { nome: string; email: string; empresa?: string; motivo: string }) {
    return this.intentionsService.submit(body);
  }

  // Admin - listagem
  @Get()
  @UseGuards(AuthGuard('jwt'), new RolesGuard('admin'))
  async listAll() {
    return this.intentionsService.listAll();
  }

  // Admin - aprovar/recusar
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), new RolesGuard('admin'))
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'aprovada' | 'recusada' },
  ) {
    return this.intentionsService.updateStatus(Number(id), body.status);
  }
}