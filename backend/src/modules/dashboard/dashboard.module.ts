import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Member } from '../../database/models/member.model';
import { Referral } from '../../database/models/referral.model';
import { Thanks } from '../../database/models/thanks.model';

@Module({
  imports: [SequelizeModule.forFeature([Member, Referral, Thanks])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}