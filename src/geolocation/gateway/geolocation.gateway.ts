import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TruckLocationInfo } from './truck-location-info.interface';

@WebSocketGateway(5050)
export class GeolocationGateway {
  @WebSocketServer()
  server;

  connectedTrucks: string[] = [];

  @SubscribeMessage('listen')
  listenTruckGeolocation(client: Socket, { truckId }): void {
    client.join(`truck-geolocation/${truckId}`);
    if (this.connectedTrucks.includes(truckId)) return;
    console.log('holat1');
    this.connectedTrucks.push(truckId);
  }

  @SubscribeMessage('leave')
  leaveTruckGeolocation(client: Socket, { truckId }): void {
    this.connectedTrucks.filter(id => id !== truckId);
    console.log('holat2');
    client.leave(`truck-geolocation/${truckId}`);
  }

  updateTruckLocation({ truckId, ...info }: TruckLocationInfo): void {
    if (!this.connectedTrucks.includes(truckId)) return;
    console.log('holat3');
    this.server
      .to(`truck-geolocation/${truckId}`)
      .emit('truck-geolocation', { ...info, truckId });
  }
}
