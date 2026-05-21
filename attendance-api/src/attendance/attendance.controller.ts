import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'
import { extname } from 'path'
import { AttendanceService } from './attendance.service';
import { multerConfig } from './multer.config';
import { CheckInDto } from './dto/checkin.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  @UseInterceptors(FileInterceptor('photo', multerConfig('checkin')))
  checkIn(@Body() dto: CheckInDto, @UploadedFile() photo: Express.Multer.File) {
    return this.attendanceService.checkIn(
      dto.employeeId,
      photo?.path.replace(/\\/g, '/'),
    );
  }

  @Post('checkout')
  @UseInterceptors(FileInterceptor('photo', multerConfig('checkout')))
  checkOut(
    @Body() dto: CheckInDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    return this.attendanceService.checkOut(
      dto.employeeId,
      photo?.path.replace(/\\/g, '/'),
    );
  }

  @Get(':employeeId')
  getAttendance(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.attendanceService.getAttendance(employeeId);
  }
}
