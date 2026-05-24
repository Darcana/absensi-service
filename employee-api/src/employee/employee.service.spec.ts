import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmployeeLevel } from '@prisma/client';
import {
  UnauthorizedException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

const mockPrismaService = {
  employee: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token')
};

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => {
    jest.clearAllMocks()
  });

  describe('register', () => {
    it('should register a new employee and return without password', async () => {
      const mockEmployee = {
        id: 'uuid-123',
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

      expect(result).not.toHaveProperty('password')
      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('john@doe.com')
    })

    it('should hash the password before saving', async () => {
      const mockEmployee = {
        id: 'uuid-123',
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

    it('should set default level to EMPLOYEE', async () => {
      const mockEmployee = {
        id: 'uuid-123',
        name: 'John',
        email: 'john@doe.com',
        password: 'hashedpassword',
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.create.mockResolvedValue(mockEmployee);

      await service.register('John', 'john@doe.com', 'password123');

      const callArgs = mockPrismaService.employee.create.mock.calls[0][0]
      expect(callArgs.data.level).toBe(EmployeeLevel.EMPLOYEE)
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockEmployee = {
        id: 'uuid-123',
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

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('employee')
      expect(result.token).toBe('mock-jwt-token')
      expect(result.employee).not.toHaveProperty('password')
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockEmployee = {
        id: 'uuid-123',
        name: 'John',
        email: 'john@doe.com',
        password: hashedPassword,
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.findFirstOrThrow.mockResolvedValue(mockEmployee)

      await expect(service.login('john@doe.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if employee not found', async () => {
      mockPrismaService.employee.findFirstOrThrow.mockRejectedValue({ code: 'P2025' })

      await expect(service.login('notfound@doe.com', 'password123')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should sign jwt with correct payload', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockEmployee = {
        id: 'uuid-123',
        name: 'John',
        email: 'john@doe.com',
        password: hashedPassword,
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.findFirstOrThrow.mockResolvedValue(
        mockEmployee,
      );

      await service.login('john@doe.com', 'password123');

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-123',
        email: 'john@doe.com',
        level: EmployeeLevel.EMPLOYEE,
        name: 'John',
      });
    });
  });

  describe('findAll', () => {
    it('should return all active employees without password', async () => {
      const mockEmployees = [
        {
          id: 'uuid-1',
          name: 'Alice',
          email: 'alice@doe.com',
          level: EmployeeLevel.EMPLOYEE,
        },
        {
          id: 'uuid-2',
          name: 'Bob',
          email: 'bob@doe.com',
          level: EmployeeLevel.ADMIN_HRD,
        },
      ];

      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await service.findAll();

      expect(result).toEqual(mockEmployees)
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: { id: true, name: true, email: true, level: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update employee successfully', async () => {
      const mockEmployee = {
        id: 'uuid-123',
        name: 'John Updated',
        email: 'john@doe.com',
        password: 'hashed',
        level: EmployeeLevel.ADMIN_HRD,
        deletedAt: null,
      };

      mockPrismaService.employee.findFirst.mockResolvedValue(null);
      mockPrismaService.employee.update.mockResolvedValue(mockEmployee);

      const result = await service.update('uuid-123', {
        name: 'John Updated',
      } as any);

      expect(result).not.toHaveProperty('password')
      expect(result.name).toBe('John Updated')
    })

    it('should throw UnprocessableEntityException if email already exists', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({
        id: 'uuid-456',
        email: 'taken@doe.com',
      });

      await expect(service.update('uuid-123', { email: 'taken@doe.com' } as any)
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      const prismaError = new PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: '6.6.0',
      });

      mockPrismaService.employee.update.mockRejectedValue(prismaError);

      await expect(service.update('uuid-999', { name: 'Ghost' } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should not check email if email is not in dto', async () => {
      const mockEmployee = {
        id: 'uuid-123',
        name: 'John Updated',
        email: 'john@doe.com',
        password: 'hashed',
        level: EmployeeLevel.EMPLOYEE,
        deletedAt: null,
      };

      mockPrismaService.employee.update.mockResolvedValue(mockEmployee);

      await service.update('uuid-123', { name: 'John Updated' } as any);

      expect(mockPrismaService.employee.findFirst).not.toHaveBeenCalled()
    });
  });

  describe('remove', () => {
    it('should soft delete an employee', async () => {
      const mockEmployee = {
        id: 'uuid-123',
        name: 'John',
        deletedAt: new Date(),
      };

      mockPrismaService.employee.update.mockResolvedValue(mockEmployee);

      await service.remove('uuid-123');

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { deletedAt: expect.any(Date) }
      });
    });
  });

  describe('findEmployee', () => {
    it('should return employee without password', async () => {
      const mockEmployee = {
        name: 'John',
        email: 'john@doe.com',
        level: EmployeeLevel.EMPLOYEE,
      };

      mockPrismaService.employee.findFirstOrThrow.mockResolvedValue(
        mockEmployee,
      );

      const result = await service.findEmployee('uuid-123');

      expect(result).toEqual(mockEmployee)
      expect(mockPrismaService.employee.findFirstOrThrow).toHaveBeenCalledWith({
        where: { deletedAt: null, id: 'uuid-123' },
        select: { name: true, email: true, level: true },
      });
    });

    it('should throw if employee not found', async () => {
      mockPrismaService.employee.findFirstOrThrow.mockRejectedValue(new Error('not found'))

      await expect(service.findEmployee('uuid-999')).rejects.toThrow()
    });
  });
});
