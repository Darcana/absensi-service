import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(employeeId: number, imagePath?: string) {
    return this.prisma.attendance.create({
      data: {
        employeeId,
        type: AttendanceType.CHECKIN,
        imagePath,
      },
    });
  }

  async checkOut(employeeId: number, imagePath?: string) {
    return this.prisma.attendance.create({
      data: {
        employeeId,
        type: AttendanceType.CHECKOUT,
        imagePath,
      },
    });
  }

  async getAttendance(employeeId: number) {
    return this.prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
