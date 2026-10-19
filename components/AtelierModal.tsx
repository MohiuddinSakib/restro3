'use client';

import React from 'react';
import { X, Award, Flame, Leaf, Clock } from 'lucide-react';

interface AtelierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export function AtelierModal({ isOpen, onClose, onOpenBooking }: AtelierModalProps) {
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
          The Kitchen Atelier
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mt-1 mb-4">
          Chef Alexandre Moreau
        </h2>

        {/* Hero Chef Image */}
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden mb-6 bg-[#1F1A14]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4TRI5myWEwEFE1e0-Y0LZMU58UGJQ9HjqHwYVggWmJjoXJfroNYIgtedrjvK8byibhmf5vK69lvU5CB1kSLtnZdENIyrFuinH0sANNuClu9dCFoZuBfeMo_FfRKtc_cBGBdR9QGeCPs3A0wxID5CUnboejMYmv_bODX3y0tFHMeI-KPmaYmSvcDyrJKxD8D0Qgbqgb-O-pxZv73IgjrJu9PsWW1r5hSrxCvC2qZB2ppgwLodmkf5n"
            alt="Chef Alexandre Moreau plating at L'Étoile"
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1914]/85 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <span className="font-serif text-base tracking-wide text-[#F3ECE0]">
              Executive Chef &amp; Co-Founder
            </span>
            <span className="bg-[#C19A6B] text-[#1F1A14] font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
              Three Michelin Stars
            </span>
          </div>
        </div>

        {/* Story copy */}
        <div className="space-y-4 text-xs sm:text-sm text-[#4A4034] leading-relaxed mb-6">
          <p>
            {"Born along the rugged Breton coastline and trained at legendary houses in Paris, Kyoto, and Lyon, Chef Alexandre Moreau conceived L'Étoile as an architectural laboratory of flavour."}
          </p>
          <p>
            {'"A plate is not merely sustenance; it is a sculpted narrative of geography, soil acidity, morning tide, and ancestral embers," explains Moreau. "Every course isolates the essence of wild botanical life without superfluous ornamentation."'}
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#EAE2D3] p-4 rounded-2xl border border-[#DDD3C2]">
            <Flame className="w-5 h-5 text-[#8C7A65] mb-2" />
            <h4 className="font-serif text-base text-[#241E18] font-medium">Binchotan Hearth</h4>
            <p className="text-[11px] text-[#695D4E] mt-1 leading-normal">
              High-temperature clean charcoal ember roasting unlocking deep caramelization and wild leek essences.
            </p>
          </div>

          <div className="bg-[#EAE2D3] p-4 rounded-2xl border border-[#DDD3C2]">
            <Leaf className="w-5 h-5 text-[#8C7A65] mb-2" />
            <h4 className="font-serif text-base text-[#241E18] font-medium">Biodynamic Terroir</h4>
            <p className="text-[11px] text-[#695D4E] mt-1 leading-normal">
              Daily harvests sourced from independent family micro-farms in Luberon, Normandy, and Brittany.
            </p>
          </div>

          <div className="bg-[#EAE2D3] p-4 rounded-2xl border border-[#DDD3C2]">
            <Award className="w-5 h-5 text-[#8C7A65] mb-2" />
            <h4 className="font-serif text-base text-[#241E18] font-medium">Sustainable Gastronomy</h4>
            <p className="text-[11px] text-[#695D4E] mt-1 leading-normal">
              Awarded the Green Clover Leaf for zero single-use plastic, whole-animal philosophy, and composting.
            </p>
          </div>
        </div>

        {/* Kitchen Brigade */}
        <div className="bg-[#E2DAC8] rounded-2xl p-4 text-xs text-[#524637] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <span className="font-semibold text-[#29221B]">Brigade Leaders:</span> Éléonore Vasseur (Head Pastry), Matthieu Laurent (Head Sommelier), Kenji Sato (Chef de Cuisine).
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFD6C7]">
          <button
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="px-6 py-2.5 rounded-full bg-[#1F1A14] text-[#FAF8F5] hover:bg-[#383027] text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            Experience The Atelier
          </button>
        </div>
      </div>
    </div>
  );
}
