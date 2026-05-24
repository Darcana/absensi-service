import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceType } from '@prisma/client';

const mockAttendanceService = {
  checkIn: jest.fn(),
  checkOut: jest.fn(),
  getAttendance: jest.fn(),
  getLatestAttendance: jest.fn(),
  getAllAttendance: jest.fn(),
}

describe('AttendanceController', () => {
  let controller: AttendanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
  });

  afterEach(() => {
    jest.clearAllMocks()
  });

  describe('checkIn', () => {
    it('should check in successfully', async () => {
      const mockRecord = {
        id: 1,
        employeeId: 1,
        type: AttendanceType.CHECKIN,
        timestamp: new Date(),
        imagePath: 'uploads/checkin-123.jpg',
      };

      mockAttendanceService.checkIn.mockResolvedValue(mockRecord);

      const dto = { employeeId: 1 };
      const photo = { path: 'uploads/checkin-123.jpg' } as Express.Multer.File;

      const result = await controller.checkIn(dto as any, photo);

      expect(result).toEqual(mockRecord)
      expect(mockAttendanceService.checkIn).toHaveBeenCalledWith(1, 'uploads/checkin-123.jpg')
    });

    it('should check in without photo', async () => {
      const mockRecord = {
        id: 1,
        employeeId: 1,
        type: AttendanceType.CHECKIN,
        timestamp: new Date(),
        imagePath: null,
      };

      mockAttendanceService.checkIn.mockResolvedValue(mockRecord);

      const dto = { employeeId: 1 };
      const result = await controller.checkIn(dto as any, undefined as any)

      expect(result).toEqual(mockRecord);
      expect(mockAttendanceService.checkIn).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('checkOut', () => {
    it('should check out successfully', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 1,
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
        imagePath: 'uploads/checkout-123.jpg',
      };

      mockAttendanceService.checkOut.mockResolvedValue(mockRecord);

      const dto = { employeeId: 1 }
      const photo = { path: 'uploads/checkout-123.jpg' } as Express.Multer.File;

      const result = await controller.checkOut(dto as any, photo)

      expect(result).toEqual(mockRecord)
      expect(mockAttendanceService.checkOut).toHaveBeenCalledWith(1, 'uploads/checkout-123.jpg')
    })
  })

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

      mockAttendanceService.getAttendance.mockResolvedValue(mockRecords);

      const result = await controller.getAttendance(1)

      expect(result).toEqual(mockRecords)
      expect(mockAttendanceService.getAttendance).toHaveBeenCalledWith(1)
    })
  })

  describe('getLatestAttendance', () => {
    it('should return latest attendance for an employee', async () => {
      const mockRecord = {
        id: 2,
        employeeId: 1,
        type: AttendanceType.CHECKOUT,
        timestamp: new Date(),
      };

      mockAttendanceService.getLatestAttendance.mockResolvedValue(mockRecord);

      const result = await controller.getLatestAttendance(1)

      expect(result).toEqual(mockRecord)
      expect(mockAttendanceService.getLatestAttendance).toHaveBeenCalledWith(1)
    });
  });

  describe('getAllAttendance', () => {
    it('should return paginated attendance records', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            employeeId: 1,
            type: AttendanceType.CHECKIN,
            timestamp: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAttendanceService.getAllAttendance.mockResolvedValue(mockResult);

      const result = await controller.getAllAttendance(1, 10);

      expect(result).toEqual(mockResult)
      expect(mockAttendanceService.getAllAttendance).toHaveBeenCalledWith(1, 10)
    });
  });
});
