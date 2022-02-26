import { Type } from '@nestjs/common';
import { Repository as TypeOrmRepository, FindConditions } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DocumentNotFoundException } from './exceptions/document-not-found.exception';
import { TypeOrmException } from './exceptions/type-orm.exception';
import { Repository } from './repository.interface';
import { BaseModel } from './base.model';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function BaseRepository<
  T extends BaseModel,
  CreateType = Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  UpdateType = QueryDeepPartialEntity<T>
>(modelRef: Type<T>): Repository<T, CreateType, UpdateType> {
  abstract class BaseRepositoryHost {
    constructor(private readonly model: TypeOrmRepository<T>) {}

    async findById(id: string): Promise<T> {
      try {
        const doc = await this.model.findOne(id);
        if (!doc) {
          throw new DocumentNotFoundException(modelRef.name, id);
        }
        return doc;
      } catch (e) {
        if (e instanceof DocumentNotFoundException) {
          throw e;
        }
        throw new TypeOrmException(e);
      }
    }

    async findOne(query: FindConditions<T>): Promise<T> {
      try {
        const doc = await this.model.findOne(query);
        if (!doc) {
          throw new DocumentNotFoundException(modelRef.name);
        }
        return doc;
      } catch (e) {
        if (e instanceof DocumentNotFoundException) {
          throw e;
        }
        throw new TypeOrmException(e);
      }
    }

    async find(
      query: FindConditions<T>,
      skip: number,
      count: number,
    ): Promise<T[]> {
      try {
        return this.model.find({ where: query, skip, take: count });

        // return this.model.find({
        //   where: query,
        //   skip,
        //   take: count,
        //   order: { createdAt: -1 },
        // });
      } catch (e) {
        throw new TypeOrmException(e);
      }
    }

    async create(data: CreateType): Promise<T> {
      try {
        // eslint-disable-next-line new-cap
        const doc = new modelRef();
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            doc[key as string] = value;
          }
        }
        return this.model.save(doc as any);
      } catch (e) {
        throw new TypeOrmException(e);
      }
    }

    async update(id: string, diff: UpdateType): Promise<T> {
      try {
        await this.model.update({ id } as any, diff);
        return this.findById(id);
      } catch (e) {
        throw new TypeOrmException(e);
      }
    }

    async remove(id: string): Promise<T> {
      try {
        const doc = await this.findById(id);
        return this.model.remove(doc);
      } catch (e) {
        throw new TypeOrmException(e);
      }
    }

    async save(doc: T): Promise<T> {
      try {
        return this.model.save(doc as any);
      } catch (e) {
        throw new TypeOrmException(e);
      }
    }
  }
  return BaseRepositoryHost as any;
}
