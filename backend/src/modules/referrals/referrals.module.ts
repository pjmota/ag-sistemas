import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Referral } from '../../database/models/referral.model';
import { Thanks } from '../../database/models/thanks.model';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';

@Module({
  imports: [SequelizeModule.forFeature([Referral, Thanks])],
  providers: [ReferralsService],
  controllers: [ReferralsController],
})
export class ReferralsModule {}