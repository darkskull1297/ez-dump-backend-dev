import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { User } from '../user.model';
import { UserLog } from '../user-log.model';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  // Denotes that this subscriber only listens to Trip Entity
  listenTo() {
    return User;
  }

  // Called after entity insertion
  async afterInsert(event: InsertEvent<User>) {
    const userLog = this.returnClassEntity(event.entity);

    await event.manager.getRepository(UserLog).insert(userLog);
  }

  async afterUpdate(event: UpdateEvent<User>) {
    console.info('After update entity: ', event.entity);

    const userLog = this.returnClassEntity(event.entity);

    await event.manager.getRepository(UserLog).save(userLog);
  }

  async afterRemove(event: RemoveEvent<User>) {
    const userLog = this.returnClassEntity(event.entity);
    userLog.deletedAt = new Date();

    await event.manager.getRepository(UserLog).save(userLog);
  }

  private returnClassEntity(user: User): UserLog {
    const userLog = new UserLog();

    userLog.id = user.id;
    userLog.name = user.name;
    userLog.email = user.email;
    userLog.role = user.role;
    userLog.password = user.password;
    userLog.shortid = user.shortid;
    userLog.createdAt = user.createdAt;
    userLog.updatedAt = user.updatedAt;
    userLog.phoneNumber = user.phoneNumber;
    userLog.profileImg = user.profileImg;
    userLog.verifiedEmail = user.verifiedEmail;

    return userLog;
  }
}
