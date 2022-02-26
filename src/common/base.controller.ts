/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Type,
  CanActivate,
  Get,
  Param,
  UseGuards,
  Query,
  Post,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import { OmitType, PartialType } from '@nestjs/swagger';
import { Controller } from './controller.interface';
import { Repository } from './repository.interface';
import {
  asTitle,
  ConditionalDecorator,
  decoratorFunc,
  DecoratorList,
} from '../util';

interface EndpointOptions<T> {
  guards?: (Function | CanActivate)[];
  decorators?: decoratorFunc[];
  returnMapper?: (doc: T) => T | Promise<T>;
  disabled?: boolean;
}

interface BaseControllerOptions<T> {
  createInput?: any;
  updateInput?: any;

  singleName?: string;
  pluralName?: string;

  returnMapper?: (doc: T) => T | Promise<T>;

  get?: EndpointOptions<T>;
  list?: EndpointOptions<T>;
  create?: EndpointOptions<T>;
  update?: EndpointOptions<T>;
  remove?: EndpointOptions<T>;
}

export function BaseController<T, CreateType = T, UpdateType = CreateType>(
  modelRef: Type<T>,
  options: BaseControllerOptions<T> = {},
): Controller<T, CreateType, UpdateType> {
  type IRepository = Repository<T, CreateType, UpdateType>;
  type IController = Controller<T, CreateType, UpdateType>;

  const singleName =
    (options.singleName && options.singleName.toLowerCase()) ||
    modelRef.name.toLowerCase();
  const pluralName =
    (options.pluralName && options.pluralName.toLowerCase()) ||
    `${modelRef.name.toLowerCase()}s`;

  let createInput;
  if (options.createInput) {
    createInput = options.createInput;
  } else {
    class CreateInput extends OmitType<any, string>(modelRef, [
      'id',
    ] as const) {}
    createInput = CreateInput;
  }

  let updateInput;
  if (options.updateInput) {
    updateInput = options.updateInput;
  } else {
    class UpdateInput extends PartialType(createInput) {}
    updateInput = UpdateInput;
  }

  const getGuards = (options.get && options.get.guards) || [];
  const listGuards = (options.list && options.list.guards) || [];
  const createGuards = (options.create && options.create.guards) || [];
  const updateGuards = (options.update && options.update.guards) || [];
  const removeGuards = (options.remove && options.remove.guards) || [];

  const getDecorators = (options.get && options.get.decorators) || [];
  const listDecorators = (options.list && options.list.decorators) || [];
  const createDecorators = (options.create && options.create.decorators) || [];
  const updateDecorators = (options.update && options.update.decorators) || [];
  const removeDecorators = (options.remove && options.remove.decorators) || [];

  const returnMapper: (doc: T) => T =
    options.returnMapper ||
    ((doc: T) => {
      const newDoc = JSON.parse(JSON.stringify(doc));
      if (newDoc.password) {
        delete newDoc.password;
      }
      return newDoc;
    });

  const getReturnMapper =
    (options.get && options.get.returnMapper) || returnMapper;
  const listReturnMapper =
    (options.list && options.list.returnMapper) || returnMapper;
  const createReturnMapper =
    (options.create && options.create.returnMapper) || returnMapper;
  const updateReturnMapper =
    (options.update && options.update.returnMapper) || returnMapper;
  const removeReturnMapper =
    (options.remove && options.remove.returnMapper) || returnMapper;

  class CreateInput extends createInput {}
  Object.defineProperty(CreateInput, 'name', {
    value: createInput.name || `Create${asTitle(singleName)}DTO`,
  });

  class UpdateInput extends updateInput {}
  Object.defineProperty(UpdateInput, 'name', {
    value: updateInput.name || `Update${asTitle(singleName)}DTO`,
  });

  abstract class BaseControllerHost {
    constructor(private readonly repository: IRepository) {}

    @ConditionalDecorator(
      options.get && options.get.decorators instanceof Array,
      DecoratorList(...getDecorators),
    )
    @ConditionalDecorator(
      !(options.get && options.get.disabled),
      UseGuards(...getGuards),
    )
    @ConditionalDecorator(!(options.get && options.get.disabled), Get(':id'))
    async get(@Param('id') id: string): Promise<IController['get']> {
      return getReturnMapper(await this.repository.findById(id)) as any;
    }

    @ConditionalDecorator(
      options.list && options.list.decorators instanceof Array,
      DecoratorList(...listDecorators),
    )
    @ConditionalDecorator(
      !(options.list && options.list.disabled),
      UseGuards(...listGuards),
    )
    @ConditionalDecorator(!(options.list && options.list.disabled), Get(''))
    async list(
      @Query('skip') skip: number,
        @Query('count') count: number,
    ): Promise<IController['list']> {
      return (await this.repository.find({}, skip, count)).map(doc =>
        listReturnMapper(doc),
      ) as any;
    }

    @ConditionalDecorator(
      options.create && options.create.decorators instanceof Array,
      DecoratorList(...createDecorators),
    )
    @ConditionalDecorator(
      !(options.create && options.create.disabled),
      UseGuards(...createGuards),
    )
    @ConditionalDecorator(
      !(options.create && options.create.disabled),
      Post(''),
    )
    async create(@Body() body: CreateInput): Promise<IController['create']> {
      return createReturnMapper(
        await this.repository.create(body as any),
      ) as any;
    }

    @ConditionalDecorator(
      options.update && options.update.decorators instanceof Array,
      DecoratorList(...updateDecorators),
    )
    @ConditionalDecorator(
      !(options.update && options.update.disabled),
      UseGuards(...updateGuards),
    )
    @ConditionalDecorator(
      !(options.update && options.update.disabled),
      Patch(':id'),
    )
    async update(
      @Param('id') id: string,
        @Body() body: UpdateInput,
    ): Promise<IController['update']> {
      return updateReturnMapper(
        await this.repository.update(id, body as any),
      ) as any;
    }

    @ConditionalDecorator(
      options.remove && options.remove.decorators instanceof Array,
      DecoratorList(...removeDecorators),
    )
    @ConditionalDecorator(
      !(options.remove && options.remove.disabled),
      UseGuards(...removeGuards),
    )
    @ConditionalDecorator(
      !(options.remove && options.remove.disabled),
      Delete(':id'),
    )
    async remove(@Param('id') id: string): Promise<IController['remove']> {
      return removeReturnMapper(await this.repository.remove(id)) as any;
    }
  }

  return BaseControllerHost as any;
}
