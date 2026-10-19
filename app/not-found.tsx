'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#ECE7DC] text-[#221E19] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-[#F4EFE6] rounded-3xl border border-[#D8CEBC] p-8 shadow-xl">
        <span className="font-serif text-5xl font-light text-[#8C7A65]">404</span>
        <h1 className="font-serif text-2xl font-medium mt-2 text-[#1E1914]">
          Course Not Found
        </h1>
        <p className="text-xs text-[#6B5F50] mt-2 leading-relaxed">
          The requested salon or culinary creation could not be located in our salon archives.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#1F1A14] text-[#FAF8F5] text-xs font-semibold tracking-widest uppercase hover:bg-[#383027] transition-all"
          >
            Return to Salon
          </Link>
        </div>
      </div>
    </div>
  );
}
