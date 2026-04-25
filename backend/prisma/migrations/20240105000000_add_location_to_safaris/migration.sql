-- Add locationId to PrivateSafari
ALTER TABLE "PrivateSafari" ADD COLUMN "locationId" TEXT;
ALTER TABLE "PrivateSafari" ADD CONSTRAINT "PrivateSafari_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "PrivateSafari_locationId_idx" ON "PrivateSafari"("locationId");

-- Add locationId to SharedJeep
ALTER TABLE "SharedJeep" ADD COLUMN "locationId" TEXT;
ALTER TABLE "SharedJeep" ADD CONSTRAINT "SharedJeep_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "SharedJeep_locationId_idx" ON "SharedJeep"("locationId");
