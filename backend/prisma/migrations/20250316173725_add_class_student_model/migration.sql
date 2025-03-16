/*
  Warnings:

  - You are about to drop the column `reg` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registerNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registerNumber` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_reg_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "reg",
ADD COLUMN     "isIncharge" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registerNumber" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Department";

-- CreateTable
CREATE TABLE "ClassMember" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "registerNumber" INTEGER NOT NULL,

    CONSTRAINT "ClassMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccess" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "DocumentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_registerNumber_key" ON "Student"("registerNumber");

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_registerNumber_fkey" FOREIGN KEY ("registerNumber") REFERENCES "Student"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
