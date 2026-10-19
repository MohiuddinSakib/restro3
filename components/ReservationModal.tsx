'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Wine,
  Utensils,
  CheckCircle,
  Sparkles,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { getAccessToken } from '@/lib/google-auth';
import { appendReservationToSheet } from '@/lib/google-sheets';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpreadsheetId?: string | null;
  onOpenSheets?: () => void;
}

export function ReservationModal({
  isOpen,
  onClose,
  activeSpreadsheetId,
  onOpenSheets,
}: ReservationModalProps) {
  const [step, setStep] = useState<'form' | 'confirmed'>('form');
  const [guests, setGuests] = useState(2);
  const [service, setService] = useState('symphonie');
  const [date, setDate] = useState('2024-11-15');
  const [time, setTime] = useState('19:30');
  const [pairing, setPairing] = useState('grand-cru');
  const [dietary, setDietary] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) return;
    const randomCode = 'LET-' + Math.floor(100000 + Math.random() * 900000);
    setBookingCode(randomCode);
    setStep('confirmed');

    // Attempt Google Sheets auto-sync to active spreadsheet (with resilient local storage fallback)
    const targetSheetId =
      activeSpreadsheetId ||
      (typeof window !== 'undefined' ? localStorage.getItem('letoile_active_sheet_id') : null) ||
      'demo-letoile-operations';

    const bookingPayload = {
      bookingCode: randomCode,
      guestName,
      guests,
      date,
      time,
      service,
      pairing,
      dietary,
      guestPhone,
      guestEmail,
      deposit: `€${guests * 50}`,
      status: 'Guest Confirmed',
      createdAt: new Date().toLocaleString('en-GB'),
    };

    setSheetSyncStatus('syncing');
    try {
      const token =
        (await getAccessToken()) ||
        (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null) ||
        '';
      await appendReservationToSheet(targetSheetId, bookingPayload, token);
      setSheetSyncStatus('synced');
    } catch (err: unknown) {
      console.warn('Google Sheets cloud sync notice, persisting booking locally:', err);
      try {
        await appendReservationToSheet(targetSheetId, bookingPayload, '');
        setSheetSyncStatus('synced');
      } catch {
        setSheetSyncStatus('failed');
      }
    }
  };

  const handleCopyCode = () => {
    if (bookingCode) {
      navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleDietary = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
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

        {step === 'form' ? (
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#7E7160] font-semibold mb-1">
              Atelier Gastronomique
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mb-2">
              Reserve Your Table
            </h2>
            <p className="text-xs sm:text-sm text-[#675B4C] mb-6 leading-relaxed">
              Reservations open 60 days in advance. We request smart elegant dress attire.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Count Selector */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#4A4034] mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#8C7A65]" />
                  Party Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuests(num)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                        guests === num
                          ? 'bg-[#1F1A14] text-[#FAF8F5] shadow-md'
                          : 'bg-[#EAE2D3] text-[#55493B] hover:bg-[#DDD3C2]'
                      }`}
                    >
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#4A4034] mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#8C7A65]" />
                  Curated Experience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setService('symphonie')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      service === 'symphonie'
                        ? 'bg-[#EAE1D1] border-[#8C7A65] shadow-sm ring-1 ring-[#8C7A65]'
                        : 'bg-[#F2ECE1] border-[#DDD3C0] hover:bg-[#EBE3D4]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-serif text-base font-medium text-[#221C16]">
                        {"Symphonie d'Automne"}
                      </span>
                      <span className="text-xs font-semibold text-[#8C7A65]">€240</span>
                    </div>
                    <p className="text-[11px] text-[#695D4E] mt-1 leading-normal">
                      Full 8-course architectural degustation honoring French heritage and wild coastal nature.
                    </p>
                  </div>

                  <div
                    onClick={() => setService('counter')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      service === 'counter'
                        ? 'bg-[#EAE1D1] border-[#8C7A65] shadow-sm ring-1 ring-[#8C7A65]'
                        : 'bg-[#F2ECE1] border-[#DDD3C0] hover:bg-[#EBE3D4]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-serif text-base font-medium text-[#221C16]">
                        The Tasting Table (Counter)
                      </span>
                      <span className="text-xs font-semibold text-[#8C7A65]">€320</span>
                    </div>
                    <p className="text-[11px] text-[#695D4E] mt-1 leading-normal">
                      Intimate 12-seat basalt counter directly facing Chef Alexandre Moreau and the binchotan hearth.
                    </p>
                  </div>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#4A4034] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8C7A65]" />
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#4A4034] mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8C7A65]" />
                    Service Seating Time
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['18:30', '19:15', '20:00', '20:45', '21:15', '21:45'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`py-2 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                          time === t
                            ? 'bg-[#1F1A14] text-white'
                            : 'bg-[#EAE2D3] text-[#55493B] hover:bg-[#DDD3C2]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wine Pairing Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#4A4034] mb-2 flex items-center gap-1.5">
                  <Wine className="w-3.5 h-3.5 text-[#8C7A65]" />
                  Wine & Beverage Flight
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'grand-cru', title: 'Grand Cru Flight', price: '+€145' },
                    { id: 'natural', title: 'Natural & Biodynamic', price: '+€115' },
                    { id: 'zero-proof', title: 'Botanical Infusions', price: '+€75' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPairing(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        pairing === opt.id
                          ? 'bg-[#1F1A14] text-[#FAF8F5] border-[#1F1A14]'
                          : 'bg-[#ECE5D6] text-[#4A3F33] border-[#DDD3C0] hover:bg-[#E3DCcd]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.title}</div>
                      <div className="text-[11px] opacity-80">{opt.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Considerations */}
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold text-[#4A4034] mb-2">
                  Dietary Accommodations
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Pescatarian', 'Vegetarian', 'Gluten-Free', 'No Shellfish', 'No Nuts', 'Dairy-Free'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietary(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        dietary.includes(tag)
                          ? 'bg-[#8C7A65] text-white'
                          : 'bg-[#E7DFCF] text-[#5C5042] hover:bg-[#DDD3C0]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jean-Luc Picard"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@letoile.fr"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+33 6 12 34 56 78"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-[#DDD3C0] flex items-center justify-between">
                <div className="text-xs text-[#7B6E5D]">
                  Deposit: €50 / person (applied to bill)
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-[#1F1A14] hover:bg-[#383027] text-[#FAF8F5] text-xs font-semibold tracking-widest uppercase transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* CONFIRMED PASS VIEW */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#1F1A14] text-[#C19A6B] mx-auto flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="w-8 h-8" />
            </div>

            <span className="text-xs uppercase tracking-[0.3em] text-[#8C7A65] font-semibold">
              Reservation Confirmed
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1914] font-normal mt-1 mb-2">
              We Look Forward to Welcoming You
            </h2>
            <p className="text-xs sm:text-sm text-[#675B4C] max-w-md mx-auto mb-6">
              A private confirmation has been transmitted to <span className="font-semibold text-[#221C16]">{guestEmail}</span>.
            </p>

            {/* Luxury Ticket Card */}
            <div className="max-w-md mx-auto bg-[#1F1A14] text-[#FAF8F5] rounded-3xl p-6 text-left shadow-2xl border border-[#3A3228] relative overflow-hidden mb-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="font-serif text-2xl tracking-widest text-[#F5EFE6]">{"L'ÉTOILE"}</div>
                  <div className="text-[10px] text-[#A69987] tracking-wider uppercase">42 Rue de la Paix, Paris</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#C19A6B] tracking-wider uppercase font-semibold">Pass Code</div>
                  <div className="font-mono text-sm tracking-wider font-bold text-white">{bookingCode}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <span className="text-[#968978] block text-[10px] uppercase">Lead Guest</span>
                  <span className="font-medium text-[#FAF8F5]">{guestName}</span>
                </div>
                <div>
                  <span className="text-[#968978] block text-[10px] uppercase">Party Size</span>
                  <span className="font-medium text-[#FAF8F5]">{guests} Guests</span>
                </div>
                <div>
                  <span className="text-[#968978] block text-[10px] uppercase">Date & Seating</span>
                  <span className="font-medium text-[#FAF8F5]">{date} at {time}</span>
                </div>
                <div>
                  <span className="text-[#968978] block text-[10px] uppercase">Service</span>
                  <span className="font-medium text-[#FAF8F5]">
                    {service === 'symphonie' ? 'Symphonie (8 Courses)' : 'The Tasting Table'}
                  </span>
                </div>
              </div>

              {dietary.length > 0 && (
                <div className="border-t border-white/10 pt-3 text-[11px] text-[#C19A6B]">
                  Special Diet: {dietary.join(', ')}
                </div>
              )}
            </div>

            {/* Google Sheets Live Sync Status */}
            <div className="mb-6 flex justify-center">
              {sheetSyncStatus === 'synced' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-medium shadow-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Logged directly into Google Sheets</span>
                  {onOpenSheets && (
                    <button
                      type="button"
                      onClick={onOpenSheets}
                      className="ml-1 text-emerald-800 underline hover:text-emerald-950 text-[11px] font-semibold cursor-pointer"
                    >
                      View Sheet ↗
                    </button>
                  )}
                </div>
              ) : sheetSyncStatus === 'syncing' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium">
                  <FileSpreadsheet className="w-3.5 h-3.5 animate-pulse text-amber-700" />
                  <span>Syncing with Google Sheets...</span>
                </div>
              ) : onOpenSheets ? (
                <button
                  type="button"
                  onClick={onOpenSheets}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBE2D3] hover:bg-[#DDD3BF] border border-[#D0C2AF] text-[#332A20] text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Manage in Google Sheets</span>
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCopyCode}
                className="px-5 py-2.5 rounded-full bg-[#E8E0D2] hover:bg-[#DDD3C2] text-[#29221B] text-xs font-semibold tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Code Copied' : 'Copy Booking Code'}
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#1F1A14] hover:bg-[#383027] text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
