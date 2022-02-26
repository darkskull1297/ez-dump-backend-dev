export interface TruckLocationInfo {
  lat: string;
  long: string;
  date: Date;
  truckId: string;
  truckName: string;
  driverId: string;
  jobName: string;
  userName: string;
  jobId: string;
  startedAt?: Date;
  speed?: number;
}
