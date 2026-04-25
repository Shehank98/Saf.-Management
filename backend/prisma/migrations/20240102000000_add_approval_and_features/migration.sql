-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Feature" AS ENUM ('SHARED_TRIPS', 'PRIVATE_SAFARI', 'BOOKING_MANAGEMENT', 'VENDOR_LISTINGS', 'REPORTS_ANALYTICS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN "approvalNote" TEXT;
ALTER TABLE "User" ADD COLUMN "approvedAt" TIMESTAMP(3);

-- Auto-approve existing SUPER_ADMIN users so they keep access
UPDATE "User" SET "approvalStatus" = 'APPROVED' WHERE "role" = 'SUPER_ADMIN';

-- Auto-approve existing CUSTOMER users (customers don't need approval)
UPDATE "User" SET "approvalStatus" = 'APPROVED' WHERE "role" = 'CUSTOMER';

-- CreateTable
CREATE TABLE "UserFeature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "Feature" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFeature_userId_feature_key" ON "UserFeature"("userId", "feature");

-- CreateIndex
CREATE INDEX "UserFeature_userId_idx" ON "UserFeature"("userId");

-- CreateIndex
CREATE INDEX "User_approvalStatus_role_idx" ON "User"("approvalStatus", "role");

-- AddForeignKey
ALTER TABLE "UserFeature" ADD CONSTRAINT "UserFeature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
