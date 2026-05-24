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
import { AttendanceService } from './attendance.service';
import { multerConfig } from './multer.config';
import { CheckInDto } from './dto/checkin.dto';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtGuard)
  @Post('checkin')
  @UseInterceptors(FileInterceptor('photo', multerConfig('checkin')))
  checkIn(@Body() dto: CheckInDto, @UploadedFile() photo: Express.Multer.File) {
    return this.attendanceService.checkIn(
      dto.employeeId,
      photo?.path.replace(/\\/g, '/'),
    );
  }

  @UseGuards(JwtGuard)
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

  @UseGuards(JwtGuard)
  @Get(':employeeId')
  getAttendance(@Param('employeeId') employeeId: string) {
    return this.attendanceService.getAttendance(employeeId);
  }

  @UseGuards(JwtGuard)
  @Get('latest/:employeeId')
  getLatestAttendance(@Param('employeeId') employeeId: string) {
    return this.attendanceService.getLatestAttendance(employeeId);
  }

  @UseGuards(JwtGuard)
  @Get()
  getAllAttendance(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.attendanceService.getAllAttendance(page, limit);
  }

  @UseGuards(JwtGuard)
  @Get('filtered/:employeeId')
  getAllAttendanceSingleEmployee(
    @Param('employeeId') employeeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.attendanceService.getAllAttendanceSingleEmployee(
      employeeId,
      page,
      limit,
    );
  }
}
