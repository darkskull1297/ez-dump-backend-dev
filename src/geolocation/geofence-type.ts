import { GeolocationType } from './geolocation-type';

export type Geofence = {
  action: GeofenceAction;
  identifier: GeolocationType;
  location: {
    activity: { confidence: number; type: string };
    battery: { is_charging: boolean; level: number };
    coords: {
      accuracy: number;
      altitude: number;
      altitude_accuracy: number;
      floor: any;
      heading: number;
      heading_accuracy: number;
      latitude: number;
      longitude: number;
      speed: number;
      speed_accuracy: number;
    };
    event: string;
    extras: any;
    geofence: { action: GeofenceAction; identifier: GeolocationType };
    is_moving: boolean;
    odometer: number;
    timestamp: string;
    uuid: string;
  };
};

export enum GeofenceAction {
  EXIT = 'EXIT',
  ENTER = 'ENTER',
}
