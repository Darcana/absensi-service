# Agents Guide - Absensi Service

## Project Structure
This is a microservices backend built with NestJS and Prisma.

## Services

### Attendance Service (port 3000)
- Handles check in / check out
- Stores attendance records with photo uploads
- Photos saved to `uploads/` folder

### Employee Service (port 3001)
- Handles employee registration, login, and management
- Passwords hashed with bcrypt
- Soft delete using `deletedAt` field

## Tech Stack
- NestJS
- Prisma ORM (v6.6.0) with MySQL
- class-validator for DTO validation
- bcrypt for password hashing
- multer for file uploads
- Swagger at `/api`

## Commands
```bash
# Run in development
npm run start:dev

# Run tests
npm run test

# Database migration
npx prisma migrate dev --name <migration_name>

# Generate Prisma client
npx prisma generate
```

## Conventions
- Use DTOs for all request bodies
- Always strip password from responses
- Use `deletedAt` for soft deletes — never hard delete employees
- All controllers use `ParseIntPipe` for integer params except employee `id` which is UUID string
- Catch Prisma `P2025` errors and throw `NotFoundException`
- Catch Prisma `P2002` errors and throw `UnprocessableEntityException`
- Use `ValidationPipe` with `transform: true` and `whitelist: true`

## Database
- attendance-service → MySQL database: `attendance`
- employee-service → MySQL database: `employee`
- Both use separate databases (microservices pattern)

## Environment Variables
```env
DATABASE_URL="mysql://root:password@localhost:3306/dbname"
```

## Notes
- `employeeId` in attendance is an Int referencing employee UUID from employee-service
- No foreign key between services — microservices pattern
- File uploads max size: 100MB, images only