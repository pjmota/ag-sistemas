import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Plan } from '../../database/models/plan.model';
import { MemberPlan } from '../../database/models/member-plan.model';
import { Fee } from '../../database/models/fee.model';
import { Member } from '../../database/models/member.model';
import { User } from '../../database/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Plan, MemberPlan, Fee, Member, User])],
  providers: [FinanceService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}