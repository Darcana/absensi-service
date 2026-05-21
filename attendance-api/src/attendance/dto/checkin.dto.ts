import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckInDto {
  @IsInt()
  @Type(() => Number)
  employeeId!: number
}