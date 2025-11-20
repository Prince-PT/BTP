/*
  Warnings:

  - The values [REQUESTED] on the enum `MemberStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [OPEN] on the enum `RideStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `capacity` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `isShared` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `seatsTaken` on the `rides` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `rides` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MemberStatus_new" AS ENUM ('CONFIRMED', 'PICKED_UP', 'DROPPED_OFF', 'CANCELLED');
ALTER TABLE "ride_members" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ride_members" ALTER COLUMN "status" TYPE "MemberStatus_new" USING ("status"::text::"MemberStatus_new");
ALTER TYPE "MemberStatus" RENAME TO "MemberStatus_old";
ALTER TYPE "MemberStatus_new" RENAME TO "MemberStatus";
DROP TYPE "MemberStatus_old";
ALTER TABLE "ride_members" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RideStatus_new" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "rides" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rides" ALTER COLUMN "status" TYPE "RideStatus_new" USING ("status"::text::"RideStatus_new");
ALTER TYPE "RideStatus" RENAME TO "RideStatus_old";
ALTER TYPE "RideStatus_new" RENAME TO "RideStatus";
DROP TYPE "RideStatus_old";
ALTER TABLE "rides" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "ride_members" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "rides" DROP COLUMN "capacity",
DROP COLUMN "isShared",
DROP COLUMN "seatsTaken",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "seatsNeeded" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "rides_createdBy_status_idx" ON "rides"("createdBy", "status");
