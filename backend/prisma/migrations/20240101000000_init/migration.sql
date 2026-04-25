-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SAFARI_OWNER', 'VENDOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('JEEP_PROVIDER', 'GUIDE', 'RESTAURANT', 'ACCOMMODATION', 'CAMERA_RENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrivateSafariStatus" AS ENUM ('INQUIRY', 'DEPOSIT_PENDING', 'DEPOSIT_PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SharedJeepStatus" AS ENUM ('OPEN', 'PENDING_PAYMENT', 'CONFIRMED', 'FULLY_BOOKED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'AUTO_CANCELLED', 'RELEASED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorType" "VendorType" NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT,
    "taxId" TEXT,
    "bankDetails" JSONB,
    "subscriptionStatus" "VendorStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "monthlyFee" DECIMAL(65,30) NOT NULL DEFAULT 1000.00,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "blockedDates" TIMESTAMP(3)[],
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafariOwner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "taxId" TEXT,
    "subscriptionStatus" "VendorStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "monthlyFee" DECIMAL(65,30) NOT NULL DEFAULT 2500.00,
    "subscriptionMonths" INTEGER NOT NULL DEFAULT 1,
    "depositPercentage" DECIMAL(65,30) NOT NULL DEFAULT 30.00,
    "sharedSafariCommission" DECIMAL(65,30) NOT NULL DEFAULT 15.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SafariOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateSafari" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "safariDate" TIMESTAMP(3) NOT NULL,
    "safariType" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "status" "PrivateSafariStatus" NOT NULL DEFAULT 'INQUIRY',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "depositAmount" DECIMAL(65,30) NOT NULL,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "finalPaid" BOOLEAN NOT NULL DEFAULT false,
    "guideId" TEXT,
    "jeepId" TEXT,
    "restaurantId" TEXT,
    "accommodationId" TEXT,
    "vendorCosts" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrivateSafari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateSafariBooking" (
    "id" TEXT NOT NULL,
    "safariId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrivateSafariBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedJeep" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "safariDate" TIMESTAMP(3) NOT NULL,
    "safariType" TEXT NOT NULL,
    "status" "SharedJeepStatus" NOT NULL DEFAULT 'OPEN',
    "totalSeats" INTEGER NOT NULL DEFAULT 6,
    "reservedSeats" INTEGER NOT NULL DEFAULT 0,
    "paidSeats" INTEGER NOT NULL DEFAULT 0,
    "pricePerSeat" DECIMAL(65,30) NOT NULL,
    "paymentDeadline" TIMESTAMP(3),
    "safariDeadline" TIMESTAMP(3) NOT NULL,
    "assignedGuideId" TEXT,
    "assignedJeepId" TEXT,
    "bookingLinkToken" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reviewRequestSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SharedJeep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedSafariBooking" (
    "id" TEXT NOT NULL,
    "jeepId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "rowPosition" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
    "basePrice" DECIMAL(65,30) NOT NULL,
    "mealPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cameraRental" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paymentLinkSent" TIMESTAMP(3),
    "paymentDeadline" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "pickupLat" DECIMAL(10,8) NOT NULL,
    "pickupLng" DECIMAL(11,8) NOT NULL,
    "pickupTime" TEXT NOT NULL,
    "mealIncluded" BOOLEAN NOT NULL DEFAULT false,
    "mealTypes" TEXT[],
    "dietaryReqs" TEXT[],
    "allergies" TEXT,
    "specialNotes" TEXT,
    "cameraNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SharedSafariBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JeepAssignment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "privateSafariId" TEXT,
    "sharedJeepId" TEXT,
    "jeepNumber" TEXT NOT NULL,
    "rentalFee" DECIMAL(65,30) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JeepAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideAssignment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "privateSafariId" TEXT,
    "sharedJeepId" TEXT,
    "guideFee" DECIMAL(65,30) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GuideAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealOrder" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "privateSafariId" TEXT,
    "sharedJeepId" TEXT,
    "numberOfMeals" INTEGER NOT NULL,
    "mealTypes" TEXT[],
    "dietaryReqs" JSONB NOT NULL,
    "specialNotes" TEXT,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MealOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "relatedSafariId" TEXT,
    "paymentProof" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "monthsCovered" INTEGER NOT NULL DEFAULT 1,
    "paymentProof" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "monthsCovered" INTEGER NOT NULL,
    "paymentProof" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OwnerSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdminCommission" (
    "id" TEXT NOT NULL,
    "sharedJeepId" TEXT NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SuperAdminCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "safariType" TEXT NOT NULL,
    "safariId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "photos" TEXT[],
    "googleReviewLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "templateName" TEXT,
    "templateData" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");
CREATE UNIQUE INDEX "SafariOwner_userId_key" ON "SafariOwner"("userId");
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");
CREATE UNIQUE INDEX "PrivateSafariBooking_safariId_key" ON "PrivateSafariBooking"("safariId");
CREATE UNIQUE INDEX "SharedJeep_bookingLinkToken_key" ON "SharedJeep"("bookingLinkToken");
CREATE UNIQUE INDEX "SharedSafariBooking_jeepId_seatNumber_key" ON "SharedSafariBooking"("jeepId", "seatNumber");
CREATE UNIQUE INDEX "JeepAssignment_privateSafariId_key" ON "JeepAssignment"("privateSafariId");
CREATE UNIQUE INDEX "JeepAssignment_sharedJeepId_key" ON "JeepAssignment"("sharedJeepId");
CREATE UNIQUE INDEX "GuideAssignment_privateSafariId_key" ON "GuideAssignment"("privateSafariId");
CREATE UNIQUE INDEX "GuideAssignment_sharedJeepId_key" ON "GuideAssignment"("sharedJeepId");
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "User_email_phone_idx" ON "User"("email", "phone");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "Vendor_vendorType_subscriptionStatus_idx" ON "Vendor"("vendorType", "subscriptionStatus");
CREATE INDEX "SafariOwner_subscriptionStatus_idx" ON "SafariOwner"("subscriptionStatus");
CREATE INDEX "PrivateSafari_ownerId_safariDate_status_idx" ON "PrivateSafari"("ownerId", "safariDate", "status");
CREATE INDEX "PrivateSafariBooking_customerId_safariId_idx" ON "PrivateSafariBooking"("customerId", "safariId");
CREATE INDEX "SharedJeep_ownerId_safariDate_status_idx" ON "SharedJeep"("ownerId", "safariDate", "status");
CREATE INDEX "SharedJeep_safariDate_safariType_idx" ON "SharedJeep"("safariDate", "safariType");
CREATE INDEX "SharedSafariBooking_customerId_status_idx" ON "SharedSafariBooking"("customerId", "status");
CREATE INDEX "SharedSafariBooking_jeepId_status_idx" ON "SharedSafariBooking"("jeepId", "status");
CREATE INDEX "JeepAssignment_vendorId_paymentStatus_idx" ON "JeepAssignment"("vendorId", "paymentStatus");
CREATE INDEX "GuideAssignment_vendorId_paymentStatus_idx" ON "GuideAssignment"("vendorId", "paymentStatus");
CREATE INDEX "MealOrder_vendorId_paymentStatus_idx" ON "MealOrder"("vendorId", "paymentStatus");
CREATE INDEX "VendorPayment_vendorId_status_idx" ON "VendorPayment"("vendorId", "status");
CREATE INDEX "SubscriptionPayment_vendorId_status_idx" ON "SubscriptionPayment"("vendorId", "status");
CREATE INDEX "OwnerSubscriptionPayment_ownerId_status_idx" ON "OwnerSubscriptionPayment"("ownerId", "status");
CREATE INDEX "SuperAdminCommission_status_createdAt_idx" ON "SuperAdminCommission"("status", "createdAt");
CREATE INDEX "Review_customerId_safariType_idx" ON "Review"("customerId", "safariType");
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");
CREATE INDEX "Notification_recipientId_type_idx" ON "Notification"("recipientId", "type");
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafariOwner" ADD CONSTRAINT "SafariOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateSafari" ADD CONSTRAINT "PrivateSafari_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "SafariOwner"("id") ON UPDATE CASCADE;
ALTER TABLE "PrivateSafariBooking" ADD CONSTRAINT "PrivateSafariBooking_safariId_fkey" FOREIGN KEY ("safariId") REFERENCES "PrivateSafari"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateSafariBooking" ADD CONSTRAINT "PrivateSafariBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON UPDATE CASCADE;
ALTER TABLE "SharedJeep" ADD CONSTRAINT "SharedJeep_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "SafariOwner"("id") ON UPDATE CASCADE;
ALTER TABLE "SharedSafariBooking" ADD CONSTRAINT "SharedSafariBooking_jeepId_fkey" FOREIGN KEY ("jeepId") REFERENCES "SharedJeep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedSafariBooking" ADD CONSTRAINT "SharedSafariBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON UPDATE CASCADE;
ALTER TABLE "JeepAssignment" ADD CONSTRAINT "JeepAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "JeepAssignment" ADD CONSTRAINT "JeepAssignment_privateSafariId_fkey" FOREIGN KEY ("privateSafariId") REFERENCES "PrivateSafari"("id") ON UPDATE CASCADE;
ALTER TABLE "JeepAssignment" ADD CONSTRAINT "JeepAssignment_sharedJeepId_fkey" FOREIGN KEY ("sharedJeepId") REFERENCES "SharedJeep"("id") ON UPDATE CASCADE;
ALTER TABLE "GuideAssignment" ADD CONSTRAINT "GuideAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "GuideAssignment" ADD CONSTRAINT "GuideAssignment_privateSafariId_fkey" FOREIGN KEY ("privateSafariId") REFERENCES "PrivateSafari"("id") ON UPDATE CASCADE;
ALTER TABLE "GuideAssignment" ADD CONSTRAINT "GuideAssignment_sharedJeepId_fkey" FOREIGN KEY ("sharedJeepId") REFERENCES "SharedJeep"("id") ON UPDATE CASCADE;
ALTER TABLE "MealOrder" ADD CONSTRAINT "MealOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "MealOrder" ADD CONSTRAINT "MealOrder_privateSafariId_fkey" FOREIGN KEY ("privateSafariId") REFERENCES "PrivateSafari"("id") ON UPDATE CASCADE;
ALTER TABLE "MealOrder" ADD CONSTRAINT "MealOrder_sharedJeepId_fkey" FOREIGN KEY ("sharedJeepId") REFERENCES "SharedJeep"("id") ON UPDATE CASCADE;
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "OwnerSubscriptionPayment" ADD CONSTRAINT "OwnerSubscriptionPayment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "SafariOwner"("id") ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON UPDATE CASCADE;
