'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface AvailableDate {
  date: string;
  safariTypes: { type: string; availableSeats: number; status: string }[];
}

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: datesData, isLoading } = useQuery<{ data: AvailableDate[] }>({
    queryKey: ['available-dates'],
    queryFn: () => api.get('/shared-safari/available-dates').then((r) => r.data),
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
                        {d.safariTypes.reduce((s, t) => s + t.availableSeats, 0)} seats left
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

          {/* CTA */}
          {selectedDate && selectedType && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Link
                href={`/book/${encodeURIComponent(selectedDate)}/seats?type=${encodeURIComponent(selectedType)}`}
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
              >
                Select Your Seat →
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
