import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Intention } from '../../database/models/intention.model';
import { Member } from '../../database/models/member.model';
import { IntentionsService } from './intentions.service';
import { IntentionsController } from './intentions.controller';

@Module({
  imports: [SequelizeModule.forFeature([Intention, Member])],
  providers: [IntentionsService],
  controllers: [IntentionsController],
  exports: [IntentionsService],
})
export class IntentionsModule {}