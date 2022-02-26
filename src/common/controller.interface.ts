import { Repository } from './repository.interface';

export interface Controller<T, CreateType, UpdateType> {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (repository: Repository<T, CreateType, UpdateType>): Controller<
  T,
  CreateType,
  UpdateType
  >;

  get(
    id: string,
    ...args: any[]
  ): ReturnType<Repository<T, CreateType, UpdateType>['findById']>;

  list(
    skip: number,
    count: number,
    ...args: any[]
  ): ReturnType<Repository<T, CreateType, UpdateType>['find']>;

  create(
    data: CreateType | any,
    ...args: any[]
  ): ReturnType<Repository<T, CreateType, UpdateType>['create']>;

  update(
    id: string,
    data: UpdateType | any,
    ...args: any[]
  ): ReturnType<Repository<T, CreateType, UpdateType>['update']>;

  remove(
    id: string,
    ...args: any[]
  ): ReturnType<Repository<T, CreateType, UpdateType>['remove']>;
}
