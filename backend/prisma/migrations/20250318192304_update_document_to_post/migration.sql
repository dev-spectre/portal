/*
  Warnings:

  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentAccess` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_attendanceModeId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceMode" DROP CONSTRAINT "AttendanceMode_classId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_inchargeId_fkey";

-- DropForeignKey
ALTER TABLE "ClassMember" DROP CONSTRAINT "ClassMember_classId_fkey";

-- DropForeignKey
ALTER TABLE "ClassMember" DROP CONSTRAINT "ClassMember_registerNumber_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_authorId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentAccess" DROP CONSTRAINT "DocumentAccess_classId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentAccess" DROP CONSTRAINT "DocumentAccess_documentId_fkey";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "DocumentAccess";

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "documentSource" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAccess" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "PostAccess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_inchargeId_fkey" FOREIGN KEY ("inchargeId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_registerNumber_fkey" FOREIGN KEY ("registerNumber") REFERENCES "Student"("registerNumber") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceMode" ADD CONSTRAINT "AttendanceMode_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_attendanceModeId_fkey" FOREIGN KEY ("attendanceModeId") REFERENCES "AttendanceMode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAccess" ADD CONSTRAINT "PostAccess_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAccess" ADD CONSTRAINT "PostAccess_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
