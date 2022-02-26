import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Material } from './material.model';

@Injectable()
export class MaterialRepo extends BaseRepository<Material>(Material) {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
  ) {
    super(materialRepo);
  }

  async findAll(): Promise<Material[]> {
    return this.materialRepo.query(`SELECT name FROM materials`);
  }

  async findMaterial(materialName: string): Promise<any> {
    const material = await this.materialRepo.query(
      `SELECT name FROM materials WHERE name = $1`,
      [materialName],
    );

    return material;
  }
}
