import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';
import { validate } from 'class-validator';

export abstract class BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ precision: 0, type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ precision: 0, type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  protected async validation?(): Promise<void> {
    const errors = await validate(this);
    if (errors.length > 0) {
      throw errors;
    }
  }
}
