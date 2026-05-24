import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(employeeId: string, imagePath?: string) {
    return this.prisma.attendance.create({
      data: {
        employeeId,
        type: AttendanceType.CHECKIN,
        imagePath,
      },
    });
  }

  async checkOut(employeeId: string, imagePath?: string) {
    return this.prisma.attendance.create({
      data: {
        employeeId,
        type: AttendanceType.CHECKOUT,
        imagePath,
      },
    });
  }

  async getAttendance(employeeId: string) {
    return this.prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLatestAttendance(employeeId: string) {
    return this.prisma.attendance.findFirstOrThrow({
      where: { employeeId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAllAttendance(page: number, limit: number) {
    // fetch all records - no pagination yet
    const allRecords = await this.prisma.attendance.findMany({
      orderBy: { timestamp: 'asc' },
    });

    // group by employeeId + date
    const grouped: Record<string, any> = {};

    for (const record of allRecords) {
      const date = record.timestamp.toISOString().split('T')[0];
      const key = `${record.employeeId}-${date}`;

      if (!grouped[key]) {
        grouped[key] = {
          employeeId: record.employeeId,
          date,
          checkIn: null,
          checkOut: null,
        };
      }

      if (record.type === 'CHECKIN') {
        if (
          !grouped[key].checkIn || record.timestamp < grouped[key].checkIn.timestamp) {
          grouped[key].checkIn = record
        }
      }

      if (record.type === 'CHECKOUT') {
        if (
          !grouped[key].checkOut || record.timestamp > grouped[key].checkOut.timestamp) {
          grouped[key].checkOut = record
        }
      }
    }

    // convert to array and sort by date desc
    const groupedArray = Object.values(grouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // paginate the grouped result
    const total = groupedArray.length;
    const skip = (page - 1) * limit;
    const data = groupedArray.slice(skip, skip + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
