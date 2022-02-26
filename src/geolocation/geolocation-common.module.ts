import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from '../jobs/jobs.module';
import { TimerModule } from '../timer/timer.module';
import { GeolocationGateway } from './gateway/geolocation.gateway';
import { GeolocationEventsService } from './geolocation-events.service';
import { Geolocation } from './geolocation.model';
import { GeolocationRepo } from './geolocation.repository';
import { GeolocationService } from './geolocation.service';
import { LocationModule } from '../location/location.module';
import { Loads } from './loads.model';
import { LoadsRepo } from './loads.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Geolocation, Loads]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => JobsModule),
    TimerModule,
    LocationModule,
  ],
  providers: [
    GeolocationService,
    GeolocationRepo,
    GeolocationGateway,
    GeolocationEventsService,
    LoadsRepo,
  ],
  exports: [
    PassportModule,
    TypeOrmModule,
    GeolocationService,
    GeolocationRepo,
    GeolocationGateway,
    GeolocationEventsService,
    LoadsRepo,
  ],
})
export class GeolocationCommonModule {}
