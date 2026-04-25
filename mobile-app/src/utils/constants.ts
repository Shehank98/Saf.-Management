export const VENDOR_TYPES = [
  { id: 'JEEP_PROVIDER', title: 'Jeep Provider', icon: '🚙', description: 'Provide safari vehicles' },
  { id: 'GUIDE', title: 'Safari Guide', icon: '🧭', description: 'Lead safari tours' },
  { id: 'RESTAURANT', title: 'Restaurant', icon: '🍽️', description: 'Provide meals for safaris' },
  { id: 'ACCOMMODATION', title: 'Accommodation', icon: '🏨', description: 'Provide lodging' },
  { id: 'CAMERA_RENTAL', title: 'Camera Rental', icon: '📷', description: 'Rent cameras for guests' },
  { id: 'OTHER', title: 'Other', icon: '🔧', description: 'Other services' },
] as const;

export const SUBSCRIPTION_FEATURES = {
  VENDOR: [
    'Access to booking platform',
    'Unlimited job assignments',
    'WhatsApp notifications',
    'Monthly payment reports',
    'Customer reviews',
  ],
  SAFARI_OWNER: [
    'Create shared & private safaris',
    'Manage vendor assignments',
    'Revenue dashboard',
    'Auto-cancellation protection',
    'Customer management',
  ],
};

export const SUBSCRIPTION_FEES = {
  VENDOR: 1000,
  SAFARI_OWNER: 2500,
};

export const SAFARI_TYPES = ['Full Day', 'Morning Half', 'Afternoon Half'];
