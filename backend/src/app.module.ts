import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './modules/auth/auth.module';
import { IntentionsModule } from './modules/intentions/intentions.module';
import { InvitesModule } from './modules/invites/invites.module';
import { MembersModule } from './modules/members/members.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { User } from './database/models/user.model';
import { Member } from './database/models/member.model';
import { Intention } from './database/models/intention.model';
import { Invite } from './database/models/invite.model';
import { Referral } from './database/models/referral.model';
import { Thanks } from './database/models/thanks.model';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: process.env.DB_PATH || 'db.sqlite',
      autoLoadModels: true,
      synchronize: true,
      models: [User, Member, Intention, Invite, Referral, Thanks],
      logging: false,
    }),
    AuthModule,
    IntentionsModule,
    InvitesModule,
    MembersModule,
    ReferralsModule,
    DashboardModule,
  ],
})
export class AppModule {}