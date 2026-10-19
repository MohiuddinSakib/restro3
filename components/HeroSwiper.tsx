'use client';

import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Pagination, Autoplay, Keyboard, A11y } from 'swiper/modules';
import { Hand } from 'lucide-react';
import { HERO_SLIDES } from '@/lib/restaurant-data';

interface HeroSwiperProps {
  onOpenBooking: () => void;
  onOpenMenu: () => void;
}

export function HeroSwiper({ onOpenBooking, onOpenMenu }: HeroSwiperProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  return (
    <section className="mt-3 sm:mt-6 mb-8 sm:mb-16 relative" id="home" aria-label="Fine Dining Showcase">
      {/* Big Hero Showcase Card with grab/grabbing touch cursor and fluid responsive height */}
      <div className="relative w-full h-[380px] sm:h-[480px] md:h-[560px] rounded-2xl sm:rounded-[36px] overflow-hidden group bg-[#15110E] select-none cursor-grab active:cursor-grabbing">
        {/* Ambient Light Shimmer Overlay */}
        <div className="pointer-events-none absolute -inset-[50%] hero-light-shimmer bg-[radial-gradient(ellipse_at_center,rgba(255,230,195,0.18)_0%,transparent_60%)] mix-blend-screen z-10" />

        <div className="hero-swiper-container w-full h-full">
          <Swiper
            modules={[Pagination, Autoplay, Keyboard, A11y]}
            speed={750}
            grabCursor={true}
            simulateTouch={true}
            allowTouchMove={true}
            touchRatio={1.2}
            touchAngle={45}
            resistance={true}
            resistanceRatio={0.85}
            threshold={5}
            autoplay={{
              delay: 5500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            keyboard={{ enabled: true }}
            loop={true}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper;
            }}
            onTouchStart={() => {
              setHasInteracted(true);
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
              setHasInteracted(true);
            }}
            className="w-full h-full"
          >
            {HERO_SLIDES.map((slide) => (
              <SwiperSlide key={slide.id} className="relative w-full h-full select-none">
                {/* Image with subtle Ken-Burns zoom and hover elevation */}
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.titlePrimary + ' ' + slide.titleSecondary}
                    className="w-full h-full object-cover object-center animate-ambient-zoom brightness-[0.88] transition-all duration-1000 ease-out group-hover:brightness-[0.92] group-hover:scale-105 pointer-events-none"
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                  {/* Atmospheric gradient overlay matching original editorial mood */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15110E]/90 via-black/35 to-black/15 transition-opacity duration-700 pointer-events-none" />
                </div>

                {/* Typography Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-10 md:p-12 z-20 pointer-events-none">
                  <span className="text-[#E8DCC9] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[10px] sm:text-xs md:text-sm font-semibold mb-1.5 sm:mb-3 drop-shadow transform transition-all duration-700 group-hover:-translate-y-1">
                    {slide.tagline}
                  </span>
                  <h1 className="font-serif font-normal text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#FAF8F5] tracking-tight leading-[1.08] sm:leading-[1.05] max-w-3xl drop-shadow-lg font-editorial transition-transform duration-700 ease-out group-hover:scale-[1.015]">
                    {slide.titlePrimary} <br />
                    <span className="italic font-light text-[#F6EFE6]">{slide.titleSecondary}</span>
                  </h1>
                  <p className="mt-2.5 sm:mt-4 text-[#D3C8B7] max-w-xs sm:max-w-md text-[11px] sm:text-xs md:text-sm font-light tracking-wide leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-none transition-all duration-700 group-hover:text-[#F3ECE0]">
                    {slide.description}
                  </p>

                  {/* Interactive Quick Links directly below hero */}
                  <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 pointer-events-auto">
                    <button
                      type="button"
                      onClick={onOpenMenu}
                      className="px-4 sm:px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-[#FAF8F5] text-[11px] sm:text-xs font-medium tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      {slide.ctaText}
                    </button>
                    <button
                      type="button"
                      onClick={onOpenBooking}
                      className="px-4 sm:px-5 py-2 rounded-full bg-[#C19A6B] hover:bg-[#d4ac7d] text-[#1F1A14] text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-md cursor-pointer whitespace-nowrap"
                    >
                      Reserve Table
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Subtle swipe affordance hint that gently disappears once swiped */}
        <div
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-30 pointer-events-none transition-opacity duration-700 ${
            hasInteracted ? 'opacity-0' : 'opacity-85 sm:opacity-90'
          }`}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[#EFEBE4] text-[9px] sm:text-[10px] tracking-widest uppercase font-medium shadow-md">
            <Hand className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C19A6B] animate-pulse" />
            <span>Swipe or drag</span>
          </div>
        </div>

        {/* Slide indicator dots at bottom */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => {
                setHasInteracted(true);
                swiperRef.current?.slideToLoop(i);
              }}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                activeIndex === i ? 'w-6 sm:w-7 bg-[#C19A6B]' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
