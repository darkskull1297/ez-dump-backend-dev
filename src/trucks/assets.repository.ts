import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { BaseRepository } from '../common/base.repository';
import { Assets } from './assets.model';
import { DefectDTO } from './dto/defect.dto';

@Injectable()
export class AssetsRepo extends BaseRepository<Assets>(Assets) {
  constructor(
    @InjectRepository(Assets)
    private readonly assetsRepo: Repository<Assets>,
  ) {
    super(assetsRepo);
  }

  public async setDefectAsSolvedByNumber(assetNumber: number): Promise<any> {
    return this.assetsRepo.query(
      `
      UPDATE
        assets
      SET
        status = $1, "fixedAt" = NOW()
      WHERE
        "assetNumber" = $2;
    `,
      ['Solved', assetNumber],
    );
  }

  public async updateDefectStatusByNumber(
    assetNumber: number,
    status: string,
  ): Promise<void> {
    await this.assetsRepo.query(
      `
      UPDATE
        assets
      SET
        status = $1
      WHERE
        "assetNumber" = $2;
    `,
      [status, assetNumber],
    );
  }

  public async getGallonsAssetByInspectionId(
    truckInspectionId: string,
  ): Promise<Assets[]> {
    return this.assetsRepo.query(
      `
      SELECT
        *
      FROM
        assets
      WHERE
        "truckInspectionId" = $1
      AND
        title = $2;
    `,
      [truckInspectionId, 'gallons'],
    );
  }

  public async getAssetsByInspectionId(
    truckInspectionId: string,
  ): Promise<Assets[]> {
    return this.assetsRepo.query(
      `
      SELECT
        *
      FROM
        assets
      WHERE
        "truckInspectionId" = $1;
    `,
      [truckInspectionId],
    );
  }

  public async getDefectByNumber(assetNumber: number): Promise<DefectDTO> {
    const defect = await this.assetsRepo.query(
      `
      SELECT
        *
      FROM
        assets
      WHERE
        "assetNumber" = $1
      AND
        status != $2;
    `,
      [assetNumber, 'Passed'],
    );
    return defect[0];
  }

  public async getGallonsAssetByNumber(assetNumber: number): Promise<any> {
    const gallonsAsset = await this.assetsRepo.query(
      `
      SELECT
        *
      FROM
        assets
      WHERE
        "assetNumber" = $1
      AND
        status = $2;
    `,
      [assetNumber, 'Passed'],
    );
    return gallonsAsset[0];
  }

  public async getDefectsByInspectionId(
    truckInspectionId: string,
  ): Promise<Assets[]> {
    const defects = await this.assetsRepo.query(
      `
      SELECT
        *
      FROM
        assets
      WHERE
        "truckInspectionId" = $1
      AND
        status != $2;
    `,
      [truckInspectionId, 'Passed'],
    );
    return defects;
  }

  public async getTotalUnsolvedDefectsByInspectionId(
    truckInspectionId: string,
  ): Promise<number> {
    const totalUnsolvedDefects = await this.assetsRepo.query(
      `
      SELECT
        COUNT(*)
      FROM
        assets
      WHERE
        "truckInspectionId" = $1
      AND
        ("fixedAt" IS NULL AND status != $2);
    `,
      [truckInspectionId, 'Passed'],
    );
    return +totalUnsolvedDefects[0].count;
  }

  public async getMilesByTruckInspectionId(
    truckInspectionId: string,
  ): Promise<number> {
    const miles = await this.assetsRepo.query(
      `
      SELECT
        value
      FROM
        assets
      WHERE
        "truckInspectionId" = $1
      AND
        title = $2;
    `,
      [truckInspectionId, 'miles'],
    );
    return +miles[0].value;
  }

  public async getMilesByDefectId(defectId: string): Promise<number> {
    const miles = await this.assetsRepo.query(
      `
      SELECT
        value
      FROM
        assets
      WHERE
        id = $1
      AND
        title = $2;
    `,
      [defectId, 'miles'],
    );
    return +miles[0].value;
  }

  async getTotalCorrectedDefectsByInspectionId(
    truckInspectionId: string,
  ): Promise<number> {
    const totalCorrectedDefects = await this.assetsRepo.query(
      `
      SELECT
        COUNT("fixedAt")
      FROM
        assets
      WHERE
        "truckInspectionId" = $1;
    `,
      [truckInspectionId],
    );
    return +totalCorrectedDefects[0].count;
  }
}
