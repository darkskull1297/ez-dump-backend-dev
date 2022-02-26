import { StrictEventEmitter } from 'nest-emitter';
import { EventEmitter } from 'events';

import { TruckLocationInfo } from './gateway/truck-location-info.interface';

interface GeolocationEvents {
  truckLocationUpdated: TruckLocationInfo;
}

export type GeolocationEventEmitter = StrictEventEmitter<
EventEmitter,
GeolocationEvents
>;
