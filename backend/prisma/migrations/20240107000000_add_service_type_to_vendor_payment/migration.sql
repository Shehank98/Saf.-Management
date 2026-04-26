-- Add serviceType to VendorPayment for tracking which service (Jeep, Guide, Meal, etc.)
ALTER TABLE "VendorPayment" ADD COLUMN "serviceType" TEXT;
