'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Wine, Sparkles, ArrowRight } from 'lucide-react';
import type { DishItem } from '@/lib/restaurant-data';

interface SerialMenuShowcaseProps {
  dishes: DishItem[];
  onSelectDish: (dish: DishItem) => void;
  onOpenMenu: () => void;
}

export function SerialMenuShowcase({
  dishes,
  onSelectDish,
  onOpenMenu,
}: SerialMenuShowcaseProps) {
  return (
    <div className="w-full space-y-6 sm:space-y-8" data-purpose="serial-menu-showcase">
      {/* Header bar: Title and Full Tasting Menu action with smooth reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E3DBD0] pb-4"
      >
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#221C16] font-normal tracking-wide">
            Our Menu
          </h2>
          <p className="text-xs text-[#7A6D5E] mt-1">
            Crafted to unfold in sensory harmony.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenMenu}
            className="text-xs uppercase tracking-[0.18em] text-[#554737] hover:text-[#1F1A14] font-semibold transition-colors inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EAE2D3] hover:bg-[#DFD5C4] active:scale-95 cursor-pointer"
          >
            <span>Full Tasting Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Serial Cards with Staggered Scroll-Reveal Effect:
          - In MOBILE view: listed serially up to down (flex flex-col gap-6)
          - In TABLET / DESKTOP view: listed serially side by side (sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6)
      */}
      <div className="flex flex-col gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {dishes.map((dish, index) => {
          return (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                duration: 0.6,
                delay: (index % 3) * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{
                y: -6,
                transition: { duration: 0.25, ease: 'easeOut' },
              }}
              onClick={() => onSelectDish(dish)}
              role="button"
              tabIndex={0}
              aria-label={`View ${dish.name} details`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDish(dish);
                }
              }}
              className="relative overflow-hidden w-full max-w-[360px] xs:max-w-[400px] sm:max-w-none mx-auto bg-[#EAE2D3] hover:bg-[#E3D8C6] p-5 rounded-2xl group cursor-pointer transition-colors duration-300 flex flex-col justify-between"
            >
              {/* Card light sheen reflection sweeping across smoothly on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

              <div>
                {/* Dish Plating Image with smooth reveal container */}
                <div className="aspect-square w-full rounded-xl overflow-hidden relative bg-[#F1ECE1]">
                  <img
                    alt={dish.name}
                    src={dish.image}
                    className="w-full h-full object-cover transform scale-100 group-hover:scale-108 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Subtle reveal badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[#FAF8F5] text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#C19A6B]" />
                    <span>View Course</span>
                  </div>
                </div>

                {/* Dish Name & Subtitle */}
                <div className="mt-4 text-center">
                  <h3 className="font-serif text-xl sm:text-lg lg:text-xl font-medium text-[#29221B] group-hover:text-black transition-colors duration-300 leading-snug">
                    {dish.name}
                  </h3>
                  <p className="text-xs sm:text-[11px] text-[#776B5B] uppercase tracking-wider mt-1.5 group-hover:text-[#4F4135] transition-colors line-clamp-1">
                    {dish.subtitle}
                  </p>
                </div>
              </div>

              {/* Wine Pairing & Price */}
              <div className="mt-4 pt-1 flex items-center justify-between text-xs sm:text-[11px] text-[#6E6152]">
                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <Wine className="w-3.5 h-3.5 text-[#C19A6B] shrink-0" />
                  <span className="truncate italic">{dish.pairing.wine}</span>
                </div>
                <span className="font-mono text-[11px] sm:text-[10px] text-[#4F4437] font-semibold shrink-0">
                  {dish.price?.split(' ')[0] || 'Tasting'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
