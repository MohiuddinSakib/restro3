'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error captured:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#ECE7DC] text-[#221E19] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-[#F4EFE6] rounded-3xl border border-[#D8CEBC] p-8 shadow-xl">
        <h2 className="font-serif text-2xl font-medium text-[#1E1914]">
          Service Temporarily Interrupted
        </h2>
        <p className="text-xs text-[#6B5F50] mt-2 leading-relaxed">
          Our culinary team has encountered a temporary difficulty. Please attempt to refresh the salon view.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-full bg-[#1F1A14] text-[#FAF8F5] text-xs font-semibold tracking-widest uppercase hover:bg-[#383027] transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
