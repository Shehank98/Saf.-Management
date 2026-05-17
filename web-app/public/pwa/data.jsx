// data.jsx - mock data for prototype
const SAFARIS = [
  {
    id: 's1',
    name: 'Yala National Park',
    location: 'Yala, Southern Province',
    price: 12500,
    seats: 6, taken: 2,
    date: 'Tue, May 19',
    time: '5:30 AM',
    duration: 'Half Day',
    type: 'shared',
    thumb: 0,
    rating: 4.9,
    reviews: 312,
    guide: 'Pradeep Silva',
  },
  {
    id: 's2',
    name: 'Udawalawe Elephant Trail',
    location: 'Udawalawe',
    price: 9800,
    seats: 6, taken: 4,
    date: 'Wed, May 20',
    time: '2:00 PM',
    duration: 'Half Day',
    type: 'shared',
    thumb: 1,
    rating: 4.8,
    reviews: 198,
    guide: 'Nilan Fernando',
  },
  {
    id: 's3',
    name: 'Wilpattu Leopard Tracker',
    location: 'Wilpattu',
    price: 22000,
    seats: 4, taken: 1,
    date: 'Thu, May 21',
    time: '6:00 AM',
    duration: 'Full Day',
    type: 'shared',
    thumb: 2,
    rating: 5.0,
    reviews: 89,
    guide: 'Rajiv Perera',
  },
  {
    id: 's4',
    name: 'Minneriya Wildlife',
    location: 'Minneriya',
    price: 8600,
    seats: 6, taken: 5,
    date: 'Fri, May 22',
    time: '3:30 PM',
    duration: 'Half Day',
    type: 'shared',
    thumb: 3,
    rating: 4.7,
    reviews: 144,
    guide: 'Asanka Bandara',
  },
];

const BOOKINGS = [
  { id: 'B-2401', safari: 'Yala National Park', date: 'Tue, May 19', status: 'confirmed', amount: 25000, seats: 2, pickup: 'Tissamaharama Hotel', meal: 'Veg' },
  { id: 'B-2398', safari: 'Udawalawe Elephant Trail', date: 'Wed, May 20', status: 'pending', amount: 9800, seats: 1, pickup: 'Embilipitiya Stand', meal: 'Non-Veg' },
  { id: 'B-2376', safari: 'Wilpattu Leopard Tracker', date: 'Apr 28', status: 'cancelled', amount: 22000, seats: 1, pickup: 'Anuradhapura', meal: 'Vegan' },
];

const OWNER_BOOKINGS = [
  { id: '#B-2401', name: 'Emma Larsson', safari: 'Yala — Morning', seats: 2, amount: 25000, status: 'confirmed', date: '19 May' },
  { id: '#B-2399', name: 'Marco Rossi', safari: 'Udawalawe — PM', seats: 1, amount: 9800, status: 'pending', date: '20 May' },
  { id: '#B-2395', name: 'Hana Tanaka', safari: 'Wilpattu — Full Day', seats: 3, amount: 66000, status: 'confirmed', date: '21 May' },
  { id: '#B-2392', name: 'Liam OConnor', safari: 'Minneriya — PM', seats: 2, amount: 17200, status: 'confirmed', date: '22 May' },
  { id: '#B-2389', name: 'Priya Patel', safari: 'Yala Private', seats: 4, amount: 86000, status: 'confirmed', date: '24 May' },
];

const VENDOR_JOBS = [
  { id: 'J-3201', safari: 'Yala National Park — Morning', date: 'Tue, May 19 · 5:30 AM', owner: 'Wild Lanka Co.', location: 'Tissamaharama', payment: 4200, status: 'confirmed', customers: 4 },
  { id: 'J-3198', safari: 'Wilpattu Leopard Tracker', date: 'Thu, May 21 · 6:00 AM', owner: 'Northern Trails', location: 'Wilpattu Gate', payment: 6800, status: 'pending', customers: 3 },
  { id: 'J-3193', safari: 'Udawalawe Afternoon', date: 'Wed, May 20 · 2:00 PM', owner: 'Wild Lanka Co.', location: 'Embilipitiya', payment: 3500, status: 'confirmed', customers: 5 },
];

const VENDORS_FOR_OWNER = [
  { name: 'Sunil Jeeps', role: 'Jeep Provider', owed: 18400, status: 'pending' },
  { name: 'Pradeep Silva', role: 'Guide', owed: 6200, status: 'pending' },
  { name: 'Mama Lanka Kitchen', role: 'Restaurant', owed: 4800, status: 'paid' },
  { name: 'Yala Camera Hub', role: 'Camera Rental', owed: 3200, status: 'pending' },
];

const ADMIN_USERS = [
  { name: 'Wild Lanka Co.', email: 'ops@wildlanka.lk', role: 'Safari Owner', date: 'May 14', status: 'pending' },
  { name: 'Sunil Jeeps', email: 'sunil@jeeps.lk', role: 'Jeep Provider', date: 'May 14', status: 'pending' },
  { name: 'Mama Lanka Kitchen', email: 'hello@mamalanka.lk', role: 'Restaurant', date: 'May 13', status: 'pending' },
  { name: 'Northern Trails', email: 'admin@northern.lk', role: 'Safari Owner', date: 'May 12', status: 'approved' },
  { name: 'Yala Camera Hub', email: 'rent@ycamerahub.com', role: 'Camera Rental', date: 'May 12', status: 'approved' },
  { name: 'Pradeep Silva', email: 'pradeep.s@gmail.com', role: 'Guide', date: 'May 10', status: 'approved' },
];

const NOTIFICATIONS = [
  { type: 'booking', title: 'Booking Confirmed', body: 'Emma Larsson booked 2 seats for Yala — Morning', time: '12m', unread: true },
  { type: 'payment', title: 'Payment Received', body: 'LKR 25,000 deposit cleared via Stripe', time: '14m', unread: true },
  { type: 'job', title: 'New Job Assigned', body: 'Yala Morning — pickup at Tissamaharama 5:30 AM', time: '1h', unread: true },
  { type: 'warning', title: 'Payment Due', body: 'Vendor payment for Sunil Jeeps is overdue by 2 days', time: '3h', unread: false },
  { type: 'subscription', title: 'Subscription Expiring', body: 'Your vendor plan renews in 4 days', time: 'Yesterday', unread: false },
  { type: 'cancel', title: 'Safari Cancelled', body: 'Minneriya PM cancelled by Marco Rossi — refund pending', time: 'Yesterday', unread: false },
];

window.MOCK = { SAFARIS, BOOKINGS, OWNER_BOOKINGS, VENDOR_JOBS, VENDORS_FOR_OWNER, ADMIN_USERS, NOTIFICATIONS };
