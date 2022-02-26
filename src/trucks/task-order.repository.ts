import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { TaskOrder } from './task-order.model';

@Injectable()
export class TaskOrderRepo extends BaseRepository<TaskOrder> (TaskOrder) {
  constructor(
    @InjectRepository(TaskOrder)
    private readonly taskOrderRepo: Repository<TaskOrder>,
  ) {
    super(taskOrderRepo);
  }

  createTaskOrder(taskOrder): Promise<TaskOrder> {
    return this.taskOrderRepo.save(taskOrder);
  }

  updateTaskOrderStatus(
    taskOrderId: string,
    status: string,
  ): Promise<any> {
    return this.taskOrderRepo.query(
    `
      UPDATE
        task_order
      SET
        status = $1
      WHERE
        id = $2;
    `,
      [status, taskOrderId],
    );
  }

  setTaskOrderAsDone(
    taskOrderId: string,
    status: string,
  ): Promise<any> {
    return this.taskOrderRepo.query(
    `
      UPDATE
        task_order
      SET
        "doneAt" = NOW(), status = $1
      WHERE
        id = $2;
    `,
      [status, taskOrderId],
    );
  }

  editTaskOrdersCurrentMilesByTruckId(
    currentMiles: number,
    truckId: string,
  ): Promise<any> {
    return this.taskOrderRepo.query(
    `
      UPDATE
        task_order
      SET
        "currentMiles" = $1
      WHERE
        "truckId" = $2;
    `,
      [currentMiles, truckId],
    );
  }

  async getTaskOrderById(taskOrderId: string): Promise<any> {
    const taskOrder = await this.taskOrderRepo.query(
    `
      SELECT
        *
      FROM
        task_order
      WHERE
        id = $1;
    `,
      [taskOrderId],
    );
    return taskOrder;
  }

  async getTaskOrderByOrderNumber(orderNumber: string): Promise<any> {
    const taskOrder = await this.taskOrderRepo.query(
    `
      SELECT
        *
      FROM
        task_order
      WHERE
        "orderNumber" = $1;
    `,
      [orderNumber],
    );
    return taskOrder;
  }

  async getTruckIdByTaskOrderId(taskOrderId: string): Promise<any> {
    const taskOrder = await this.taskOrderRepo.query(
    `
      SELECT
        "truckId"
      FROM
        task_order
      WHERE
        id = $1;
    `,
      [taskOrderId],
    );
    return taskOrder[0].truckId;
  }

  async getNotDoneTaskOrdersByOwnerId(
    ownerId: string,
  ): Promise<any> {
    const taskOrders = await this.taskOrderRepo.query(
    `
      SELECT
        *
      FROM
        task_order
      WHERE
        "userId" = $1
      AND
        (status != $2) AND ("isDeleted" = false)
      ORDER BY
        "createdAt" DESC;
    `,
      [ownerId, 'Done'],
    );
    return taskOrders;
  }

  async getTaskOrdersByOwnerId(
    ownerId: string,
  ): Promise<any> {
    const taskOrders = await this.taskOrderRepo.query(
    `
      SELECT
        *
      FROM
        task_order
      WHERE
        "userId" = $1
      AND
        "isDeleted" = false
      ORDER BY
        "createdAt" DESC;
    `,
      [ownerId],
    );
    return taskOrders;
  }

  async getTaskOrdersByTruckId(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const taskOrders = await this.taskOrderRepo.query(
    `
      SELECT
        *
      FROM
        task_order
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      AND
        ("isDeleted" = false)
      ORDER BY
        "createdAt" DESC;
    `,
      [truckId, start, end],
    );
    return taskOrders;
  }

  async getTotalTaskOrdersByTruckAndStatus(
    truckId: string,
    status: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalTaskOrdersByStatus = await this.taskOrderRepo.query(
    `
      SELECT
        COUNT(status)
      FROM
        task_order
      WHERE
        ("createdAt" BETWEEN $3 AND $4 OR ($3 IS NULL AND $4 IS NULL))
      AND
        ("truckId" = $1) AND (status = $2) AND ("isDeleted" = false);
    `,
      [truckId, status, start, end],
    );
    return +totalTaskOrdersByStatus[0].count;
  }
}
