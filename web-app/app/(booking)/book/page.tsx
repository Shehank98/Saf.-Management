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

          {/* Step 2 – Safari Type */}
          {selectedDate && selectedDateInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
            >
              <h2 className="font-semibold text-gray-900 mb-1">Select Safari Type</h2>
              <p className="text-sm text-gray-400 mb-4">Choose how long you'd like to spend in the wild</p>
              <div className="grid grid-cols-1 gap-3">
                {(() => {
                  const TYPE_META: Record<string, { icon: string; time: string; price: number; desc: string }> = {
                    'Full Day':           { icon: '🌅', time: '6:00 AM – 6:00 PM', price: 15000, desc: 'Full wildlife experience with two game drives' },
                    'Half Day Morning':   { icon: '🌄', time: '6:00 AM – 12:00 PM', price: 9000,  desc: 'Early morning drive when animals are most active' },
                    'Half Day Afternoon': { icon: '🌇', time: '12:00 PM – 6:00 PM', price: 9000,  desc: 'Afternoon drive with golden hour wildlife sightings' },
                    // legacy label support
                    'Morning Half':       { icon: '🌄', time: '6:00 AM – 12:00 PM', price: 9000,  desc: 'Early morning drive when animals are most active' },
                    'Afternoon Half':     { icon: '🌇', time: '12:00 PM – 6:00 PM', price: 9000,  desc: 'Afternoon drive with golden hour wildlife sightings' },
                  };

                  return selectedDateInfo.safariTypes.map((type) => {
                    const meta = TYPE_META[type.type] ?? { icon: '🌿', time: '', price: 0, desc: '' };
                    const isSelected = selectedType === type.type;
                    const soldOut = type.availableSeats === 0;

                    return (
                      <button
                        key={type.type}
                        disabled={soldOut}
                        onClick={() => { setSelectedType(type.type); }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : soldOut
                            ? 'border-gray-100 opacity-50 cursor-not-allowed bg-gray-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isSelected ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">{type.type}</p>
                              <p className={`text-base font-bold ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                                {meta.price > 0 ? `LKR ${meta.price.toLocaleString()}/seat` : ''}
                              </p>
                            </div>
                            {meta.time && (
                              <p className="text-xs text-gray-500 mt-0.5">🕐 {meta.time}</p>
                            )}
                            {meta.desc && (
                              <p className="text-xs text-gray-400 mt-1">{meta.desc}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                {soldOut ? '❌ Sold out' : `${type.availableSeats} seat${type.availableSeats !== 1 ? 's' : ''} available`}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                type.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {type.status === 'CONFIRMED' ? '✓ Confirmed' : 'Pending bookings'}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
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
