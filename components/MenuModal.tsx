'use client';

import React from 'react';
import { X, Wine, Utensils, Sparkles } from 'lucide-react';
import { FULL_TASTING_MENU } from '@/lib/restaurant-data';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export function MenuModal({ isOpen, onClose, onOpenBooking }: MenuModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#F4EFE6] text-[#221E19] rounded-2xl sm:rounded-3xl border border-[#D8CEBC] shadow-2xl p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E5DCcb] hover:bg-[#D5CCBA] text-[#332A21] flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-[#7E7160] font-semibold">
            Seasonal Degustation
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mt-1">
            {"Symphonie d'Automne"}
          </h2>
          <p className="text-xs text-[#7A6C5B] tracking-wider uppercase mt-1">
            Eight Movements in Harmony • €240 per guest
          </p>
          <div className="w-12 h-0.5 bg-[#8C7A65] mx-auto mt-4" />
        </div>

        {/* Courses list */}
        <div className="space-y-6 mb-8">
          {FULL_TASTING_MENU.map((item) => (
            <div key={item.step} className="group border-b border-[#E1D7C6] pb-5 last:border-b-0">
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-sm font-semibold text-[#8C7A65]">
                    {item.step}.
                  </span>
                  <h4 className="font-serif text-xl text-[#221C16] font-medium group-hover:text-black transition-colors">
                    {item.title}
                  </h4>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#8C7D6B] font-semibold">
                  {item.course}
                </span>
              </div>

              <p className="text-xs text-[#5D5040] leading-relaxed pl-6">
                {item.notes}
              </p>

              <div className="mt-2 pl-6 flex items-center gap-1.5 text-[11px] text-[#7A6A55] italic">
                <Wine className="w-3 h-3 text-[#9C7F59] shrink-0" />
                <span>Pairing: {item.wine}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & CTA */}
        <div className="bg-[#EAE2D2] rounded-2xl p-4 text-xs text-[#5C4F3F] leading-relaxed mb-6 border border-[#DDD3C2]">
          <p>
            * Vegetarian and Pescatarian adaptations are designed with 48 hours notice. Caviar upgrade (Oscietra Imperial 30g +€90) and Alba White Truffle service (+€85) available seasonally.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#7A6D5D]">
            Service duration: Approximately 2h 45m
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="px-6 py-2.5 rounded-full bg-[#1F1A14] text-[#FAF8F5] hover:bg-[#383027] text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            Reserve Degustation
          </button>
        </div>
      </div>
    </div>
  );
}
