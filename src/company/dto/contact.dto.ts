import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Contact } from '../contact.model';

export class ContactDTO {
  @ApiProperty({ description: "Contact's name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Contact's title" })
  @IsString()
  title: string;

  @ApiProperty({ description: "Contact's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: "Contact's email" })
  @IsString()
  @IsEmail()
  email: string;

  toModel?(): Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'company'> {
    return {
      name: this.name,
      title: this.title,
      phoneNumber: this.phoneNumber,
      email: this.email,
    };
  }

  static fromModel(contact: Contact): ContactDTO {
    const { name, title, phoneNumber, email } = contact;
    return {
      name,
      title,
      phoneNumber,
      email,
    };
  }
}
