import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../database/models/user.model';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { InvitesModule } from '../invites/invites.module';
import { SchemaInitService } from '../../bootstrap/schema-init.service';

@Module({
  imports: [SequelizeModule.forFeature([User]), InvitesModule],
  providers: [UsersService, SchemaInitService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}