-- CreateTable: Location
CREATE TABLE "Location" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");
CREATE INDEX "Location_isActive_idx" ON "Location"("isActive");

-- CreateTable: SafariOwnerLocation
CREATE TABLE "SafariOwnerLocation" (
    "ownerId"    TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    CONSTRAINT "SafariOwnerLocation_pkey" PRIMARY KEY ("ownerId", "locationId")
);

ALTER TABLE "SafariOwnerLocation"
    ADD CONSTRAINT "SafariOwnerLocation_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "SafariOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SafariOwnerLocation"
    ADD CONSTRAINT "SafariOwnerLocation_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: VendorLocation
CREATE TABLE "VendorLocation" (
    "vendorId"   TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    CONSTRAINT "VendorLocation_pkey" PRIMARY KEY ("vendorId", "locationId")
);

ALTER TABLE "VendorLocation"
    ADD CONSTRAINT "VendorLocation_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorLocation"
    ADD CONSTRAINT "VendorLocation_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default Sri Lanka safari locations
INSERT INTO "Location" ("id", "name", "description", "isActive", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::TEXT, 'Yala',       'Yala National Park — South-east Sri Lanka',         true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Kumana',     'Kumana National Park — Eastern Sri Lanka',           true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Udawalawe',  'Udawalawe National Park — Central Sri Lanka',        true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Wilpattu',   'Wilpattu National Park — North-west Sri Lanka',      true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Minneriya',  'Minneriya National Park — North-central Sri Lanka',  true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Wasgamuwa',  'Wasgamuwa National Park — Central Sri Lanka',        true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Bundala',    'Bundala National Park — Southern Sri Lanka',         true, NOW(), NOW()),
    (gen_random_uuid()::TEXT, 'Horton Plains', 'Horton Plains — Central highlands',               true, NOW(), NOW());
