import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  DefaultValuePipe,
  Query,
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

  @Get('latest/:employeeId')
  getLatestAttendance(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.attendanceService.getLatestAttendance(employeeId);
  }

  @Get()
  getAllAttendance(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.attendanceService.getAllAttendance(page, limit);
  }
}
