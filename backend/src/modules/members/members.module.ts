import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Member } from '../../database/models/member.model';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { InvitesModule } from '../invites/invites.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SequelizeModule.forFeature([Member]), InvitesModule, UsersModule],
  providers: [MembersService],
  controllers: [MembersController],
})
export class MembersModule {}