'use client';

import React from 'react';
import { X, MapPin, Navigation, Car, Train, Clock, ShieldCheck } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export function LocationModal({ isOpen, onClose, onOpenBooking }: LocationModalProps) {
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

        <span className="text-xs uppercase tracking-[0.25em] text-[#7E7160] font-semibold">
          Arrival &amp; Access
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mt-1 mb-2">
          {"L'Étoile Atelier Gastronomique"}
        </h2>
        <p className="text-xs sm:text-sm text-[#675B4C] mb-6">
          Nestled along the historic Rue de la Paix, minutes from Place Vendôme and Opéra Garnier.
        </p>

        {/* Map Preview */}
        <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-[#D5C9B7] bg-[#EAE3D5] shadow-inner mb-6">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXabAsX4z-4SupNRkFakwm9aAecBn719L_fbbbqgrfHplJZLMkUMf5dhUMr13D5y7dr-MXEvv9YGZo_6vd5aXC_WQ8JndFYQk8s0wMpBihkifNhos58j8SW7P_XwWwLijZjt8VeAl9N8yDq2wFD9R5YvyispPZGQC--dPdS5E3w6NY_-JQCWEOoAZ-m_tGnj2iUvdaC8HZTuboh35XeT4gSxSuPVT6V-aMDSELwAiXNvSvHuzNpz3H"
            alt="Map location for L'Étoile Atelier"
            className="w-full h-full object-cover filter saturate-[0.75]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#1F1A14] text-[#E8DCC9] flex items-center justify-center shadow-2xl ring-4 ring-white/50">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="bg-[#1F1A14] text-[#FAF8F5] text-xs px-3 py-1 rounded-full font-serif tracking-widest mt-1.5 shadow-md">
                {"L'ÉTOILE PARIS"}
              </span>
            </div>
          </div>
        </div>

        {/* Access Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-[#EAE2D3] p-4 rounded-2xl border border-[#DDD3C2]">
            <Train className="w-5 h-5 text-[#8C7A65] mb-2" />
            <h4 className="font-serif text-base text-[#241E18] font-medium">Métro &amp; Rail</h4>
            <p className="text-xs text-[#695D4E] mt-1 leading-normal">
              Opéra (Lines 3, 7, 8) • Madeleine (Lines 8, 12, 14) • Pyramides (Line 14). 3 minutes walking distance.
            </p>
          </div>

          <div className="bg-[#EAE2D3] p-4 rounded-2xl border border-[#DDD3C2]">
            <Car className="w-5 h-5 text-[#8C7A65] mb-2" />
            <h4 className="font-serif text-base text-[#241E18] font-medium">Private Valet Service</h4>
            <p className="text-xs text-[#695D4E] mt-1 leading-normal">
              Complimentary valet attendants stationed at our porte-cochère starting 30 minutes prior to service.
            </p>
          </div>
        </div>

        {/* Dress code & Protocol */}
        <div className="bg-[#E2DAC8] rounded-2xl p-4 text-xs text-[#524637] leading-relaxed mb-6 border border-[#DDD2BF] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[#29221B]">
            <ShieldCheck className="w-4 h-4 text-[#8C7A65]" />
            Atelier Etiquette &amp; Attire
          </div>
          <p>
            We adhere to a Smart Elegant dress code. Jackets are recommended for gentlemen. Athletic footwear, sportswear, and hats are respectfully discouraged in the main dining salon and at The Tasting Table.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#DFD6C7]">
          <div className="text-xs text-[#6F6352]">
            42 Rue de la Paix, 75002 Paris • +33 (0) 1 42 68 55 00
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="px-6 py-2.5 rounded-full bg-[#1F1A14] text-[#FAF8F5] hover:bg-[#383027] text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            Book Table
          </button>
        </div>
      </div>
    </div>
  );
}
