/*
  Warnings:

  - A unique constraint covering the columns `[classId,registerNumber]` on the table `ClassMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClassMember_classId_registerNumber_key" ON "ClassMember"("classId", "registerNumber");
