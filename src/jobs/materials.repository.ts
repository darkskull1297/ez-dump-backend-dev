import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Materials } from './materials.model';

@Injectable()
export class MaterialsRepo extends BaseRepository<Materials>(Materials) {
  constructor(
    @InjectRepository(Materials)
    private readonly materialsRepo: Repository<Materials>,
  ) {
    super(materialsRepo);
  }

  async findAll(): Promise<Materials[]> {
    return this.materialsRepo.query(`SELECT name FROM materials`);
  }

  async findMaterial(materialName: string): Promise<any> {
    const material = await this.materialsRepo.query(
      `SELECT name FROM materials WHERE name = $1`,
      [materialName],
    );

    return material;
  }
}
