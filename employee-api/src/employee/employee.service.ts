import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { EmployeeLevel } from '@prisma/client';
import { UpdateEmployeeDto } from './dto/update.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async register(
    employeeName: string,
    employeeEmail: string,
    employeePassword: string,
  ) {
    const hashedPassword = await bcrypt.hash(employeePassword, 10);

    const employee = await this.prisma.employee.create({
      data: {
        name: employeeName,
        email: employeeEmail,
        password: hashedPassword,
        level: EmployeeLevel.EMPLOYEE,
      },
    });

    const { password: _, ...result } = employee
    return result;
  }

  async login(email: string, password: string) {
    try {
      const employee = await this.prisma.employee.findFirstOrThrow({
        where: { email, deletedAt: null },
      });

      const isMatch = await bcrypt.compare(password, employee.password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      const { password: _, ...result } = employee
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error?.code === 'P2025') {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    if (dto.email) {
      const existingEmail = await this.prisma.employee.findFirst({
        where: {
          email: dto.email,
        },
      });

      if (existingEmail) {
        throw new UnprocessableEntityException('Email already exists');
      }
    }

    try {
      const employee = await this.prisma.employee.update({
        where: { id, deletedAt: null },
        data: dto,
      });
      const { password: _, ...result } = employee
      return result;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Employee with id ${id} not found`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.employee.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async remove(id: number) {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findEmployee(id: number) {
    return this.prisma.employee.findFirstOrThrow({
      where: { deletedAt: null, id },
      select: {
        name: true,
        email: true,
        level: true,
      },
    });
  }
}
