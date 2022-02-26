import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { WorkOrderItems } from './work-order-items.model';

@Injectable()
export class WorkOrderItemsRepo extends BaseRepository<WorkOrderItems> (WorkOrderItems) {
  constructor(
    @InjectRepository(WorkOrderItems)
    private readonly workOrderItemsRepo: Repository<WorkOrderItems>,
  ) {
    super(workOrderItemsRepo);
  }

  async createWorkOrderItem(workOrderItem): Promise<WorkOrderItems> {
    return await this.workOrderItemsRepo.save({
      name: workOrderItem.name,
      comments: workOrderItem.comments,
      labor: workOrderItem.labor,
      parts: workOrderItem.parts,
      workOrder: workOrderItem.foundWorkOrder,
      truck: workOrderItem.truck,
      user: workOrderItem.user
    });
  }

  async deleteWorkOrderItemsByWorkOrderId(workOrderId): Promise<void> {
    await this.workOrderItemsRepo.query(
    `
      DELETE FROM
        work_order_items
      WHERE
        "workOrderId" = $1;
    `,
      [workOrderId],
    );
  }

  async getWorkOrderItemsByWorkOrder(
    workOrderId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const workOrderItems = await this.workOrderItemsRepo.query(
    `
      SELECT
        *
      FROM
        work_order_items
      WHERE
        "workOrderId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      ORDER BY
        "createdAt" DESC;
    `,
      [workOrderId, start, end],
    );
    return workOrderItems;
  }

  async getWorkOrderItemsByTruck(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const workOrderItems = await this.workOrderItemsRepo.query(
    `
      SELECT
        *
      FROM
        work_order_items
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      ORDER BY
        "createdAt" DESC;
    `,
      [truckId, start, end],
    );
    return workOrderItems;
  }

  async getTotalLaborByWorkOrder(
    workOrderId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalLaborByWorkOrder = await this.workOrderItemsRepo.query(
    `
      SELECT
        "workOrderId", SUM(labor) as total
      FROM
        work_order_items
      WHERE
        "workOrderId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        "workOrderId";
    `,
      [workOrderId, start, end],
    );
    return +totalLaborByWorkOrder[0].total;
  }

  async getTotalPartsByWorkOrder(
    workOrderId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalPartsByWorkOrder = await this.workOrderItemsRepo.query(
    `
      SELECT
        "workOrderId", SUM(parts) as total
      FROM
        work_order_items
      WHERE
        "workOrderId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        "workOrderId";
    `,
      [workOrderId, start, end],
    );
    return +totalPartsByWorkOrder[0].total;
  }

  async getTotalLaborByTruck(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalLaborByTruck = await this.workOrderItemsRepo.query(
    `
      SELECT
        "truckId", SUM(labor) as total
      FROM
        work_order_items
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        "truckId";
    `,
      [truckId, start, end],
    );
    return +totalLaborByTruck[0].total;
  }

  async getTotalPartsByTruck(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalPartsByTruck = await this.workOrderItemsRepo.query(
    `
      SELECT
        "truckId", SUM(parts) as total
      FROM
        work_order_items
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        "truckId";
    `,
      [truckId, start, end],
    );
    return +totalPartsByTruck[0].total;
  }

  async getTotalExpensesByWorkOrderId(
    workOrderId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalExpensesByWorkOrder = await this.workOrderItemsRepo.query(
    `
      SELECT
        SUM(labor + parts)
      FROM
        work_order_items
      WHERE
        "workOrderId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL));
    `,
      [workOrderId, start, end],
    );
    return +totalExpensesByWorkOrder[0].sum;
  }

  async getTotalExpensesByTruckId(
    truckId: string,
    start: string,
    end: string,
  ): Promise<number> {
    const totalExpensesByTruck = await this.workOrderItemsRepo.query(
    `
      SELECT
        SUM(labor + parts)
      FROM
        work_order_items
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL));
    `,
      [truckId, start, end],
    );
    return +totalExpensesByTruck[0].sum;
  }

  async getTotalExpensesByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalExpensesByOwner = await this.workOrderItemsRepo.query(
    `
      SELECT
        SUM(labor + parts)
      FROM
        work_order_items
      WHERE
        "userId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL));
    `,
      [ownerId, start, end],
    );
    return +totalExpensesByOwner[0].sum;
  }
}
