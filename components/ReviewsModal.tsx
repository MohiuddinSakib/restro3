'use client';

import React, { useState } from 'react';
import { X, Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { REVIEWS, ReviewItem } from '@/lib/restaurant-data';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewsModal({ isOpen, onClose }: ReviewsModalProps) {
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [quote, setQuote] = useState('');
  const [title, setTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !quote) return;
    const newRev: ReviewItem = {
      id: 'rev-' + Date.now(),
      author,
      source: source || 'Verified Diner',
      rating: 5,
      date: 'Just now',
      title: title || 'An unforgettable experience',
      quote,
      badge: 'Guest Story',
    };
    setReviewsList([newRev, ...reviewsList]);
    setSubmitted(true);
    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
      setAuthor('');
      setSource('');
      setTitle('');
      setQuote('');
    }, 1500);
  };

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
          Critic Citations &amp; Patron Memoirs
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mt-1 mb-2">
          Guest Stories &amp; Reviews
        </h2>
        <p className="text-xs sm:text-sm text-[#675B4C] mb-6">
          Words from Michelin inspectors, international culinary journalists, and cherished patrons.
        </p>

        {/* Action to share a story */}
        <div className="flex items-center justify-between bg-[#EBE3D3] p-4 rounded-2xl mb-6 border border-[#DDD3C0]">
          <div>
            <h4 className="font-serif text-base text-[#201A15] font-medium">Dined with us recently?</h4>
            <p className="text-xs text-[#6B5E4F]">We invite your reflections on your culinary journey.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-full bg-[#1F1A14] text-[#FAF8F5] text-xs font-semibold tracking-wider hover:bg-[#383027] transition-all cursor-pointer shrink-0"
          >
            {showForm ? 'View Reviews' : 'Leave A Story'}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="bg-[#EAE2D2] p-5 rounded-2xl mb-6 border border-[#DDD3C2] space-y-4">
            {submitted ? (
              <div className="text-center py-6 text-emerald-800 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                <span className="font-medium text-sm">Thank you. Your guest reflection has been preserved.</span>
              </div>
            ) : (
              <>
                <h4 className="font-serif text-lg text-[#201A15]">Your Gastronomic Memoir</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Charlotte & Marc"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#DDD3C0] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                      City / Association
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gastronome from Geneva"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#DDD3C0] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                    Story Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A mesmerizing evening in Paris"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#DDD3C0] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                    Your Experience & Reflections
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the dishes, ambiance, or pairing highlights..."
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#DDD3C0] text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-[#655848] hover:bg-[#DDD3C2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#1F1A14] text-[#FAF8F5] text-xs font-semibold tracking-wider hover:bg-[#383027] transition-all"
                  >
                    Submit Story
                  </button>
                </div>
              </>
            )}
          </form>
        ) : null}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviewsList.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-[#EBE3D3] border border-[#DDD3C0] hover:border-[#8C7A65] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-[#C19A6B]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                {rev.badge && (
                  <span className="text-[10px] font-semibold tracking-wider uppercase bg-[#DFD6C4] px-2 py-0.5 rounded text-[#594B3B]">
                    {rev.badge}
                  </span>
                )}
              </div>

              <h4 className="font-serif text-lg text-[#201A15] font-medium mb-1">
                {rev.title}
              </h4>
              <p className="text-xs text-[#524536] leading-relaxed italic mb-3">
                &ldquo;{rev.quote}&rdquo;
              </p>

              <div className="flex items-center justify-between text-[11px] text-[#7A6C5A] border-t border-[#DDD3C0]/80 pt-2">
                <span className="font-medium text-[#382E23]">{rev.author}</span>
                <span>{rev.source} • {rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
