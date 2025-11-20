-- AlterTable
ALTER TABLE "ride_members" ADD COLUMN     "dropOrder" INTEGER,
ADD COLUMN     "originalPrice" DOUBLE PRECISION,
ADD COLUMN     "sharedDistanceKm" DOUBLE PRECISION,
ADD COLUMN     "soloDistanceKm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "rides" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seatsTaken" INTEGER NOT NULL DEFAULT 0;
