# Safari Management Platform: Flow Guide

This is a plain-language map of how the existing repo works, so you can rebuild it from scratch.
It was written by reading the code (backend, web-app, mobile-app). Nothing in the repo was changed.

---

## 0. Big picture

**What it is:** a platform for Sri Lankan safari businesses (the seed data points at Yala).
It connects four kinds of users.

| Role | Who they are | Where they work |
|---|---|---|
| `SUPER_ADMIN` | Platform owner (you) | Web dashboard |
| `SAFARI_OWNER` | Safari company that sells trips | Web dashboard and mobile app |
| `VENDOR` | Jeep provider, guide, restaurant, accommodation, camera rental, other | Web dashboard and mobile app |
| `CUSTOMER` | Tourist who books a seat | Web booking pages |

**Tech stack**
- Backend: Node, Express, TypeScript, Prisma and PostgreSQL. Redis is configured, and Stripe and WhatsApp (Meta Cloud API) are used for payments and messages.
- Web app: Next.js (App Router), Tailwind, React Query, react-hook-form with zod, framer-motion.
- Mobile app: React Native (Expo), React Navigation, Zustand, React Query. It serves Owners and Vendors only.
- Deploy: Railway (`railway.json` in each app).

**Two safari products**
1. **Shared Safari:** a jeep with 6 seats. Different customers each buy a seat.
2. **Private Safari:** one group books the whole jeep. A deposit is paid first.

**Money model**
- Owners pay a monthly subscription (default LKR 2,500).
- Vendors pay a monthly subscription (default LKR 1,000).
- The platform takes a commission on shared safaris (field default is 15%, but see the notes at the end).
- Private safaris use a deposit (default 30%).

---

## 1. Account lifecycle (all roles)

### 1.1 Registration
Web (`/register`) is a 4-step wizard. Mobile has a similar flow, plus a vendor-type picker.

1. **Account type:** Vendor or Safari Owner.
2. **Personal info:** name, email, phone, password (min 8 characters).
3. **Business info:**
   - Vendor: vendor type, business name, address, tax ID, bank details.
   - Owner: company name, company address, tax ID.
4. **Locations:** pick the areas you operate in. The list comes from `GET /api/auth/locations`.

`POST /api/auth/register` then does the following in one DB transaction:
- It checks that email and phone are unique (409 if not).
- It hashes the password (bcrypt, 12 rounds).
- It creates `User`, plus `Vendor` or `SafariOwner` or `Customer`.
- It links the chosen locations (`VendorLocation` or `SafariOwnerLocation`).
- **Approval rule:** `CUSTOMER` is `APPROVED` automatically. Owner and Vendor start as `PENDING`.
- It returns an access token (JWT, 7 days) and a refresh token (UUID, 30 days, stored in DB).

### 1.2 Login
`POST /api/auth/login`:
- Wrong credentials give 401.
- Non-admins whose status is not `APPROVED` get 403.
  - Code `PENDING_APPROVAL`: the web app shows `/pending`.
  - Code `ACCOUNT_REJECTED`: shows the rejection message.
- On success it returns the user plus both tokens.
- The web app stores them in `localStorage`. The mobile app stores them in secure storage via `auth.service`.
- Routing by role:
  - Web: `/admin/dashboard`, `/owner/dashboard`, `/vendor/dashboard`.
  - Mobile: Owner goes to `OwnerNavigator`, Vendor goes to `VendorNavigator`. Admin and Customer are told to use the web app.

### 1.3 Token refresh and logout
- On any 401 the axios interceptor calls `POST /api/auth/refresh`. The old refresh token is deleted and a new pair is issued (rotation).
- `POST /api/auth/logout` deletes the refresh token.
- `GET /api/auth/me` returns the profile, feature flags, subscription status and locations.

### 1.4 Admin approval (gate to everything)
```
Register -> PENDING -> Admin reviews in "Users" tab -> APPROVE / REJECT(+note)
                                  |                         |
                           can log in               login blocked with message
```
Endpoints: `GET /admin/users/pending`, `PATCH /admin/users/:id/approve`, `PATCH /admin/users/:id/reject`.

> Dev helper: `GET /api/auth/setup-admin` creates or resets `admin@safari.lk` with a hard-coded password.
> Remove this in your rebuild. It is a security hole.

---

## 2. Super Admin flow

Web `/admin/dashboard`, protected by `requireRole('SUPER_ADMIN')`. It has 7 tabs.

| Tab | What admin does | API |
|---|---|---|
| **Overview** | Sees active owners and vendors, pending approvals, monthly commission, pending commission | `GET /admin/dashboard` |
| **Users** | Approve or reject new Owners and Vendors (with a note) | `/admin/users/*` |
| **Features** | Toggle feature flags per user (see below) | `GET/PATCH /admin/users/:id/features` |
| **Billing** | List owners, activate a subscription for N months with payment proof | `GET /admin/owners`, `POST /admin/owners/:id/subscription` |
| **Vendors** | Browse vendors by type and status | `GET /admin/vendors` |
| **Locations** | Create, rename, deactivate areas (soft delete, `isActive=false`) | `/admin/locations` |
| **Analytics** | Shared and private safaris by status, subscription revenue (week, month, year) | `GET /admin/analytics` |

**Feature flags** (`UserFeature`, unique per user + feature):
`SHARED_TRIPS`, `PRIVATE_SAFARI`, `BOOKING_MANAGEMENT`, `VENDOR_LISTINGS`, `REPORTS_ANALYTICS`.
The owner dashboard builds its tabs from these flags. A tab does not appear if the flag is off.

**Manual cron triggers** (for testing): `POST /admin/cron/payment-deadlines`, `/safari-cancellations`, `/subscription-expiry`.
**Test messages:** `POST /notifications/whatsapp/send`, `POST /notifications/test`.

### Subscription activation (owner)
```
Owner pays admin offline (bank/cash) -> Admin enters months + proof
-> OwnerSubscriptionPayment(PAID) + SafariOwner.subscriptionStatus=ACTIVE, start/end dates set
```

---

## 3. Safari Owner flow

Web `/owner/dashboard` (tabs depend on feature flags) and mobile `OwnerNavigator`.

Mobile bottom tabs: **Home, Private, Shared, Payments, Revenue**.

### 3.1 Overview / Home
`GET /owner/dashboard` returns:
- upcoming shared safaris (statuses OPEN, PENDING_PAYMENT, CONFIRMED);
- upcoming private safaris (CONFIRMED, DEPOSIT_PAID);
- this month's paid revenue;
- the count of pending vendor payments.

### 3.2 Location rule
The owner can only create safaris in locations they operate in.
The backend checks `SafariOwnerLocation` and returns 403 otherwise.
Vendors can only be assigned if they serve the same location (400 otherwise).

### 3.3 Shared safari management
1. **Create:** pick date, safari type (`Full Day`, `Morning Half`, `Afternoon Half`), price per seat, location.
   `POST /shared-safari/jeeps` creates a `SharedJeep` with:
   - status `OPEN`, 6 total seats;
   - `safariDeadline = safariDate - 24h`.
2. **Share a booking link:** `POST /shared-safari/jeeps/:id/booking-link` generates a random token. The URL is `WEB_APP_URL/book/link/<token>`. Anyone can open it (`GET /shared-safari/link/:token`).
3. **Assign vendors:** `PATCH /shared-safari/jeeps/:id/assign-vendors`.
   - Jeep vendor: `jeepNumber` and `rentalFee`, saved as `JeepAssignment`.
   - Guide vendor: `guideFee`, saved as `GuideAssignment`.
   - The vendor list comes from `GET /vendors/available`. It shows only ACTIVE, available vendors who share a location with the owner and are not blocked on that date.
4. **Track payments:** `GET /shared-safari/jeeps/:id/payment-tracking` returns each seat's customer, status, amount and minutes left before the deadline.

### 3.4 Private safari management
The owner creates the private trip. The customer is attached later (see section 5.2). Full status flow is in section 6.2.

1. **Create inquiry:** `POST /private-safari/inquiry` with date, type, guests, total price and location.
   Deposit is computed as `total x 30%` (default). Status starts at `INQUIRY`.
2. **Move the status forward** (button on the detail screen). Each tap calls `PATCH /private-safari/:id/status`:

   | Current status | Button | Next status |
   |---|---|---|
   | INQUIRY | Request Deposit | DEPOSIT_PENDING |
   | DEPOSIT_PENDING | Mark Deposit Paid | DEPOSIT_PAID |
   | DEPOSIT_PAID | Confirm Safari | CONFIRMED |
   | CONFIRMED | Mark Completed | COMPLETED |

3. **Assign vendors:** same as shared (`PATCH /private-safari/:id/assign-vendors`).
4. **Detail screen cards:** Customer, Safari Details, Financials, Assigned Vendors.

### 3.5 Vendor payments (owner pays vendors)
- `GET /owner/vendor-payments` lists the `VendorPayment` rows linked to this owner's jeeps.
- `POST /owner/vendor-payments/:id/mark-paid` sets the status to PAID and records `paidAt`.
- Vendors see this in their Earnings.

### 3.6 Revenue
`GET /owner/revenue` returns the last 100 paid shared bookings (amount, paid date, safari date and type).

### 3.7 Owner subscription
`GET /owner/subscription` shows status, start, end and monthly fee. The admin activates it (section 2).

---

## 4. Vendor flow

Web `/vendor/dashboard` (simple) and mobile `VendorNavigator`.

Mobile bottom tabs: **Home, Jobs, Earnings, Subscribe**.

### 4.1 Subscription gate
- New vendors start as `PENDING_PAYMENT`.
- The dashboard shows a warning banner until the status is `ACTIVE`. Mobile uses `SubscriptionBanner`.
- `POST /vendors/subscription/pay` with `months` creates a `SubscriptionPayment` (PENDING) and sets the dates. It is activated "once payment is verified".
- `requireActiveSubscription` middleware blocks features when the status is not ACTIVE or has expired.

### 4.2 Dashboard
`GET /vendors/dashboard` returns the next 10 jeep and guide assignments, pending payments, this month's earnings and the total pending.

### 4.3 Jobs
`GET /vendors/jobs` returns upcoming jeep jobs and guide jobs. For each job:
- Private safari: customer name and phone.
- Shared safari: paid or confirmed passengers and the owner's contact.
The Job Detail screen shows all of this.

### 4.4 Availability
`PATCH /vendors/availability` sets `isAvailable` and a list of `blockedDates`.
Owners cannot see a vendor on a blocked date.

### 4.5 Earnings
`GET /vendors/earnings?period=month|year|all` returns PAID `VendorPayment` rows and the total.

### 4.6 Vendor types and what they do
| Type | Used in |
|---|---|
| JEEP_PROVIDER | `JeepAssignment` (jeep number + rental fee) |
| GUIDE | `GuideAssignment` (guide fee) |
| RESTAURANT | `MealOrder` (meals for a trip) |
| ACCOMMODATION, CAMERA_RENTAL, OTHER | Registered, with limited use in the current code |

---

## 5. Customer flows (web only, no separate app)

### 5.1 Shared safari booking (main flow)

**Step A: Browse** (`/book`)
1. Customer sees available dates (`GET /shared-safari/available-dates`).
2. Picks a date, then a safari type. Each type shows seats left and "Confirmed" or "Pending minimum".

**Step B: Booking wizard** (`/book/<date>?type=...`), 4 steps with a progress bar
1. **Select seat:** `SeatMap` shows 6 seats in 3 rows (Front: 1-2, Middle: 3-4, Back: 5-6). Seats are colored available, reserved or paid.
2. **Pickup location:** Google Maps `LocationPicker`. The pin must be within **7 km** of the base point (`BASE_LAT/BASE_LNG/PICKUP_RADIUS_KM`). `POST /shared-safari/validate-location` checks it.
3. **Meals and extras:**
   - Meals: +LKR 500 (breakfast, lunch, dinner; dietary options; allergies).
   - Camera rental: +LKR 1,500.
4. **Confirm:** price breakdown, then **Reserve Seat**.

`POST /shared-safari/reserve-seat` (login as CUSTOMER required):
- It re-checks the 7 km rule.
- It rejects a taken seat (409) or a full jeep (409).
- `totalAmount = pricePerSeat + meal + camera`.
- It creates the booking as `RESERVED` and increments `reservedSeats`.
- If this is the 6th reservation, the jeep becomes `FULLY_BOOKED`.

**Step C: The 4-seat trigger** (the heart of the system)
```
Seat reservations: 1... 2... 3... 4th seat reserved
                                        |
        +-------------------------------+--------------------------------+
        v                                                                v
 triggerPaymentLinksForJeep                                      autoCreateJeep
  - Jeep -> PENDING_PAYMENT                              - Creates a NEW OPEN jeep
  - deadline = now + 24h                                   for same date/type/price
  - Every RESERVED booking -> PAYMENT_PENDING              so more people can book
  - WhatsApp "payment_request" with link
```

**Step D: Payment**
- Link: `WEB_APP_URL/pay/<bookingId>` (the payment page is not in the repo yet).
- `POST /payments/shared-safari/create-intent/:bookingId` creates a Stripe PaymentIntent (LKR).
- A Stripe webhook (`payment_intent.succeeded`) marks the booking `PAID`, then counts paid seats on the jeep.
  - 4 or more paid: jeep becomes `CONFIRMED`.
  - Fewer: it only updates `paidSeats`.
- There is also a direct `POST /shared-safari/payment/confirm/:bookingId`, which does the same logic without Stripe.

**Step E: Conflict handling**
When a jeep reaches the minimum number of paid seats, `cancelConflictingBookings` runs.
If the same customers still have RESERVED or PAYMENT_PENDING seats on other jeeps, those are `AUTO_CANCELLED`, the seat is freed, and WhatsApp `booking_conflict_cancelled` is sent.
`GET /shared-safari/conflicts` lets a customer check this beforehand.

**Step F: After booking**
- 24 h before: WhatsApp reminder (date, type, pickup time, guide, jeep number).
- About 6 h after the safari ends: status becomes `COMPLETED` and a Google review request is sent.

### 5.2 Private safari booking
- `POST /private-safari/:id/book` (CUSTOMER): the safari must be `INQUIRY` or `DEPOSIT_PENDING`.
- It creates `PrivateSafariBooking` (customer and special requests) and sets the status to `DEPOSIT_PENDING`.
- After that the owner drives the status through deposit, confirmation and completion (section 3.4).
- **Not built yet:** a customer-facing private-safari page, and a deposit payment through Stripe. Today the owner just taps "Mark Deposit Paid".

---

## 6. State machines (copy these into your design)

### 6.1 Shared jeep (`SharedJeepStatus`)
```
OPEN --(4 seats reserved)--> PENDING_PAYMENT --(4 paid)--> CONFIRMED --(6 reserved)--> FULLY_BOOKED
  ^                               |                           |
  |                               |                           +--(safari done)--> COMPLETED
  +--(drops below 4 active)-------+
                                  +--(<4 paid within 24h of safari)--> CANCELLED (+ refunds)
```

### 6.2 Private safari (`PrivateSafariStatus`)
```
INQUIRY -> DEPOSIT_PENDING -> DEPOSIT_PAID -> CONFIRMED -> COMPLETED
                                   (CANCELLED exists in the enum, but no UI/flow sets it)
```

### 6.3 Shared booking (`BookingStatus`)
```
RESERVED -> PAYMENT_PENDING -> PAID -> (CONFIRMED)
   |              |             |
   |              |             +--> REFUNDED   (jeep cancelled, Stripe refund)
   |              +--> RELEASED                 (24h deadline missed)
   +--> AUTO_CANCELLED                          (customer confirmed on another jeep)
   +--> CANCELLED                               (jeep cancelled)
```

### 6.4 Approval and subscription
```
ApprovalStatus: PENDING -> APPROVED | REJECTED
VendorStatus (owner & vendor): PENDING_PAYMENT -> ACTIVE -> EXPIRED  (SUSPENDED exists, unused)
```

---

## 7. Background jobs (`node-cron`, started in `server.ts`)

| Schedule | Job | What it does |
|---|---|---|
| every 5 min | `checkPaymentDeadlines` | Finds `PAYMENT_PENDING` bookings past the deadline. Sets `RELEASED`, frees the seat, sends `seat_released`, then re-evaluates the jeep status. |
| hourly (:00) | `checkSafariCancellations` | For jeeps within 24 h with fewer than 4 paid seats: `CANCELLED`, Stripe refunds for paid bookings, notifies customers and the owner. |
| daily 00:00 | `checkSubscriptionExpiry` | Marks expired vendors and owners as `EXPIRED` and sends renewal messages. Warns vendors 7 days before expiry. |
| hourly (:30) | `checkPreSafariReminders` | Sends the 24 h reminder to paid customers of confirmed jeeps. |
| hourly (:30) | `checkPostSafariReviews` | Sends the review request about 6 h after the safari and marks the jeep `COMPLETED`. |

---

## 8. Notifications (WhatsApp Business API)

Every message goes through `sendWhatsApp()`. It posts a template message to the Meta Graph API and stores a row in `Notification` (SENT or FAILED).

Templates in code:
`safari_confirmed`, `payment_request`, `seat_released`, `safari_cancelled`, `subscription_expired`, `subscription_expiring_soon`, `safari_reminder_24h`, `review_request`, `booking_conflict_cancelled`.

You must create and approve these templates in Meta before they work.

---

## 9. Data model (what to create in the DB)

**People:** `User`, `UserFeature`, `RefreshToken`, `Vendor`, `SafariOwner`, `Customer`
**Places:** `Location`, `SafariOwnerLocation`, `VendorLocation` (many-to-many)
**Private:** `PrivateSafari`, `PrivateSafariBooking`
**Shared:** `SharedJeep`, `SharedSafariBooking` (unique on jeepId + seatNumber)
**Vendor jobs:** `JeepAssignment`, `GuideAssignment`, `MealOrder`
**Money:** `VendorPayment`, `SubscriptionPayment`, `OwnerSubscriptionPayment`, `SuperAdminCommission`
**Other:** `Review`, `Notification`, `SystemSettings` (key-value config)

**Seeded settings:** commission 15%, vendor fee 1,000, owner fee 2,500, deposit 30%, payment window 24 h, cancel window 24 h, pickup radius 7 km, minimum seats 4.

---

## 10. Backend API map

All routes sit under `/api`. Responses look like `{ success, data, message }`. Rate limits: auth 20 per 15 min, everything else 200 per minute.

| Prefix | Who | Highlights |
|---|---|---|
| `/auth` | public | register, login, refresh, logout, me, locations |
| `/shared-safari` | public, customer, owner | available-dates, jeeps/:date/:type, reserve-seat, payment/confirm, jeeps (owner CRUD), assign-vendors, payment-tracking, booking-link |
| `/private-safari` | owner, customer | inquiry, owner/list, :id, :id/status, :id/assign-vendors, :id/book |
| `/vendors` | vendor (and owner for `/available`) | profile, dashboard, earnings, jobs, availability, subscription/pay |
| `/owner` | owner | dashboard, revenue, vendor-payments, mark-paid, subscription |
| `/payments` | customer, Stripe | create-intent, webhook/stripe |
| `/admin` | admin | dashboard, users, features, owners, vendors, locations, analytics, cron |
| `/notifications` | admin | whatsapp send, test |

Middleware chain: `helmet` -> `cors` -> `rate-limit` -> `body-parser` (raw for the Stripe webhook) -> `authenticate` (JWT) -> `requireRole(...)` -> controller -> `errorHandler`.

---

## 11. Suggested build order (from scratch)

1. **Foundation:** monorepo, Postgres and Prisma schema, Express app, error and auth middleware, logger.
2. **Auth:** register, login, refresh, roles, approval status, and a seed script for the admin (no `setup-admin` endpoint).
3. **Admin:** approve or reject users, locations, feature flags.
4. **Owner basics:** profile, location linking, subscription activation by the admin.
5. **Vendor basics:** registration by type, availability, subscription, jobs list.
6. **Private safari:** inquiry, status steps, vendor assignment (simplest product, good first win).
7. **Shared safari core:** create jeep, seat reservation, seat map, 4-seat trigger, auto-create the next jeep.
8. **Payments:** Stripe intent and webhook, `PAID` and `CONFIRMED` logic, refunds.
9. **Cron jobs:** payment deadline, cancellation, subscription expiry, reminders and reviews.
10. **WhatsApp:** templates and the notification log.
11. **Customer web UI:** date, type, seat, map, meals and confirm pages, plus the payment page.
12. **Owner and vendor mobile app:** dashboards, lists, detail screens.
13. **Polish:** analytics, reviews, commission tracking, tests.

---

## 12. Gaps and bugs spotted in the current code (fix these in your rebuild)

These are things I noticed while reading. They are not guesses at your intent.

1. **No payment page.** WhatsApp links point to `/pay/<bookingId>`, but no such page exists in `web-app`.
2. **Booking route mismatch.** The `/book` page links to `/book/<date>/seats?type=...`, but the page actually lives at `/book/[linkId]`. The token link `/book/link/<token>` also has no page.
3. **Customer login/register is missing on web.** The register form only offers Vendor or Owner, yet booking needs a logged-in `CUSTOMER`.
4. **Payment confirm is unprotected.** `POST /shared-safari/payment/confirm/:bookingId` has no auth and no Stripe check. Anyone could mark a booking as paid.
5. **Owner checks are missing.** `assign-vendors`, `payment-tracking`, `booking-link` and `vendor-payments/:id/mark-paid` do not verify that the record belongs to the logged-in owner. Any owner could touch another owner's data.
6. **Private safari status** accepts any string, with no allowed-transition check, and `GET /private-safari/:id` is open to any logged-in user.
7. **Vendor payments are never created.** Nothing in the code inserts a `VendorPayment` row after an assignment, so earnings and "pending payments" stay empty.
8. **Commission is never recorded.** `SuperAdminCommission` is read by the admin dashboard but never written.
9. **Web vendor dashboard calls `/vendor/earnings`**, but the route is `/vendors/earnings` (typo).
10. **Subscription activation for vendors** sets the status to `ACTIVE` immediately, even though the payment is `PENDING`. Admin verification is not enforced.
11. **Stripe amount sent from the client.** `create-intent` trusts `amount` from the request body. It should read it from the booking.
12. **Mixed pickup time.** The booking always sends `'06:00 AM'` and `'Selected on map'` as hard-coded values.
13. **Radius uses one global base point,** not the location of each safari.
14. **Reminder and review windows** are rough (fixed 8 h duration, 2 h window), so some trips can be missed.
15. **Refunds and webhook** use different logic paths (`updateMany` in the webhook versus a transaction in `confirmPayment`). Unify them.
16. **Logout URL** on web goes to `/auth/login`, but the login page is `/login`.
17. **Dead schema fields:** `Review`, `MealOrder`, `SharedJeep.assignedGuideId` and similar have no flow behind them yet.

---

*Generated by reading `backend/`, `web-app/` and `mobile-app/` of `shehank98/saf.-management`.*
