/*
  Warnings:

  - You are about to drop the `Absentee` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Absentee" DROP CONSTRAINT "Absentee_classId_fkey";

-- DropForeignKey
ALTER TABLE "Absentee" DROP CONSTRAINT "Absentee_studentId_fkey";

-- DropTable
DROP TABLE "Absentee";

-- CreateTable
CREATE TABLE "AttendanceMode" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isPresent" BOOLEAN NOT NULL,

    CONSTRAINT "AttendanceMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "attendanceModeId" INTEGER NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_attendanceModeId_key" ON "Attendance"("studentId", "attendanceModeId");

-- AddForeignKey
ALTER TABLE "AttendanceMode" ADD CONSTRAINT "AttendanceMode_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_attendanceModeId_fkey" FOREIGN KEY ("attendanceModeId") REFERENCES "AttendanceMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
