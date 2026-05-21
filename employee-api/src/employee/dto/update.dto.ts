import { IsString, IsOptional, IsEnum } from 'class-validator';
import { EmployeeLevel } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(EmployeeLevel)
  @IsOptional()
  level?: EmployeeLevel;
}
