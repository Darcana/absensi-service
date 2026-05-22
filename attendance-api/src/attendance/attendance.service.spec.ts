import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';

const mockPrismaService = {
  attendance: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirstOrThrow: jest.fn(),
    count: jest.fn(),
  },
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks()
  });

  describe('checkIn', () => {
    it('should create a checkin record', async () => {
      const mockRecord = {
        id: 1,
        employeeId: 1,
        type: AttendanceType.CHECKIN,
        timestamp: new Date(),
        imagePath: 'uploads/checkin-123.jpg',
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkIn(1, 'uploads/checkin-123.jpg')

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId: 1,
          type: AttendanceType.CHECKIN,
          imagePath: 'uploads/checkin-123.jpg',
        },
      });
    });

    it('should create a checkin record without photo', async () => {
      const mockRecord = {
        id: 1,
        employeeId: 1,
        type: AttendanceType.CHECKIN,
        timestamp: new Date(),
        imagePath: undefined,
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkIn(1, undefined)

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId: 1,
          type: AttendanceType.CHECKIN,
          imagePath: undefined,
        },
      });
    });
  });

  describe('checkOut', () => {
    it('should create a checkout record', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 1,
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
        imagePath: 'uploads/checkout-123.jpg',
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkOut(1, 'uploads/checkout-123.jpg')

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId: 1,
          type: AttendanceType.CHECKOUT,
          imagePath: 'uploads/checkout-123.jpg',
        },
      });
    });
  });

  describe('getAttendance', () => {
    it('should return attendance records for an employee', async () => {
      const mockRecords = [
        {
          id: 1,
          employeeId: 1,
          type: AttendanceType.CHECKIN,
          timestamp: new Date(),
        },
        {
          id: 2,
          employeeId: 1,
          type: AttendanceType.CHECKOUT,
          timestamp: new Date(),
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords)

      const result = await service.getAttendance(1)

      expect(result).toEqual(mockRecords)
      expect(mockPrismaService.attendance.findMany).toHaveBeenCalledWith({
        where: { employeeId: 1 },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('getLatestAttendance', () => {
    it('should return latest attendance for an employee', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 1,
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
      };

      mockPrismaService.attendance.findFirstOrThrow.mockResolvedValue(mockRecord)

      const result = await service.getLatestAttendance(1)

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.findFirstOrThrow).toHaveBeenCalledWith({
        where: { employeeId: 1 },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should throw if no attendance found', async () => {
      mockPrismaService.attendance.findFirstOrThrow.mockRejectedValue(new Error('not found'))

      await expect(service.getLatestAttendance(999)).rejects.toThrow()
    });
  });

  describe('getAllAttendance', () => {
    it('should return paginated records', async () => {
      const mockRecords = [
        {
          id: 1,
          employeeId: 1,
          type: AttendanceType.CHECKIN,
          timestamp: new Date(),
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords);
      mockPrismaService.attendance.count.mockResolvedValue(1);

      const result = await service.getAllAttendance(1, 10)

      expect(result).toEqual({
        data: mockRecords,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should calculate total pages correctly', async () => {
      mockPrismaService.attendance.findMany.mockResolvedValue([]);
      mockPrismaService.attendance.count.mockResolvedValue(25);

      const result = await service.getAllAttendance(1, 10);

      expect(result.totalPages).toBe(3)  // 25 records / 10 per page = 3 pages
    });
  });
});
