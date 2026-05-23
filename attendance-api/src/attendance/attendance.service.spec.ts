import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';

const mockPrismaService = {
  attendance: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirstOrThrow: jest.fn(),
  }
}

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
    it('should create a checkin record with photo', async () => {
      const mockRecord = {
        id: 1,
        employeeId: 'uuid-123',
        type: AttendanceType.CHECKIN,
        timestamp: new Date(),
        imagePath: 'uploads/checkin-123.jpg',
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkIn(
        'uuid-123',
        'uploads/checkin-123.jpg',
      );

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKIN,
          imagePath: 'uploads/checkin-123.jpg',
        },
      });
    })

    it('should create a checkin record without photo', async () => {
      const mockRecord = {
        id: 1,
        employeeId: 'uuid-123',
        type: AttendanceType.CHECKIN,
        timestamp: new Date(),
        imagePath: undefined,
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkIn('uuid-123', undefined);

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKIN,
          imagePath: undefined,
        },
      });
    });
  });

  describe('checkOut', () => {
    it('should create a checkout record with photo', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 'uuid-123',
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
        imagePath: 'uploads/checkout-123.jpg',
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkOut(
        'uuid-123',
        'uploads/checkout-123.jpg',
      );

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKOUT,
          imagePath: 'uploads/checkout-123.jpg',
        },
      });
    });

    it('should create a checkout record without photo', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 'uuid-123',
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
        imagePath: undefined,
      };

      mockPrismaService.attendance.create.mockResolvedValue(mockRecord);

      const result = await service.checkOut('uuid-123', undefined);

      expect(result).toEqual(mockRecord)
    });
  });

  describe('getAttendance', () => {
    it('should return attendance records for an employee', async () => {
      const mockRecords = [
        {
          id: 1,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKIN,
          timestamp: new Date(),
        },
        {
          id: 2,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKOUT,
          timestamp: new Date(),
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAttendance('uuid-123');

      expect(result).toEqual(mockRecords)
      expect(mockPrismaService.attendance.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'uuid-123' },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should return empty array if no records found', async () => {
      mockPrismaService.attendance.findMany.mockResolvedValue([]);

      const result = await service.getAttendance('uuid-123');

      expect(result).toEqual([])
    });
  });

  describe('getLatestAttendance', () => {
    it('should return latest attendance for an employee', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 'uuid-123',
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
      };

      mockPrismaService.attendance.findFirstOrThrow.mockResolvedValue(
        mockRecord,
      );

      const result = await service.getLatestAttendance('uuid-123');

      expect(result).toEqual(mockRecord)
      expect(mockPrismaService.attendance.findFirstOrThrow).toHaveBeenCalledWith({
        where: { employeeId: 'uuid-123' },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should throw if no attendance found', async () => {
      mockPrismaService.attendance.findFirstOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.getLatestAttendance('uuid-999')).rejects.toThrow()
    });
  });

  describe('getAllAttendance', () => {
    it('should return grouped and paginated records', async () => {
      const now = new Date('2026-05-22T08:00:00.000Z');
      const later = new Date('2026-05-22T17:00:00.000Z');

      const mockRecords = [
        {
          id: 1,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKIN,
          timestamp: now,
          imagePath: null,
        },
        {
          id: 2,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKOUT,
          timestamp: later,
          imagePath: null,
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAllAttendance(1, 10);

      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.totalPages).toBe(1)
      expect(result.data[0].employeeId).toBe('uuid-123')
      expect(result.data[0].checkIn).toEqual(mockRecords[0])
      expect(result.data[0].checkOut).toEqual(mockRecords[1])
    })

    it('should keep earliest checkin per day', async () => {
      const firstCheckIn = new Date('2026-05-22T07:00:00.000Z');
      const secondCheckIn = new Date('2026-05-22T09:00:00.000Z');

      const mockRecords = [
        {
          id: 1,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKIN,
          timestamp: firstCheckIn,
          imagePath: null,
        },
        {
          id: 2,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKIN,
          timestamp: secondCheckIn,
          imagePath: null,
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAllAttendance(1, 10);

      expect(result.data[0].checkIn.timestamp).toEqual(firstCheckIn)
    });

    it('should keep latest checkout per day', async () => {
      const firstCheckOut = new Date('2026-05-22T16:00:00.000Z');
      const lastCheckOut = new Date('2026-05-22T18:00:00.000Z');

      const mockRecords = [
        {
          id: 1,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKOUT,
          timestamp: firstCheckOut,
          imagePath: null,
        },
        {
          id: 2,
          employeeId: 'uuid-123',
          type: AttendanceType.CHECKOUT,
          timestamp: lastCheckOut,
          imagePath: null,
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAllAttendance(1, 10);

      expect(result.data[0].checkOut.timestamp).toEqual(lastCheckOut)
    });

    it('should paginate correctly', async () => {
      const mockRecords = [
        {
          id: 1,
          employeeId: 'uuid-1',
          type: AttendanceType.CHECKIN,
          timestamp: new Date('2026-05-21T08:00:00.000Z'),
          imagePath: null,
        },
        {
          id: 2,
          employeeId: 'uuid-2',
          type: AttendanceType.CHECKIN,
          timestamp: new Date('2026-05-22T08:00:00.000Z'),
          imagePath: null,
        },
        {
          id: 3,
          employeeId: 'uuid-3',
          type: AttendanceType.CHECKIN,
          timestamp: new Date('2026-05-23T08:00:00.000Z'),
          imagePath: null,
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAllAttendance(1, 2);

      expect(result.total).toBe(3)
      expect(result.totalPages).toBe(2)
      expect(result.data.length).toBe(2)
    });

    it('should return empty data when no records', async () => {
      mockPrismaService.attendance.findMany.mockResolvedValue([]);

      const result = await service.getAllAttendance(1, 10);

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    });
  });
});
