import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { WorkOrder } from './work-order.model';

@Injectable()
export class WorkOrderRepo extends BaseRepository<WorkOrder>(WorkOrder) {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepo: Repository<WorkOrder>,
  ) {
    super(workOrderRepo);
  }

  createWorkOrder(workOrder): Promise<WorkOrder> {
    return this.workOrderRepo.save(workOrder);
  }

  updateWorkOrderStatus(workOrderId: string, status: string): Promise<any> {
    return this.workOrderRepo.query(
      `
      UPDATE
        work_order
      SET
        status = $1
      WHERE
        id = $2;
    `,
      [status, workOrderId],
    );
  }

  setWorkOrderAsCompleted(
    workOrderId: string,
    paidAt: Date,
    status: string,
    miles: number,
  ): Promise<any> {
    return this.workOrderRepo.query(
      `
      UPDATE
        work_order
      SET
        "paidAt" = $1, status = $2, miles = $3
      WHERE
        id = $4;
    `,
      [paidAt, status, miles, workOrderId],
    );
  }

  async getWorkOrderById(workOrderId: string): Promise<any> {
    const workOrder = await this.workOrderRepo.query(
      `
      SELECT
        *
      FROM
        work_order
      WHERE
        id = $1;
    `,
      [workOrderId],
    );
    return workOrder;
  }

  async getWorkOrderByAssetsNumber(assetNumber: number): Promise<any> {
    const workOrder = await this.workOrderRepo.query(
      `
      SELECT
        *
      FROM
        work_order
      WHERE
        "assetsAssetNumber" = $1;
    `,
      [assetNumber],
    );
    return workOrder;
  }

  async getWorkOrderByTaskOrderId(taskOrderId: string): Promise<any> {
    const workOrder = await this.workOrderRepo.query(
      `
      SELECT
        *
      FROM
        work_order
      WHERE
        "taskOrderId" = $1;
    `,
      [taskOrderId],
    );
    return workOrder;
  }

  async getWorkOrdersByOwnerId(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<any> {
    const workOrders = await this.workOrderRepo.query(
      `
      SELECT
        *
      FROM
        work_order
      WHERE
        "userId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3)
      ORDER BY
        "createdAt" DESC;
    `,
      [ownerId, start, end],
    );
    return workOrders;
  }

  async getWorkOrdersByTruckId(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const workOrders = await this.workOrderRepo.query(
      `
      SELECT
        *
      FROM
        work_order
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      ORDER BY
        "createdAt" DESC;
    `,
      [truckId, start, end],
    );
    return workOrders;
  }

  async getLatestWorkOrdersByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const workOrders = await this.workOrderRepo.query(
      `
      SELECT DISTINCT ON ("truckId")
        *
      FROM
        work_order
      WHERE
        "userId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL));
    `,
      [ownerId, start, end],
    );
    return workOrders;
  }

  async getLatestThreeWorkOrdersForTrucks(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<any> {
    const workOrders = await this.workOrderRepo.query(
      `
      SELECT DISTINCT ON ("truckId")
        "truckId", "createdAt", id
      FROM
        work_order
      WHERE
        "userId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3)
      GROUP BY
        "truckId", "createdAt", id
      LIMIT 3;
    `,
      [ownerId, start, end],
    );
    return workOrders;
  }

  async getTotalCompletedWorkOrdersByOwnerId(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<number> {
    const totalCompletedWorkOrders = await this.workOrderRepo.query(
      `
      SELECT
        COUNT(status)
      FROM
        work_order
      WHERE
        ("createdAt" BETWEEN $2 AND $3)
      AND 
        ("userId" = $1) AND (status = $4);
    `,
      [ownerId, start, end, 'Completed'],
    );
    return +totalCompletedWorkOrders[0].count;
  }

  async getTotalOverdueWorkOrdersByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalOverdueWorkOrders = await this.workOrderRepo.query(
      `
      SELECT
        COUNT("dueDate")
      FROM
        work_order
      WHERE
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      AND
        ("userId" = $1) AND ("dueDate" < NOW()) AND (status != $4);
    `,
      [ownerId, start, end, 'Completed'],
    );
    return +totalOverdueWorkOrders[0].count;
  }

  async getTotalPendingWorkOrdersByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalPendingWorkOrders = await this.workOrderRepo.query(
      `
      SELECT
        COUNT(status)
      FROM
        work_order
      WHERE
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      AND
        ("userId" = $1) AND (status = $4);
    `,
      [ownerId, start, end, 'Pending'],
    );
    return +totalPendingWorkOrders[0].count;
  }

  async getTotalOverdueWorkOrdersByTruckId(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalOverdueWorkOrders = await this.workOrderRepo.query(
      `
      SELECT
        COUNT("dueDate")
      FROM
        work_order
      WHERE
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      AND
        ("truckId" = $1) AND ("dueDate" < NOW()) AND (status != $4);
    `,
      [truckId, start, end, 'Completed'],
    );
    return +totalOverdueWorkOrders[0].count;
  }

  async getTotalPendingWorkOrdersByTruckId(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<number> {
    const totalPendingWorkOrders = await this.workOrderRepo.query(
      `
      SELECT
        COUNT(status)
      FROM
        work_order
      WHERE
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      AND
        ("truckId" = $1) AND (status = $4);
    `,
      [truckId, start, end, 'Pending'],
    );
    return +totalPendingWorkOrders[0].count;
  }

  async getTotalWorkOrdersByOwnerId(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<number> {
    const totalWorkOrders = await this.workOrderRepo.query(
      `
      SELECT
        COUNT(status)
      FROM
        work_order
      WHERE
        "userId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3);
    `,
      [ownerId, start, end],
    );
    return +totalWorkOrders[0].count;
  }

  async getTruckIdByWorkOrderId(workOrderId: string): Promise<any> {
    const workOrder = await this.workOrderRepo.query(
      `
      SELECT
        "truckId"
      FROM
        work_order
      WHERE
        id = $1;
    `,
      [workOrderId],
    );
    return workOrder[0].truckId;
  }
}
