'use client';

import React from 'react';
import { X, Sparkles, Wine, Compass, CheckCircle2 } from 'lucide-react';
import type { DishItem } from '@/lib/restaurant-data';

interface DishDetailModalProps {
  dish: DishItem | null;
  onClose: () => void;
  onReserve: () => void;
  onTakeaway?: () => void;
}

export function DishDetailModal({ dish, onClose, onReserve, onTakeaway }: DishDetailModalProps) {
  if (!dish) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#F4EFE6] text-[#221E19] rounded-2xl sm:rounded-3xl border border-[#D8CEBC] shadow-2xl p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E5DCcb] hover:bg-[#D5CCBA] text-[#332A21] flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-[#7E7160] mb-2 font-medium">
          <span>{dish.category}</span>
          <span>•</span>
          <span>Course {dish.courseNumber}</span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal leading-tight">
          {dish.name}
        </h2>
        <p className="text-xs sm:text-sm text-[#7D705E] uppercase tracking-wider mt-1 mb-6">
          {dish.subtitle}
        </p>

        {/* Dish Presentation Image */}
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-inner bg-[#EBE5D8] mb-6">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-3 left-3 bg-[#1F1A14]/85 backdrop-blur-sm text-[#F5EFE6] text-[11px] px-3 py-1 rounded-full font-serif tracking-wider">
            {dish.origin}
          </div>
          {dish.price && (
            <div className="absolute top-3 right-3 bg-[#FAF8F5]/90 backdrop-blur-sm text-[#221C16] text-xs font-semibold px-3 py-1 rounded-full border border-[#D5C9B7]">
              {dish.price}
            </div>
          )}
        </div>

        {/* Narrative Description */}
        <div className="space-y-4 mb-6">
          <p className="text-sm leading-relaxed text-[#4A4034]">
            {dish.description}
          </p>
        </div>

        {/* Sourced Ingredients Grid */}
        <div className="bg-[#EBE4D5] rounded-2xl p-4 sm:p-5 mb-6 border border-[#DDD3C0]">
          <h4 className="font-serif text-lg text-[#201A15] mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#8C7A65]" />
            Heritage Ingredients & Botanical Origins
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5C5042]">
            {dish.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A38255] shrink-0" />
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sommelier Pairing Highlight */}
        <div className="bg-[#1F1A14] text-[#FAF8F5] rounded-2xl p-5 mb-6 shadow-md border border-[#3A3228]">
          <div className="flex items-center gap-2 text-xs text-[#C19A6B] uppercase tracking-wider font-semibold mb-1">
            <Wine className="w-4 h-4" />
            Curated Sommelier Pairing
          </div>
          <div className="font-serif text-xl text-[#F8F4EC] mt-1">
            {dish.pairing.wine} <span className="text-[#C19A6B]">({dish.pairing.vintage})</span>
          </div>
          <div className="text-xs text-[#BCB0A0] mt-0.5">
            {dish.pairing.producer} • {dish.pairing.region}
          </div>
          <p className="text-xs text-[#DDD2C2] mt-3 leading-relaxed italic border-t border-white/10 pt-2.5">
            &ldquo;{dish.pairing.tastingNotes}&rdquo;
          </p>
        </div>

        {/* Dietary info & Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#DFD6C7]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#786C5B]">
            <span className="font-medium text-[#40362B]">Dietary profile:</span>
            {dish.dietary.map((d, i) => (
              <span key={i} className="bg-[#E4DBCB] px-2.5 py-0.5 rounded-full text-[11px] text-[#44382C]">
                {d}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {onTakeaway && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTakeaway();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#E5DCCB] text-[#1F1A14] hover:bg-[#D8CEBC] text-xs font-semibold tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Order Takeaway
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onReserve();
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1F1A14] text-[#FAF8F5] hover:bg-[#383027] text-xs font-semibold tracking-wider transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Book Tasting Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
