import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeLevel } from '@prisma/client';

const mockEmployeeService = {
  register: jest.fn(),
  login: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}

describe('EmployeeController', () => {
  let controller: EmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new employee', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Doe',
        email: 'john@doe.com',
        level: EmployeeLevel.EMPLOYEE,
      };

      mockEmployeeService.register.mockResolvedValue(mockEmployee);

      const dto = {
        name: 'John Doe',
        email: 'john@doe.com',
        password: 'password123',
      };
      const result = await controller.register(dto as any);

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeService.register).toHaveBeenCalledWith(
        dto.name,
        dto.email,
        dto.password,
      );
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Doe',
        email: 'john@doe.com',
        level: EmployeeLevel.EMPLOYEE,
      };

      mockEmployeeService.login.mockResolvedValue(mockEmployee);

      const dto = { email: 'john@doe.com', password: 'password123' };
      const result = await controller.login(dto as any)

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeService.login).toHaveBeenCalledWith(dto.email, dto.password)
    });
  });

  describe('findAll', () => {
    it('should return all employees', async () => {
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

      mockEmployeeService.findAll.mockResolvedValue(mockEmployees);

      const result = await controller.findAll();

      expect(result).toEqual(mockEmployees);
      expect(mockEmployeeService.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const mockEmployee = {
        id: '1',
        name: 'John Updated',
        email: 'john@doe.com',
        level: EmployeeLevel.ADMIN_HRD,
      };

      mockEmployeeService.update.mockResolvedValue(mockEmployee);

      const dto = { name: 'John Updated', level: 'ADMIN_HRD' };
      const result = await controller.update(1, dto as any);

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should soft delete an employee', async () => {
      mockEmployeeService.remove.mockResolvedValue({ id: '1', deletedAt: new Date() })

      const result = await controller.remove(1)

      expect(mockEmployeeService.remove).toHaveBeenCalledWith(1);
    });
  });
});
