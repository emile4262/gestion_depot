import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  [x: string]: any;

  
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
