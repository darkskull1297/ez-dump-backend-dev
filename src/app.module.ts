import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestEmitterModule } from 'nest-emitter';
import { EventEmitter } from 'events';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import databaseConfig from './config/database.config';
import { EmailModule } from './email/email.module';
import { CompanyModule } from './company/company.module';
import { S3Module } from './s3/s3.module';
import { JobsModule } from './jobs/jobs.module';
import { TrucksModule } from './trucks/trucks.module';
import { TimerModule } from './timer/timer.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { ProblemsModule } from './problems/problems.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StripeModule } from './stripe/stripe.module';
import { AnaliticsModule } from './analitics/analitics.module';
import emailConfig from './config/email.config';
import { GeneralJobModule } from './general-jobs/general-job.module';
import { BillModule } from './bill/bill.module';
import { SettingsModule } from './settings/settings.module';
import NamingStrategy from './namingStrategy';
import { CustomerModule } from './customer/customer.module';
import { UserSubscriber } from './user/triggers/user-trigger';
import { TruckSubscriber } from './trucks/triggers/truck-trigger';

@Module({
  imports: [
    NestEmitterModule.forRoot(new EventEmitter()),
    CommonModule,
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (dbConf: ConfigType<typeof databaseConfig>) => ({
        type: dbConf.type as any,
        host: dbConf.host,
        port: dbConf.port,
        username: dbConf.username,
        password: dbConf.password,
        database: dbConf.database,
        entities: ['dist/**/*.model{.ts,.js}'],
        synchronize: dbConf.synchronize,
        logging: dbConf.logging,
        namingStrategy: new NamingStrategy(),
        subscribers: [UserSubscriber, TruckSubscriber],
      }),
      inject: [databaseConfig.KEY],
    }),
    EmailModule.forRootAsync({
      useFactory: (emailConf: ConfigType<typeof emailConfig>) => ({
        sender: emailConf.sender,
        disableEmailModule: emailConf.disableEmailModule,
        exposeTemplateEndpoint: emailConf.exposeTemplateEndpoint,
      }),
      inject: [emailConfig.KEY],
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    CompanyModule,
    S3Module,
    JobsModule,
    TrucksModule,
    TimerModule,
    GeneralJobModule,
    CustomerModule,
    BillModule,
    GeolocationModule,
    NotificationModule,
    ProblemsModule,
    InvoicesModule,
    ReviewsModule,
    StripeModule,
    AnaliticsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
