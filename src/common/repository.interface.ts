import { Repository as TypeOrmRepository, FindConditions } from 'typeorm';
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";


export interface Repository<T, CreateType = T, UpdateType = QueryDeepPartialEntity<T>> {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new(model: TypeOrmRepository<T>): Repository<T, CreateType, UpdateType>;

  findById(id: string): Promise<T>;

  findOne(query: FindConditions<T>): Promise<T>;

  find(
    query: FindConditions<T>,
    skip?: number,
    count?: number
  ): Promise<Array<T>>;

  create(data: CreateType): Promise<T>;

  update(id: string, diff: UpdateType): Promise<T>;

  remove(id: string): Promise<T>;

  save(doc: T): Promise<T>;
}