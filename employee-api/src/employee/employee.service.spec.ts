import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeLevel } from '@prisma/client';
import {
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { NotFoundError } from 'rxjs';

const mockPrismaService = {
  employee: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new employee with hashed password', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Doe',
        email: 'john@doe.com',
        password: 'hashedpassword',
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.create.mockResolvedValue(mockEmployee);

      const result = await service.register(
        'John Doe',
        'john@doe.com',
        'password123',
      );

      expect(result).not.toHaveProperty('password');
      expect(mockPrismaService.employee.create).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John',
        email: 'john@doe.com',
        password: 'hashedpassword',
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.create.mockResolvedValue(mockEmployee);

      await service.register('John', 'john@doe.com', 'plainpassword');

      const callArgs = mockPrismaService.employee.create.mock.calls[0][0]
      expect(callArgs.data.password).not.toBe('plainpassword')
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockEmployee = {
        id: '1',
        name: 'John',
        email: 'john@doe.com',
        password: hashedPassword,
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.findFirstOrThrow.mockResolvedValue(
        mockEmployee,
      );

      const result = await service.login('john@doe.com', 'password123');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('john@doe.com');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockEmployee = {
        id: '1',
        name: 'John',
        email: 'john@doe.com',
        password: hashedPassword,
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.findFirstOrThrow.mockResolvedValue(
        mockEmployee,
      );

      await expect(
        service.login('john@doe.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if employee not found', async () => {
      mockPrismaService.employee.findFirstOrThrow.mockRejectedValue({
        code: 'P2025',
      });

      await expect(
        service.login('notfound@doe.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('should return all active employees without password', async () => {
      const mockEmployees = [
        {
          id: '1',
          name: 'John',
          email: 'john@doe.com',
          level: EmployeeLevel.EMPLOYEE,
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@doe.com',
          level: EmployeeLevel.ADMIN_HRD,
        },
      ];

      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await service.findAll();

      expect(result).toEqual(mockEmployees);
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update employee successfully', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Updated',
        email: 'john@doe.com',
        password: 'hashed',
        level: EmployeeLevel.ADMIN_HRD,
        deletedAt: null,
      };

      mockPrismaService.employee.findFirst.mockResolvedValue(null);
      mockPrismaService.employee.update.mockResolvedValue(mockEmployee);

      const result = await service.update(1, { name: 'John Updated' } as any);

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('John Updated');
    });

    it('should throw UnprocessableEntityException if email already exists', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({
        id: '2',
        email: 'taken@doe.com',
      });

      await expect(
        service.update(1, { email: 'taken@doe.com' } as any),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw NotFoundException if employee not found', async () => {
      const prismaError = new Error('not found') as any
      prismaError.code = 'P2025'
      prismaError.name = 'PrismaClientKnownRequestError'

      mockPrismaService.employee.findFirst.mockResolvedValue(null);
      mockPrismaService.employee.update.mockRejectedValue(prismaError);

      await expect(
        service.update(999, { name: 'Ghost' } as any),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete an employee', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John',
        deletedAt: new Date(),
      };

      mockPrismaService.employee.update.mockResolvedValue(mockEmployee);

      const result = await service.remove(1)

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) }
      });
    });
  });
});
