-- Add customer contact fields and special requests to PrivateSafari
ALTER TABLE "PrivateSafari" ADD COLUMN "customerName"    TEXT;
ALTER TABLE "PrivateSafari" ADD COLUMN "customerPhone"   TEXT;
ALTER TABLE "PrivateSafari" ADD COLUMN "customerEmail"   TEXT;
ALTER TABLE "PrivateSafari" ADD COLUMN "specialRequests" TEXT;
