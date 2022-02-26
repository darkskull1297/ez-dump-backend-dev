import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { NotificationModule } from '../notification/notification.module';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import jwtConfig from '../config/jwt.config';
import { EmailModule } from '../email/email.module';
import { AuthEventsService } from './auth-events.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (jwtConf: ConfigType<typeof jwtConfig>) => ({
        secret: jwtConf.secret,
        signOptions: { expiresIn: jwtConf.expiresIn },
      }),
      inject: [jwtConfig.KEY],
    }),
    forwardRef(() => NotificationModule),
    UserModule,
    EmailModule.forChild(),
  ],
  providers: [AuthService, JwtStrategy, AuthEventsService],
  exports: [
    PassportModule,
    JwtModule,
    UserModule,
    EmailModule,
    AuthEventsService,
    AuthService,
    JwtStrategy,
  ],
})
export class AuthCommonModule {}
