import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateEmployeeDto } from './dto/update.dto';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.employeeService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.employeeService.login(dto.email, dto.password);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.update(id, dto);
  }

  @UseGuards(JwtGuard)
  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  findEmployee(@Param('id') id: string) {
    return this.employeeService.findEmployee(id);
  }
}
