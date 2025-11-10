import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('financeiro')
export class FinanceController {
  constructor(private finance: FinanceService) {}

  @Post('planos')
  createPlan(@Body() body: { nome: string; valor: number; dia_vencimento_padrao?: number }) {
    return this.finance.createPlan(body);
  }

  @Post('associacoes')
  assignPlan(@Body() body: { usuario_id: number; plano_id: number; data_inicio?: Date }) {
    return this.finance.assignPlan(body);
  }

  @Post('mensalidades/gerar')
  generate(@Body() body: { month: number; year: number }) {
    return this.finance.generateMonthlyFees(body);
  }

  @Get('mensalidades')
  list(
    @Query('status') status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado',
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('usuario_id') usuario_id?: string,
  ) {
    return this.finance.listFees({
      status: status as any,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      usuario_id: usuario_id ? parseInt(usuario_id, 10) : undefined,
    });
  }

  @Patch('mensalidades/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'; observacao?: string },
  ) {
    return this.finance.updateStatus(parseInt(id, 10), body.status, body.observacao);
  }

  @Post('mensalidades/:id/pagar')
  markPaid(@Param('id') id: string, @Body() body: { data_pagamento?: Date }) {
    return this.finance.markPaid(parseInt(id, 10), body.data_pagamento);
  }

  @Post('mensalidades/:id/cancelar')
  cancel(@Param('id') id: string, @Body() body: { observacao?: string }) {
    return this.finance.cancel(parseInt(id, 10), body.observacao);
  }

  @Patch('mensalidades/:id/usuario')
  updateUsuario(
    @Param('id') id: string,
    @Body() body: { usuario_id: number | null },
  ) {
    return this.finance.updateUsuario(parseInt(id, 10), body.usuario_id ?? null);
  }

  @Get('mensalidades/totais')
  totals(@Query('month') month: string, @Query('year') year: string) {
    return this.finance.totals(parseInt(month, 10), parseInt(year, 10));
  }


  @Post('mensalidades/:id/notificar-atraso')
  notifyLate(@Param('id') id: string) {
    return this.finance.notifyLate(parseInt(id, 10));
  }

  @Post('mensalidades/:id/enviar-lembrete')
  sendReminder(@Param('id') id: string) {
    return this.finance.sendReminder(parseInt(id, 10));
  }
}