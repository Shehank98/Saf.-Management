'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface AvailableDate {
  date: string;
  safariTypes: { type: string; availableSeats: number; status: string }[];
}

export default function BookingPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: datesData, isLoading } = useQuery<{ data: AvailableDate[] }>({
    queryKey: ['available-dates'],
    queryFn: () => api.get('/shared-safari/available-dates').then((r) => r.data),
  });

  // Step 3: load available jeeps once date + type chosen
  const { data: jeepsData, isLoading: jeepsLoading } = useQuery<any[]>({
    queryKey: ['jeeps-for-date', selectedDate, selectedType],
    queryFn: () =>
      api.get(`/shared-safari/jeeps/${selectedDate}/${encodeURIComponent(selectedType!)}`).then((r) => r.data.data),
    enabled: !!selectedDate && !!selectedType,
  });

  const dates: AvailableDate[] = datesData?.data || [];

  const selectedDateInfo = dates.find((d) => d.date === selectedDate);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/" className="text-green-700 hover:text-green-900 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Shared Safari</h1>
          <p className="text-gray-500 mb-8">Choose your date and safari type</p>

          {/* Step 1 – Date */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Select Date</h2>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dates.map((d) => {
                  const hasSeats = d.safariTypes.some((t) => t.availableSeats > 0);
                  return (
                    <motion.button
                      key={d.date}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!hasSeats}
                      onClick={() => { setSelectedDate(d.date); setSelectedType(null); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedDate === d.date
                          ? 'border-green-500 bg-green-50'
                          : hasSeats
                          ? 'border-gray-200 hover:border-green-300'
                          : 'border-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">
                        {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const available = d.safariTypes.reduce((s, t) => s + t.availableSeats, 0);
                          const total = d.safariTypes.length * 6;
                          const booked = total - available;
                          return `${booked}/${total} booked`;
                        })()}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 – Type */}
          {selectedDate && selectedDateInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
            >
              <h2 className="font-semibold text-gray-900 mb-4">Select Safari Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedDateInfo.safariTypes.map((type) => (
                  <button
                    key={type.type}
                    disabled={type.availableSeats === 0}
                    onClick={() => setSelectedType(type.type)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      selectedType === type.type
                        ? 'border-green-500 bg-green-50'
                        : type.availableSeats > 0
                        ? 'border-gray-200 hover:border-green-300'
                        : 'opacity-50 cursor-not-allowed border-gray-100'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{type.type}</p>
                    <p className="text-sm text-gray-500 mt-1">{type.availableSeats} seats available</p>
                    <p className={`text-xs mt-2 font-medium ${
                      type.status === 'CONFIRMED' ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      {type.status === 'CONFIRMED' ? 'Confirmed' : 'Pending minimum'}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 – Pick a jeep */}
          {selectedDate && selectedType && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Select a Jeep</h2>
              {jeepsLoading && (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              )}
              {!jeepsLoading && (!jeepsData || jeepsData.length === 0) && (
                <p className="text-gray-500 text-sm">No jeeps available for this date and type.</p>
              )}
              {jeepsData?.map((jeep: any) => {
                const available = jeep.totalSeats - jeep.reservedSeats - jeep.paidSeats;
                return (
                  <button
                    key={jeep.id}
                    onClick={() => router.push(`/book/${jeep.bookingLinkToken}`)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all mb-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(jeep.pricePerSeat))} / seat
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {jeep.paidSeats}/{jeep.totalSeats} booked · {available} seat{available !== 1 ? 's' : ''} left
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        jeep.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {jeep.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                    {/* Seat bar */}
                    <div className="flex gap-1 mt-3">
                      {Array.from({ length: jeep.totalSeats }, (_, i) => {
                        const b = jeep.bookings?.find((bk: any) => bk.seatNumber === i + 1);
                        const color = !b ? 'bg-gray-200' : (b.status === 'PAID' || b.status === 'CONFIRMED') ? 'bg-green-500' : 'bg-amber-400';
                        return <div key={i} className={`h-2 flex-1 rounded-full ${color}`} />;
                      })}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
