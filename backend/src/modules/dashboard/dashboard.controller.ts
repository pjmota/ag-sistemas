import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/sequelize';
import { Thanks } from '../../database/models/thanks.model';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService, @InjectModel(Thanks) private thanksModel: typeof Thanks) {}

  @Get('kpis')
  @UseGuards(AuthGuard('jwt'))
  async kpis() {
    return this.dashboardService.kpis();
  }

  // Registrar um "obrigado" (para usar no KPI)
  @Post('obrigados')
  @UseGuards(AuthGuard('jwt'))
  async createThanks(@Body() body: { membro_id: number; descricao: string }) {
    return this.thanksModel.create({ ...body });
  }
}