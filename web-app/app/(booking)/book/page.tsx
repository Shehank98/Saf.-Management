'use client';

import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Sun, Sunrise, Sunset, Leaf, Clock, Calendar, Check, LucideIcon } from 'lucide-react';

interface AvailableDate {
  date: string;
  safariTypes: { type: string; availableSeats: number; status: string }[];
}

const TYPE_META: Record<string, { icon: LucideIcon; time: string; desc: string }> = {
  'Full Day':           { icon: Sun,     time: '6:00 AM – 6:00 PM',  desc: 'Two game drives, full wildlife experience' },
  'Half Day Morning':   { icon: Sunrise, time: '6:00 AM – 12:00 PM', desc: 'Early morning when animals are most active' },
  'Half Day Afternoon': { icon: Sunset,  time: '12:00 PM – 6:00 PM', desc: 'Golden hour sightings & sunset views' },
  'Morning Half':       { icon: Sunrise, time: '6:00 AM – 12:00 PM', desc: 'Early morning when animals are most active' },
  'Afternoon Half':     { icon: Sunset,  time: '12:00 PM – 6:00 PM', desc: 'Golden hour sightings & sunset views' },
};

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 text-emerald-300 animate-spin mx-auto mb-4" />
          <p className="text-emerald-200">Loading your safari...</p>
        </div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerUserId = searchParams.get('owner') || undefined;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: datesData, isLoading } = useQuery<{ data: AvailableDate[] }>({
    queryKey: ['available-dates', ownerUserId],
    queryFn: () =>
      api.get('/shared-safari/available-dates', { params: ownerUserId ? { owner: ownerUserId } : {} }).then((r) => r.data),
  });

  const { data: jeepsData, isLoading: jeepsLoading } = useQuery<any[]>({
    queryKey: ['jeeps-for-date', selectedDate, selectedType],
    queryFn: () =>
      api.get(`/shared-safari/jeeps/${selectedDate}/${encodeURIComponent(selectedType!)}`).then((r) => r.data.data),
    enabled: !!selectedDate && !!selectedType,
  });

  const dates: AvailableDate[] = datesData?.data || [];
  const selectedDateInfo = dates.find((d) => d.date === selectedDate);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-6 pt-10 pb-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-emerald-300 text-sm font-medium mb-1 tracking-wide uppercase">Wildlife Experience</p>
          <h1 className="text-3xl font-bold mb-2">Book Your Safari</h1>
          <p className="text-emerald-200 text-sm">Choose a date, pick your safari type, and reserve your seat.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-16 space-y-4">

        {/* Step 1 – Date */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Step 1</p>
              <h2 className="font-bold text-gray-900 text-base mt-0.5">Choose a Date</h2>
            </div>
            {selectedDate && (
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} <Check className="inline w-3 h-3" />
              </span>
            )}
          </div>

          <div className="px-4 pb-5">
            {isLoading ? (
              <div className="flex gap-3 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-20 h-24 flex-shrink-0 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : dates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No available dates yet. Check back soon.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {dates.map((d) => {
                  const dt = new Date(d.date);
                  const hasSeats = d.safariTypes.some((t) => t.availableSeats > 0);
                  const totalAvail = d.safariTypes.reduce((s, t) => s + t.availableSeats, 0);
                  const totalCap = d.safariTypes.length * 6;
                  const isSelected = selectedDate === d.date;

                  return (
                    <motion.button
                      key={d.date}
                      whileHover={hasSeats ? { y: -2 } : {}}
                      whileTap={hasSeats ? { scale: 0.96 } : {}}
                      disabled={!hasSeats}
                      onClick={() => { setSelectedDate(d.date); setSelectedType(null); }}
                      className={`flex-shrink-0 w-20 rounded-xl border-2 py-3 text-center transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : hasSeats
                          ? 'border-gray-200 hover:border-green-300 bg-white'
                          : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <p className={`text-xs font-medium ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                        {dt.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-xl font-bold mt-0.5 ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {dt.getDate()}
                      </p>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-green-500' : 'text-gray-400'}`}>
                        {dt.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <div className={`mt-2 mx-2 h-1 rounded-full ${
                        isSelected ? 'bg-green-500' : hasSeats ? 'bg-emerald-200' : 'bg-gray-200'
                      }`} style={{ opacity: hasSeats ? Math.max(0.3, totalAvail / totalCap) : 1 }} />
                      <p className={`text-xs mt-1 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                        {totalAvail} left
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 2 – Safari Type */}
        <AnimatePresence>
          {selectedDate && selectedDateInfo && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Step 2</p>
                  <h2 className="font-bold text-gray-900 text-base mt-0.5">Safari Type</h2>
                </div>
                {selectedType && (
                  <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    {selectedType} <Check className="inline w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="px-4 pb-5 space-y-2.5">
                {selectedDateInfo.safariTypes.map((type) => {
                  const meta = TYPE_META[type.type] ?? { icon: Leaf, time: '', desc: '' };
                  const isSelected = selectedType === type.type;
                  const soldOut = type.availableSeats === 0;

                  return (
                    <motion.button
                      key={type.type}
                      whileTap={!soldOut ? { scale: 0.99 } : {}}
                      disabled={soldOut}
                      onClick={() => setSelectedType(type.type)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : soldOut
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <meta.icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{type.type}</p>
                              {meta.time && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{meta.time}</p>}
                            </div>
                            {soldOut ? (
                              <span className="text-xs text-red-500 font-medium flex-shrink-0">Sold out</span>
                            ) : (
                              <span className={`text-xs font-medium flex-shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                                {type.availableSeats} seats left
                              </span>
                            )}
                          </div>
                          {meta.desc && <p className="text-xs text-gray-400 mt-1">{meta.desc}</p>}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3 – Available Jeeps */}
        <AnimatePresence>
          {selectedDate && selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Step 3</p>
                <h2 className="font-bold text-gray-900 text-base mt-0.5">Pick Your Seats</h2>
                <p className="text-xs text-gray-400 mt-0.5">You can book multiple seats in the next step</p>
              </div>

              {/* Legend */}
              <div className="px-5 pb-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Taken</span>
              </div>

              <div className="px-4 pb-5 space-y-4">
                {jeepsLoading && (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}

                {!jeepsLoading && (!jeepsData || jeepsData.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No jeeps available for this slot.</p>
                  </div>
                )}

                {jeepsData?.map((jeep: any) => {
                  const taken = jeep.bookings?.filter((b: any) =>
                    ['PAID','CONFIRMED','RESERVED','PAYMENT_PENDING'].includes(b.status)
                  ).length || 0;
                  const avail = jeep.totalSeats - taken;
                  const paidSeats = jeep.paidSeats || 0;
                  const needed = Math.max(0, 4 - paidSeats);

                  return (
                    <div key={jeep.id} className="border border-gray-200 rounded-xl p-4">
                      {/* Jeep header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {formatCurrency(parseFloat(jeep.pricePerSeat))}
                            <span className="font-normal text-gray-400"> / seat</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{avail} of {jeep.totalSeats} seats available</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            jeep.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600 border border-orange-200'
                          }`}>
                            {jeep.status === 'CONFIRMED' ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" />Confirmed</span> : 'Filling up'}
                          </span>
                          {needed > 0 && (
                            <p className="text-xs text-orange-500 mt-1">Need {needed} more to confirm</p>
                          )}
                        </div>
                      </div>

                      {/* Compact seat grid */}
                      <div className="space-y-1.5 mb-4">
                        {(['Front', 'Middle', 'Back'] as const).map((row, ri) => {
                          const nums = ri === 0 ? [1, 2] : ri === 1 ? [3, 4] : [5, 6];
                          return (
                            <div key={row} className="flex items-center gap-2">
                              <span className="text-xs text-gray-300 w-10 flex-shrink-0">{row}</span>
                              <div className="flex gap-1.5">
                                {nums.map((num) => {
                                  const b = jeep.bookings?.find((bk: any) => bk.seatNumber === num);
                                  const isTaken = b && ['PAID','CONFIRMED','RESERVED','PAYMENT_PENDING'].includes(b.status);
                                  return (
                                    <div
                                      key={num}
                                      className={`w-10 h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white ${
                                        isTaken ? 'bg-red-400' : 'bg-green-500'
                                      }`}
                                    >
                                      {num}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => router.push(`/book/${jeep.bookingLinkToken}`)}
                        disabled={avail === 0}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                      >
                        {avail === 0 ? 'Fully Booked' : `Book Now →`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
