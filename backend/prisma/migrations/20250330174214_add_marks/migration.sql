-- CreateEnum
CREATE TYPE "Exam" AS ENUM ('IA1', 'IA2');

-- CreateTable
CREATE TABLE "Mark" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "registerNumber" TEXT NOT NULL,
    "exam" "Exam" NOT NULL,
    "mark" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mark_classId_registerNumber_exam_key" ON "Mark"("classId", "registerNumber", "exam");

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_registerNumber_fkey" FOREIGN KEY ("registerNumber") REFERENCES "Student"("registerNumber") ON DELETE CASCADE ON UPDATE CASCADE;
