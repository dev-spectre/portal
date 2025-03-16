-- DropForeignKey
ALTER TABLE "ClassMember" DROP CONSTRAINT "ClassMember_registerNumber_fkey";

-- AlterTable
ALTER TABLE "ClassMember" ALTER COLUMN "registerNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "registerNumber" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_registerNumber_fkey" FOREIGN KEY ("registerNumber") REFERENCES "Student"("registerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
