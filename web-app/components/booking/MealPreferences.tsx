'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const DIETARY_OPTIONS = ['Standard', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'];

interface MealPreferencesProps {
  onUpdate: (data: {
    mealIncluded: boolean;
    mealTypes: string[];
    dietaryReqs: string[];
    allergies: string;
  }) => void;
}

export function MealPreferences({ onUpdate }: MealPreferencesProps) {
  const [mealIncluded, setMealIncluded] = useState(false);
  const [mealTypes, setMealTypes] = useState<string[]>([]);
  const [dietaryReqs, setDietaryReqs] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    const newList = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    setter(newList);
    onUpdate({ mealIncluded, mealTypes: item === 'meal' ? mealTypes : newList, dietaryReqs: item === 'dietary' ? newList : dietaryReqs, allergies });
  };

  const handleMealToggle = (val: boolean) => {
    setMealIncluded(val);
    onUpdate({ mealIncluded: val, mealTypes, dietaryReqs, allergies });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Include meals? (+LKR 500)</p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => handleMealToggle(val)}
              className={cn(
                'flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                mealIncluded === val
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {val ? 'Yes, include meals' : 'No meals'}
            </button>
          ))}
        </div>
      </div>

      {mealIncluded && (
        <>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Select meal types</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleItem(type, mealTypes, setMealTypes)}
                  className={cn(
                    'px-4 py-2 rounded-full border text-sm transition-all',
                    mealTypes.includes(type)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-green-400'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Dietary requirements</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleItem(opt, dietaryReqs, setDietaryReqs)}
                  className={cn(
                    'px-4 py-2 rounded-full border text-sm transition-all',
                    dietaryReqs.includes(opt)
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Allergies / special notes</p>
            <textarea
              rows={2}
              value={allergies}
              onChange={(e) => {
                setAllergies(e.target.value);
                onUpdate({ mealIncluded, mealTypes, dietaryReqs, allergies: e.target.value });
              }}
              placeholder="e.g. nut allergy, lactose intolerant..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </>
      )}
    </div>
  );
}
