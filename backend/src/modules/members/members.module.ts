import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Member } from '../../database/models/member.model';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { InvitesModule } from '../invites/invites.module';

@Module({
  imports: [SequelizeModule.forFeature([Member]), InvitesModule],
  providers: [MembersService],
  controllers: [MembersController],
})
export class MembersModule {}