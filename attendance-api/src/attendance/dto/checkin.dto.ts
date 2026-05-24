import { IsString } from 'class-validator';

export class CheckInDto {
  @IsString()
  employeeId!: string;
}
