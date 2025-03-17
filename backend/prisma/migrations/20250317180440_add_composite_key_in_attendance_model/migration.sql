/*
  Warnings:

  - A unique constraint covering the columns `[date,isPresent]` on the table `AttendanceMode` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AttendanceMode_date_isPresent_key" ON "AttendanceMode"("date", "isPresent");
