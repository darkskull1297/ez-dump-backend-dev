import { Injectable } from '@nestjs/common';
import * as Geolocation from 'geolib';
import { Location } from './location.model';

interface LatLong {
  lat: number;
  long: number;
}

@Injectable()
export class LocationService {
  private readonly MILES_TO_METERS = 1609.34;

  locationToLatLong(location: Location): LatLong {
    const { lat, long } = location;
    return { lat: +lat, long: +long };
  }

  isInsideRadius(location: LatLong, center: LatLong, radius: number): boolean {
    return Geolocation.isPointWithinRadius(
      { latitude: location.lat, longitude: location.long },
      { latitude: center.lat, longitude: center.long },
      radius * this.MILES_TO_METERS,
    );
  }

  getDistance(from: Location, to: Location, accuracy: number): number {
    return Geolocation.getDistance(
      {
        latitude: from.lat,
        longitude: from.long,
      },
      {
        latitude: to.lat,
        longitude: to.long,
      },
      accuracy,
    );
  }
}
