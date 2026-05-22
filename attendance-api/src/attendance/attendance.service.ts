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

  async getLatestAttendance(employeeId: number) {
    return this.prisma.attendance.findFirstOrThrow({
      where: { employeeId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAllAttendance(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.attendance.count()
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
