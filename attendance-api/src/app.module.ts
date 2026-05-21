import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AttendanceModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
