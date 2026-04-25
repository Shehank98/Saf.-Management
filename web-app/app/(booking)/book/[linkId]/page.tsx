'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SeatMap, type Seat } from '@/components/booking/SeatMap';
import { LocationPicker } from '@/components/booking/LocationPicker';
import { MealPreferences } from '@/components/booking/MealPreferences';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface JeepData {
  id: string;
  safariDate: string;
  safariType: string;
  pricePerSeat: number;
  status: string;
  bookings: { seatNumber: number; rowPosition: string; status: string }[];
  owner: { companyName: string };
}

const STEPS = ['Select Seat', 'Pickup Location', 'Meal Preferences', 'Confirm'];

export default function BookingSeatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const date = params.linkId as string;
  const safariType = searchParams.get('type') || '';

  const [step, setStep] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; isValid: boolean; distance: number } | null>(null);
  const [mealData, setMealData] = useState({ mealIncluded: false, mealTypes: [] as string[], dietaryReqs: [] as string[], allergies: '' });
  const [cameraNeeded, setCameraNeeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery<{ data: JeepData[] }>({
    queryKey: ['jeeps', date, safariType],
    queryFn: () => api.get(`/shared-safari/jeeps/${date}/${encodeURIComponent(safariType)}`).then((r) => r.data),
    enabled: !!date && !!safariType,
  });

  const jeep = data?.data?.[0];

  const seats: Seat[] = jeep
    ? Array.from({ length: 6 }, (_, i) => {
        const num = i + 1;
        const booking = jeep.bookings.find((b) => b.seatNumber === num);
        const row = ([1, 2].includes(num) ? 'Front' : [3, 4].includes(num) ? 'Middle' : 'Back') as Seat['row'];
        return {
          number: num,
          row,
          status: booking ? (booking.status === 'PAID' || booking.status === 'CONFIRMED' ? 'paid' : 'reserved') : 'available',
        };
      })
    : [];

  const basePrice = jeep ? parseFloat(String(jeep.pricePerSeat)) : 0;
  const mealPrice = mealData.mealIncluded ? 500 : 0;
  const cameraPrice = cameraNeeded ? 1500 : 0;
  const total = basePrice + mealPrice + cameraPrice;

  const handleConfirm = async () => {
    if (!jeep || !selectedSeat || !locationData?.isValid) return;
    setIsSubmitting(true);
    try {
      await api.post('/shared-safari/reserve-seat', {
        jeepId: jeep.id,
        seatNumber: selectedSeat.number,
        pickupLocation: 'Selected on map',
        pickupLat: locationData.lat,
        pickupLng: locationData.lng,
        pickupTime: '06:00 AM',
        ...mealData,
        cameraNeeded,
      });
      alert('Seat reserved! You will receive a WhatsApp message with payment details.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.error
        : 'Reservation failed';
      alert(msg || 'Reservation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🦁</div>
          <p className="text-gray-500">Loading safari...</p>
        </div>
      </div>
    );
  }

  if (!jeep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No safari available for this date and type.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
          <p className="text-green-700 font-semibold text-sm">{jeep.owner.companyName}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{jeep.safariType}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(jeep.safariDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-gray-500 text-sm">From {formatCurrency(basePrice)}/seat</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              jeep.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {jeep.status === 'CONFIRMED' ? 'Safari Confirmed' : 'Pending 4 paid seats'}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-green-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-6">Step {step + 1}: {STEPS[step]}</p>

        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Select Your Seat</h2>
            <SeatMap seats={seats} onSelectSeat={setSelectedSeat} selectedSeat={selectedSeat?.number} />
            {selectedSeat && (
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-600">Seat {selectedSeat.number} — {selectedSeat.row} Row</p>
                <button
                  onClick={() => setStep(1)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Select Pickup Location</h2>
            <LocationPicker
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}
              onLocationSelect={setLocationData}
            />
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(0)} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
              <button
                disabled={!locationData?.isValid}
                onClick={() => setStep(2)}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Meal Preferences</h2>
            <MealPreferences onUpdate={setMealData} />

            <div className="mt-5 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Camera Rental (+LKR 1,500)</p>
                  <p className="text-xs text-gray-500">Professional DSLR camera</p>
                </div>
                <button
                  onClick={() => setCameraNeeded(!cameraNeeded)}
                  className={`w-12 h-6 rounded-full transition-colors ${cameraNeeded ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${cameraNeeded ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
              <button
                onClick={() => setStep(3)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Confirm Booking</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Safari</span>
                <span className="font-medium">{jeep.safariType}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Seat</span>
                <span className="font-medium">#{selectedSeat?.number} ({selectedSeat?.row})</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Base Price</span>
                <span className="font-medium">{formatCurrency(basePrice)}</span>
              </div>
              {mealData.mealIncluded && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Meals</span>
                  <span className="font-medium">{formatCurrency(mealPrice)}</span>
                </div>
              )}
              {cameraNeeded && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Camera Rental</span>
                  <span className="font-medium">{formatCurrency(cameraPrice)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold text-base">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              After reserving, you will receive a WhatsApp payment link within 24 hours. Safari is confirmed once 4+ seats are paid.
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                {isSubmitting ? 'Reserving...' : 'Reserve Seat'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
