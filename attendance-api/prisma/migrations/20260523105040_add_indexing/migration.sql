-- CreateIndex
CREATE INDEX `Attendance_employeeId_idx` ON `Attendance`(`employeeId`);

-- CreateIndex
CREATE INDEX `Attendance_timestamp_idx` ON `Attendance`(`timestamp`);

-- CreateIndex
CREATE INDEX `Attendance_employeeId_timestamp_idx` ON `Attendance`(`employeeId`, `timestamp`);
