'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Seat {
  number: number;
  row: 'Front' | 'Middle' | 'Back';
  status: 'available' | 'reserved' | 'paid';
}

interface SeatMapProps {
  seats: Seat[];
  onSelectSeat: (seat: Seat) => void;
  selectedSeat?: number | null;
}

const ROW_SEATS = {
  Front: [1, 2],
  Middle: [3, 4],
  Back: [5, 6],
};

export function SeatMap({ seats, onSelectSeat, selectedSeat }: SeatMapProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(selectedSeat ?? null);

  const getSeat = (num: number) => seats.find((s) => s.number === num);

  const getSeatClasses = (seat: Seat | undefined, isSelected: boolean) => {
    if (!seat) return 'bg-gray-400 cursor-not-allowed';
    if (isSelected) return 'bg-yellow-400 ring-2 ring-yellow-600';
    switch (seat.status) {
      case 'available': return 'bg-green-500 hover:bg-green-400 cursor-pointer active:scale-95';
      case 'reserved': return 'bg-red-500 cursor-not-allowed opacity-80';
      case 'paid': return 'bg-red-700 cursor-not-allowed opacity-80';
      default: return 'bg-gray-400 cursor-not-allowed';
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    setLocalSelected(seat.number);
    onSelectSeat(seat);
  };

  return (
    <div className="max-w-xs mx-auto">
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-3xl p-6 shadow-2xl">
        {/* Windshield */}
        <div className="bg-gray-600 rounded-xl h-10 mb-6 flex items-center justify-center">
          <span className="text-gray-300 text-xs font-medium">DRIVER</span>
        </div>

        {(Object.entries(ROW_SEATS) as [keyof typeof ROW_SEATS, number[]][]).map(([row, seatNums]) => (
          <div key={row} className="mb-5">
            <p className="text-gray-300 text-xs text-center mb-2">{row} Row</p>
            <div className="grid grid-cols-2 gap-3">
              {seatNums.map((num) => {
                const seat = getSeat(num);
                const isSelected = localSelected === num;
                return (
                  <motion.button
                    key={num}
                    whileHover={seat?.status === 'available' ? { scale: 1.05 } : {}}
                    whileTap={seat?.status === 'available' ? { scale: 0.95 } : {}}
                    disabled={!seat || seat.status !== 'available'}
                    onClick={() => seat && handleSeatClick(seat)}
                    className={cn(
                      'h-16 rounded-xl font-semibold text-white transition-all duration-200',
                      getSeatClasses(seat, isSelected)
                    )}
                  >
                    <div className="text-lg font-bold">{num}</div>
                    <div className="text-xs mt-1">Seat {num}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-700 rounded-full" />
          <span>Paid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
