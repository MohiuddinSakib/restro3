'use client';

import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  initialIndex?: number;
  onClose: () => void;
  onOpenBooking: () => void;
}

const GALLERY_PHOTOS = [
  {
    title: 'The Tasting Table',
    caption: 'Twelve-seat intimate basalt stone counter facing the binchotan hearth.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm_F8GT_y-pZMb-m_IoE2MNAfZo0pShbzfkbmV53BeV2MKvH2U7CsVYRH0cLf3pol3e1GQCGPmMiUluGgtYKZqdmL-5EWQdGL2sqzENso_yd2ZEN_cqjx9BwnZ5PbFIcdaQQxFDrUN9a34XHZz9kvMmZKAlhV1zuw5JWvQsoor5CutH8yp97EYn77MspEGE6LVDXp6rgBKEkAQNyXYTAOPWMtsSF6RbVM6GbJA3YRIGUcKckyYYGJc',
  },
  {
    title: 'Amuse-Bouche & Coastal Delicacies',
    caption: 'Crisp seaweed tuiles with smoked eel mousse and cured sea broth.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJfV1b0n63xPYWRkjuFlRNU0_3qla259BYULyzajV_6fNIBGx_6GMQ7p0Rzod6zWV6CLo09ie6_yMSKwPXsJPWmPfw5PKOzYktZPIJrynEFu4CZEh4Egn3ZUckE44ljr4wfmPIrWSYy2-l5MqeLQnieUQgk9qkPj98uu4KomsIh1KZlseoKYD7hpkw-rxM2e5XmN7eJ0NANWTn7qzkrmin2gJuDNb6HC9SNIv5IDS9FCSk7lSbIRC_',
  },
  {
    title: 'The Finale Architecture',
    caption: 'Valrhona single-origin cacao orb receiving warm smoked Guérande caramel.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFYe8e27w9DFls_l-i5TKujtOKAC_lXwAu-jxjSlQUonIiAQzTsgWbotEgO3bXR9_r9qp1mJG1kCodWUaHZI0ckQQIYCk-NleMsb6lMu24KDLkAJLv1D2N9UZTJQiaKD2lsJxfeTdZhoHv108PnQSJiirVeCqY05FIs7KkaEP9Q1IUmdqLJkhUPJbLF9H8tetKqM4x6vkIxry0YNb-WNfRIiTUxcPAyjYPyg7xhTewKnH8RMRuC4i1',
  },
  {
    title: 'Candlelit Evening Intimacy',
    caption: 'Travertine walls, hand-spun linen drapery, and warm acoustic intimacy.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlk9e-E_idyC7lqb_DrGFHlNLf8rTVdpQtWF9a2TYverDRyw2f60tF8Cxd1f775SYssVWWEScF8i1Xtvmnm-jbPKlIQrOTfS6m6o_jGbYfwl4ePXhz6WQ78rxviziqCosNew_AMykkT0t6ZnLPGDJZVXQZKEIAIh-AM6NVpcZmu6Tqv_91ousnBaoua1AaV-wU03X-DGisL7o1Yw7MzLrRVYQob2tQVaVnf21DR19NgD1JjwsYa01K',
  },
];

export function GalleryModal({ isOpen, initialIndex = 0, onClose, onOpenBooking }: GalleryModalProps) {
  const [index, setIndex] = useState(initialIndex);

  if (!isOpen) return null;

  const current = GALLERY_PHOTOS[index];

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? GALLERY_PHOTOS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev === GALLERY_PHOTOS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-4xl max-h-[94vh] overflow-hidden bg-[#181410] text-[#FAF8F5] rounded-2xl sm:rounded-3xl border border-[#3D3328] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C19A6B]">
              Atelier Photography
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#FAF8F5]">
              {current.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Display */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[480px] bg-black flex items-center justify-center overflow-hidden">
          <img
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover object-center max-h-[520px] transition-all duration-500"
            referrerPolicy="no-referrer"
          />

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Previous photograph"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Next photograph"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="p-4 sm:p-5 bg-[#1F1A14] flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
          <p className="text-xs text-[#D8CEBF] italic">
            &ldquo;{current.caption}&rdquo;
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#9D8F7C]">
              {index + 1} / {GALLERY_PHOTOS.length}
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="px-5 py-2 rounded-full bg-[#C19A6B] hover:bg-[#d4ac7d] text-[#1F1A14] text-xs font-semibold tracking-wider transition-colors cursor-pointer"
            >
              Book This Experience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
