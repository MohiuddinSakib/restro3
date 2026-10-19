'use client';

import React, { useState } from 'react';
import { X, Wine, Search, Sparkles } from 'lucide-react';
import { CELLAR_WINES } from '@/lib/restaurant-data';

interface CellarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export function CellarModal({ isOpen, onClose, onOpenBooking }: CellarModalProps) {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const categories = ['All', 'Champagne', 'White Burgundy', 'Red Bordeaux', 'Jura & Natural', 'Rare Reserve'];

  const filteredWines = CELLAR_WINES.filter((w) => {
    const matchesFilter = filter === 'All' || w.type === filter;
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.producer.toLowerCase().includes(search.toLowerCase()) ||
      w.region.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#F4EFE6] text-[#221E19] rounded-2xl sm:rounded-3xl border border-[#D8CEBC] shadow-2xl p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E5DCcb] hover:bg-[#D5CCBA] text-[#332A21] flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span className="text-xs uppercase tracking-[0.25em] text-[#7E7160] font-semibold">
          Grand Sommelier Selection
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mt-1 mb-2">
          Cellar Reserves
        </h2>
        <p className="text-xs sm:text-sm text-[#675B4C] mb-6">
          Over 1,400 curated references focusing on organic, biodynamic, and century-old iconic French estates.
        </p>

        {/* Search & Filter Header */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A6E5E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vintage, producer or terroir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs placeholder-[#8E806E] focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filter === cat
                    ? 'bg-[#1F1A14] text-white shadow-sm'
                    : 'bg-[#E7DFD0] text-[#554A3B] hover:bg-[#DCD3C2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Wine List */}
        <div className="space-y-3 mb-6">
          {filteredWines.map((wine) => (
            <div
              key={wine.id}
              className="p-4 rounded-2xl bg-[#EBE3D3] border border-[#DDD3C0] hover:border-[#8C7A65] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-medium text-[#221C16]">
                      {wine.name}
                    </span>
                    <span className="bg-[#DFD6C4] text-[#554839] text-[10px] px-2 py-0.5 rounded font-mono">
                      {wine.vintage}
                    </span>
                  </div>
                  <div className="text-xs text-[#736554] mt-0.5">
                    {wine.producer} • {wine.region}
                  </div>
                </div>

                <div className="text-right sm:shrink-0">
                  <div className="text-sm font-semibold text-[#1F1A14]">{wine.pricePerBottle}</div>
                  <div className="text-[10px] text-[#7A6C5B] uppercase tracking-wider">{wine.type}</div>
                </div>
              </div>

              <p className="text-xs text-[#5E5142] italic mt-2.5 pt-2 border-t border-[#DDD3C0]/80">
                &ldquo;{wine.notes}&rdquo;
              </p>
            </div>
          ))}

          {filteredWines.length === 0 && (
            <div className="text-center py-10 text-xs text-[#7A6C5B]">
              No wines match your criteria. Head Sommelier Matthieu Laurent is available for tailored requests.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#DFD6C7]">
          <div className="text-xs text-[#6F6250]">
            Bespoke pairing consultations available with every tasting reservation.
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="px-6 py-2.5 rounded-full bg-[#1F1A14] hover:bg-[#383027] text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            Reserve Pairing Experience
          </button>
        </div>
      </div>
    </div>
  );
}
