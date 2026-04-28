ALTER TABLE "JeepAssignment" ADD COLUMN "jobStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "JeepAssignment" ADD COLUMN "respondedAt" TIMESTAMP(3);

ALTER TABLE "GuideAssignment" ADD COLUMN "jobStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "GuideAssignment" ADD COLUMN "respondedAt" TIMESTAMP(3);

CREATE INDEX "JeepAssignment_vendorId_jobStatus_idx" ON "JeepAssignment"("vendorId", "jobStatus");
CREATE INDEX "GuideAssignment_vendorId_jobStatus_idx" ON "GuideAssignment"("vendorId", "jobStatus");
