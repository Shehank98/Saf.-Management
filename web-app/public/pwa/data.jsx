// data.jsx - mock data for prototype (4-seat reservation model)
const SAFARIS = [
  {
    id: 's1',
    name: 'Yala Morning Drive',
    location: 'Yala, Southern',
    locationFull: 'Yala National Park · Block 1',
    price: 6500,
    minSeats: 4,
    paidSeats: 3,
    reservedSeats: 0,
    totalSeats: 6,
    date: 'Tue, May 19',
    dateShort: '19 May',
    time: '5:30 AM',
    duration: 'Half Day',
    type: 'shared',
    status: 'OPEN', // OPEN | PENDING_PAYMENT | CONFIRMED | COMPLETED | CANCELLED
    thumb: 0,
    rating: 4.9,
    reviews: 312,
    guide: 'Pradeep Silva',
    jeepCode: 'JP-1042',
  },
  {
    id: 's2',
    name: 'Udawalawe Afternoon',
    location: 'Udawalawe',
    locationFull: 'Udawalawe National Park',
    price: 5800,
    minSeats: 4,
    paidSeats: 4,
    reservedSeats: 1,
    totalSeats: 6,
    date: 'Wed, May 20',
    dateShort: '20 May',
    time: '2:00 PM',
    duration: 'Half Day',
    type: 'shared',
    status: 'CONFIRMED',
    thumb: 1,
    rating: 4.8,
    reviews: 198,
    guide: 'Nilan Fernando',
    jeepCode: 'JP-1043',
  },
  {
    id: 's3',
    name: 'Wilpattu Leopard',
    location: 'Wilpattu',
    locationFull: 'Wilpattu National Park',
    price: 8500,
    minSeats: 4,
    paidSeats: 2,
    reservedSeats: 1,
    totalSeats: 6,
    date: 'Thu, May 21',
    dateShort: '21 May',
    time: '6:00 AM',
    duration: 'Full Day',
    type: 'shared',
    status: 'OPEN',
    thumb: 2,
    rating: 5.0,
    reviews: 89,
    guide: 'Rajiv Perera',
    jeepCode: 'JP-1044',
  },
  {
    id: 's4',
    name: 'Minneriya Elephants',
    location: 'Minneriya',
    locationFull: 'Minneriya National Park',
    price: 5200,
    minSeats: 4,
    paidSeats: 4,
    reservedSeats: 0,
    totalSeats: 6,
    date: 'Fri, May 22',
    dateShort: '22 May',
    time: '3:30 PM',
    duration: 'Half Day',
    type: 'shared',
    status: 'PENDING_PAYMENT',
    thumb: 3,
    rating: 4.7,
    reviews: 144,
    guide: 'Asanka Bandara',
    jeepCode: 'JP-1045',
  },
];

const BOOKINGS = [
  { id: 'B-2401', safari: 'Yala Morning Drive', date: 'Tue, May 19', status: 'PAID', amount: 6500, seats: 1, pickup: 'Tissamaharama Hotel', meal: 'Veg', jeepCode:'JP-1042', paidSeats: 4 },
  { id: 'B-2402', safari: 'Wilpattu Leopard', date: 'Thu, May 21', status: 'RESERVED', amount: 8500, seats: 1, pickup: 'Anuradhapura Junction', meal: 'Non-Veg', jeepCode:'JP-1044', paidSeats: 2, reservedSeats: 1, waitingFor: 1 },
  { id: 'B-2403', safari: 'Minneriya Elephants', date: 'Fri, May 22', status: 'PAYMENT_PENDING', amount: 5200, seats: 1, pickup: 'Habarana', meal: 'Veg', jeepCode:'JP-1045', paidSeats: 4, deadlineHrs: 32 },
  { id: 'B-2398', safari: 'Udawalawe Afternoon', date: 'May 14', status: 'RELEASED', amount: 5800, seats: 1, pickup: 'Embilipitiya', meal: 'Veg', jeepCode:'JP-1031', paidSeats: 3 },
  { id: 'B-2376', safari: 'Bundala Birds', date: 'Apr 28', status: 'AUTO_CANCELLED', amount: 6200, seats: 1, pickup: 'Hambantota', meal: 'Vegan', jeepCode:'JP-1019', refundAmount: 6200 },
];

const OWNER_JEEPS = [
  { code:'JP-1042', name:'Yala Morning', date:'19 May · 5:30 AM', paidSeats:3, reservedSeats:1, totalSeats:6, price:6500, status:'OPEN', vendor:'Sunil Jeeps' },
  { code:'JP-1043', name:'Udawalawe PM', date:'20 May · 2:00 PM', paidSeats:4, reservedSeats:1, totalSeats:6, price:5800, status:'CONFIRMED', vendor:'Sunil Jeeps' },
  { code:'JP-1044', name:'Wilpattu Full', date:'21 May · 6:00 AM', paidSeats:2, reservedSeats:1, totalSeats:6, price:8500, status:'OPEN', vendor:'Northern Jeeps' },
  { code:'JP-1045', name:'Minneriya PM', date:'22 May · 3:30 PM', paidSeats:4, reservedSeats:0, totalSeats:6, price:5200, status:'PENDING_PAYMENT', vendor:'Sunil Jeeps', deadlineHrs: 32 },
  { code:'JP-1046', name:'Yala Morning', date:'23 May · 5:30 AM', paidSeats:0, reservedSeats:0, totalSeats:6, price:6500, status:'OPEN', vendor:null },
  { code:'JP-1047', name:'Yala Morning (Overflow)', date:'19 May · 5:30 AM', paidSeats:1, reservedSeats:0, totalSeats:6, price:6500, status:'OPEN', vendor:null, overflow:true },
];

const VENDOR_JOBS = [
  { id: 'J-3201', safari: 'Yala Morning · JP-1042', date: 'Tue, May 19 · 5:30 AM', owner: 'Wild Lanka Co.', location: 'Tissamaharama', payment: 4200, status: 'PENDING', customers: 4 },
  { id: 'J-3198', safari: 'Wilpattu Full Day · JP-1044', date: 'Thu, May 21 · 6:00 AM', owner: 'Northern Trails', location: 'Wilpattu Gate', payment: 6800, status: 'PENDING', customers: 3 },
  { id: 'J-3193', safari: 'Udawalawe PM · JP-1043', date: 'Wed, May 20 · 2:00 PM', owner: 'Wild Lanka Co.', location: 'Embilipitiya', payment: 3500, status: 'ACCEPTED', customers: 5 },
  { id: 'J-3188', safari: 'Yala Morning · JP-1038', date: 'May 14 · 5:30 AM', owner: 'Wild Lanka Co.', location: 'Tissamaharama', payment: 4200, status: 'COMPLETED', customers: 4, paid: true },
];

const VENDORS_FOR_OWNER = [
  { name: 'Sunil Jeeps', role: 'Jeep Provider', owed: 18400, status: 'pending', trips: 4 },
  { name: 'Pradeep Silva', role: 'Guide', owed: 6200, status: 'pending', trips: 3 },
  { name: 'Mama Lanka Kitchen', role: 'Restaurant', owed: 4800, status: 'paid', trips: 2 },
  { name: 'Yala Camera Hub', role: 'Camera Rental', owed: 3200, status: 'pending', trips: 1 },
];

const ADMIN_USERS = [
  { name: 'Wild Lanka Co.', email: 'ops@wildlanka.lk', role: 'Safari Owner', date: 'May 14', status: 'pending', sub:false },
  { name: 'Sunil Jeeps', email: 'sunil@jeeps.lk', role: 'Jeep Provider', date: 'May 14', status: 'pending', sub:false },
  { name: 'Mama Lanka Kitchen', email: 'hello@mamalanka.lk', role: 'Restaurant', date: 'May 13', status: 'pending', sub:false },
  { name: 'Northern Trails', email: 'admin@northern.lk', role: 'Safari Owner', date: 'May 12', status: 'approved', sub:true },
  { name: 'Yala Camera Hub', email: 'rent@ycamerahub.com', role: 'Camera Rental', date: 'May 12', status: 'approved', sub:true },
  { name: 'Pradeep Silva', email: 'pradeep.s@gmail.com', role: 'Guide', date: 'May 10', status: 'approved', sub:false }, // needs subscription activation
];

const NOTIFICATIONS = [
  { type: 'booking', title: 'Seat reserved on JP-1044', body: 'Wilpattu Leopard · Waiting for 1 more customer', time: '12m', unread: true, channel:'whatsapp' },
  { type: 'payment', title: 'Pay within 48h · JP-1045', body: 'Minneriya is confirmed. Pay LKR 5,200 to secure your seat.', time: '14m', unread: true, channel:'whatsapp' },
  { type: 'job', title: 'New job · JP-1042', body: 'Yala Morning, 19 May 5:30 AM · Accept within 6h', time: '1h', unread: true, channel:'whatsapp' },
  { type: 'warning', title: '4th seat reserved', body: 'JP-1045 entered payment phase. Overflow jeep auto-created.', time: '3h', unread: false, channel:'system' },
  { type: 'subscription', title: 'Subscription expires in 4 days', body: 'Renew Vendor Pro to keep receiving jobs', time: 'Yesterday', unread: false, channel:'whatsapp' },
  { type: 'cancel', title: 'Safari cancelled · JP-1019', body: 'Under 4 seats by 24h cutoff · Full refund of LKR 6,200 issued', time: 'Yesterday', unread: false, channel:'whatsapp' },
];

window.MOCK = { SAFARIS, BOOKINGS, OWNER_JEEPS, VENDOR_JOBS, VENDORS_FOR_OWNER, ADMIN_USERS, NOTIFICATIONS };
