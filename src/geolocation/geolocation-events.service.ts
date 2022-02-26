import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { GeolocationGateway } from './gateway/geolocation.gateway';
import { TruckLocationInfo } from './gateway/truck-location-info.interface';
import { GeolocationEventEmitter } from './geolocation.events';

@Injectable()
export class GeolocationEventsService implements OnModuleInit {
  constructor(
    private readonly geolocationGateway: GeolocationGateway,
    @InjectEventEmitter()
    private readonly eventEmitter: GeolocationEventEmitter,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on('truckLocationUpdated', data =>
      this.onTruckLocationUpdated(data),
    );
  }

  onTruckLocationUpdated(data: TruckLocationInfo): void {
    this.geolocationGateway.updateTruckLocation(data);
  }
}
