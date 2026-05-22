import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { EmployeeLevel } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(EmployeeLevel)
  @IsOptional()
  level?: EmployeeLevel;

  @IsEmail()
  email!: string;
}
