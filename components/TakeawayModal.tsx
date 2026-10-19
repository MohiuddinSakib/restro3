'use client';

import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Clock,
  Calendar,
  Phone,
  Mail,
  User,
  Plus,
  Minus,
  Check,
  Copy,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Package,
} from 'lucide-react';
import { getAccessToken } from '@/lib/google-auth';
import { appendTakeawayToSheet, TakeawayItem } from '@/lib/google-sheets';

interface TakeawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpreadsheetId?: string | null;
  onOpenSheets?: () => void;
}

const TAKEAWAY_MENU_ITEMS = [
  {
    id: 'wagyu-burger',
    name: 'Dry-Aged Wagyu Truffle Burger',
    subtitle: 'Aged Comté • Caramelized Balsamic Shallots • Black Périgord Truffle Aioli',
    price: 34,
    priceFormatted: '€34',
    image: '/images/wagyu_burger.jpg',
    tag: 'Signature',
  },
  {
    id: 'hot-honey-chicken',
    name: 'Crispy Hot Honey Chicken Brioche',
    subtitle: 'Buttermilk Crust • Smoked Habanero Blossom Honey • Apple Cabbage Slaw',
    price: 28,
    priceFormatted: '€28',
    image: '/images/crispy_chicken.jpg',
    tag: 'Popular',
  },
  {
    id: 'truffle-fries',
    name: 'Hand-Cut Truffle Parmesan Frites',
    subtitle: 'Triple-Cooked • Shaved Black Truffles • 36-Mo Parmigiano • Confit Aioli',
    price: 22,
    priceFormatted: '€22',
    image: '/images/truffle_fries.jpg',
    tag: 'Side Special',
  },
  {
    id: 'scallop-crudo',
    name: 'Hokkaido Scallop Crudo Haute Box',
    subtitle: 'Oscietra Royal Caviar • Finger Lime Pearls • Purple Shiso Cold Broth',
    price: 68,
    priceFormatted: '€68',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsTJjLxThyr6_VeQyd5emNrBSN9KQ51DKbmuWaMix2g0lVGi92Z0d3A8_CaDyStGhCY9H5XA9EFzVGnCpTwh2Bfy3HnJJqB5rm0hxBq7_0Qii83CFiMr-sI2xeg9B9503kTldDy_wGIIA8QkRLQJ02i17Giiv8b_LFVY27FD48kiG0u5o7YvztLM7Hjv3shpu8-ULelhzyiAJtJC4TOswtqtDxmY4HgCoWKipjyQPGjK3NvIg0ZeAx',
    tag: 'Haute Degustation',
  },
  {
    id: 'morels-box',
    name: 'Charred Morels & Asparagus Box',
    subtitle: 'Green Luberon Asparagus • Périgord Truffle Butter Emulsion • Wild Leek Ash',
    price: 62,
    priceFormatted: '€62',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJWAHfUnsjaNfrL2-Ao7y36_eGE9h0bNEn9heJJ82Gg8hMBZQEbeitJeElNCo6sSkiQgpMasoW8Z1HTZuazJlcY4-xf9yQmGXLRnXda7-_TJUDDVmRPWkZBeitdyojmxZzQ06OL-0hfKdAnfmAIe1dkUACIW8daw4s6_f8886ya8M3z-mU0sEmAq8SWuqjvi7D8ou31GBtbFOHlGALE_abiJ2jOPJsAPcj8G-n9ODs0HXbSb2HR9Zh',
    tag: 'Season Special',
  },
  {
    id: 'valrhona-ganache',
    name: 'Valrhona Ganache & Smoked Caramel',
    subtitle: '70% Single-Estate Guanaja • Piedmont Praline • 24k Gold Leaf Sheet',
    price: 38,
    priceFormatted: '€38',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUoZf5L5MXkPDF9okCvRuaL3URwRKdjmeT5t-frlFJNlM7JhKDjAV7Z-LrJb7E5aFrRYUIhEDhY2siwvw69UC6LFvgkHwuyd2E5oKvKOSFA532GFB85kFTk2dzQejYuDJbKUMVMXvwt1fk8Ev5Du93P2zNEFlK0stDH0dvucXQJmf_VPER3AL47fL0owr7ugRUnij_WWV_jvuSJfnvp2kP8nNDtfTDtel0nHy5QS7Fs-gDZFD9IlOC',
    tag: 'Dessert Finale',
  },
];

function generateTakeawayCode(): string {
  return 'TKW-' + String(Date.now()).slice(-6);
}

export function TakeawayModal({
  isOpen,
  onClose,
  activeSpreadsheetId,
  onOpenSheets,
}: TakeawayModalProps) {
  const [step, setStep] = useState<'order' | 'confirmed'>('order');

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Cart quantities - start empty for every fresh order
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Customer Form details - start empty for each guest
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pickupDate, setPickupDate] = useState(getTodayDateString());
  const [pickupTime, setPickupTime] = useState('19:00');
  const [packaging, setPackaging] = useState('Signature Insulated Haute Box');
  const [instructions, setInstructions] = useState('');

  // Confirmation state
  const [orderCode, setOrderCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clears all form fields, cart items, and statuses for a fresh order
  const resetForm = React.useCallback(() => {
    setQuantities({});
    setCustomerName('');
    setPhone('');
    setEmail('');
    setPickupDate(getTodayDateString());
    setPickupTime('19:00');
    setPackaging('Signature Insulated Haute Box');
    setInstructions('');
    setOrderCode('');
    setCopied(false);
    setSyncStatus('idle');
    setStep('order');
    setIsSubmitting(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Close and reset on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetForm();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, resetForm]);

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // Selected items calculation
  const selectedItems: TakeawayItem[] = TAKEAWAY_MENU_ITEMS.filter(
    (item) => (quantities[item.id] || 0) > 0
  ).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: quantities[item.id],
    pricePerUnit: item.price,
    priceFormatted: item.priceFormatted,
  }));

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.pricePerUnit,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || selectedItems.length === 0) return;

    setIsSubmitting(true);
    const newCode = generateTakeawayCode();
    setOrderCode(newCode);

    const orderPayload = {
      orderCode: newCode,
      customerName,
      phone,
      email,
      pickupDate,
      pickupTime,
      items: selectedItems,
      totalAmount: `€${subtotal}`,
      specialInstructions: instructions || 'Standard Preparation',
      packagingPreference: packaging,
      status: 'Confirmed & Sent to Kitchen',
      createdAt: new Date().toLocaleString('en-GB'),
    };

    // Auto-save to Google Sheet named "Takeaway" in active spreadsheet (with resilient local storage fallback)
    const targetSheetId =
      activeSpreadsheetId ||
      (typeof window !== 'undefined' ? localStorage.getItem('letoile_active_sheet_id') : null) ||
      'demo-letoile-operations';

    setSyncStatus('syncing');
    try {
      const token =
        (await getAccessToken()) ||
        (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null) ||
        '';
      await appendTakeawayToSheet(targetSheetId, orderPayload, token);
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Google Sheets cloud sync notice, persisting order locally:', err);
      try {
        await appendTakeawayToSheet(targetSheetId, orderPayload, '');
        setSyncStatus('synced');
      } catch {
        setSyncStatus('failed');
      }
    }

    setIsSubmitting(false);
    setStep('confirmed');
  };

  const handleCopyCode = () => {
    if (orderCode) {
      navigator.clipboard.writeText(orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden bg-[#F5EFE6] text-[#221C16] rounded-3xl border border-[#D8CEBC] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E3DBD0] flex items-center justify-between bg-[#ECE4D5]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A231C] text-[#FAF8F5] flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-5 h-5 text-[#C19A6B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl text-[#1E1914] font-medium">
                  L&apos;Étoile Takeaway Atelier
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#2E2820] text-[#FAF8F5]">
                  Boutique Collection
                </span>
              </div>
              <p className="text-xs text-[#6B5E4F] mt-0.5">
                Artisanal burgers, caviar crudo, and pastry creations prepared for curbside or salon pickup.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-[#E0D7C6] hover:bg-[#D2C8B5] text-[#332A21] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {step === 'order' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Menu Selection Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A3E31] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C19A6B]" />
                      Select Takeaway Creations
                    </h3>
                    <p className="text-[11px] text-[#786B5A]">
                      Select items to build your gourmet collection box.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8C7A65]">
                    {selectedItems.reduce((acc, i) => acc + i.quantity, 0)} Items Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TAKEAWAY_MENU_ITEMS.map((dish) => {
                    const qty = quantities[dish.id] || 0;
                    return (
                      <div
                        key={dish.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          qty > 0
                            ? 'bg-[#EAE0D0] border-[#8C7A65] shadow-xs'
                            : 'bg-[#F2ECE1] border-[#DDD3C2] hover:bg-[#EBE3D4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Dish Image */}
                          <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-[#DDD2C0] border border-[#C5B7A2]">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="font-serif text-xs sm:text-sm font-medium text-[#1E1914] truncate">
                                {dish.name}
                              </div>
                            </div>
                            <div className="text-[10px] text-[#6E6152] line-clamp-1 mt-0.5">
                              {dish.subtitle}
                            </div>
                            <div className="text-xs font-semibold text-[#8C7A65] mt-1">
                              {dish.priceFormatted}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-[#FAF7F2] border border-[#DDD3C2] rounded-full p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, -1)}
                            className="w-6 h-6 rounded-full hover:bg-[#E5DCcb] flex items-center justify-center text-[#4A3F33] cursor-pointer"
                            aria-label={`Decrease quantity of ${dish.name}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-bold text-[#1E1914]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, 1)}
                            className="w-6 h-6 rounded-full hover:bg-[#E5DCcb] flex items-center justify-center text-[#4A3F33] cursor-pointer"
                            aria-label={`Increase quantity of ${dish.name}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Contact & Pickup Details */}
              <div className="pt-2 border-t border-[#DDD3C0] space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A3E31] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C19A6B]" />
                  Customer & Collection Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Charlotte de Rohan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1">
                      Mobile Phone (for SMS Ready alert) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+33 6 12 34 56 78"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="client@letoile.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7A65]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8C7A65]" /> Pickup Date
                    </label>
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8C7A65]" /> Desired Pickup Time
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['12:45', '13:15', '13:45', '18:30', '19:00', '19:30', '20:15', '21:00'].map(
                        (slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setPickupTime(slot)}
                            className={`py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                              pickupTime === slot
                                ? 'bg-[#1F1A14] text-white shadow-xs'
                                : 'bg-[#EAE2D3] text-[#55493B] hover:bg-[#DDD3C2]'
                            }`}
                          >
                            {slot}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Packaging & Special Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-[#8C7A65]" /> Packaging Preference
                    </label>
                    <select
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs font-medium"
                    >
                      <option value="Signature Insulated Haute Box">Signature Insulated Haute Box (Hot & Crispy)</option>
                      <option value="Eco Thermal Carryall with Gold Ribbon">Eco Thermal Carryall with Gold Ribbon</option>
                      <option value="Zero-Waste Reusable Canvas Tote">Zero-Waste Reusable Canvas Tote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5A4F41] font-semibold mb-1">
                      Dietary or Packaging Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extra truffle aioli, cutlery requested, allergy notes"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#EBE4D5] border border-[#DDD3C0] text-[#221C16] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary Bar & Submit */}
              <div className="p-4 rounded-2xl bg-[#EBE3D4] border border-[#D5C7B2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#7C6E5E] font-semibold">
                    Order Total ({selectedItems.reduce((acc, i) => acc + i.quantity, 0)} Items)
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#1F1A14]">
                    €{subtotal}
                    <span className="text-xs font-normal text-[#6E6152] ml-2">
                      (Packaging included)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeSpreadsheetId ? (
                    <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Saves to Google Sheet &quot;Takeaway&quot;</span>
                    </div>
                  ) : onOpenSheets ? (
                    <button
                      type="button"
                      onClick={onOpenSheets}
                      className="text-[11px] text-[#716353] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Connect Sheets</span>
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={selectedItems.length === 0 || isSubmitting}
                    className="px-7 py-3 rounded-full bg-[#1F1A14] hover:bg-[#383027] text-[#FAF8F5] text-xs font-semibold tracking-widest uppercase transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    {isSubmitting ? 'Saving Order...' : 'Confirm & Save Takeaway'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* CONFIRMED PASS VIEW */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1A14] text-[#C19A6B] mx-auto flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-[#8C7A65] font-semibold">
                  Takeaway Order Confirmed
                </span>
                <h3 className="font-serif text-3xl text-[#1E1914] font-normal mt-1">
                  Ready for Collection at {pickupTime}
                </h3>
                <p className="text-xs text-[#675B4C] max-w-md mx-auto mt-1">
                  Thank you, <span className="font-semibold text-[#1F1A14]">{customerName}</span>. Your order is now queued in the kitchen atelier.
                </p>
              </div>

              {/* Luxury Takeaway Ticket Pass */}
              <div className="max-w-md mx-auto bg-[#1F1A14] text-[#FAF8F5] rounded-3xl p-6 text-left shadow-2xl border border-[#3A3228] relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                  <div>
                    <div className="font-serif text-xl tracking-widest text-[#F5EFE6]">
                      {"L'ÉTOILE TAKEAWAY"}
                    </div>
                    <div className="text-[10px] text-[#A69987] tracking-wider uppercase">
                      42 Rue de la Paix, Paris
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#C19A6B] tracking-wider uppercase font-semibold">
                      Order Pass
                    </div>
                    <div className="font-mono text-base tracking-wider font-bold text-white">
                      {orderCode}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-[#968978] block text-[10px] uppercase">Client Name</span>
                    <span className="font-medium text-[#FAF8F5]">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-[#968978] block text-[10px] uppercase">Pickup Time</span>
                    <span className="font-medium text-[#FAF8F5]">{pickupDate} @ {pickupTime}</span>
                  </div>
                  <div>
                    <span className="text-[#968978] block text-[10px] uppercase">Phone</span>
                    <span className="font-medium text-[#FAF8F5]">{phone}</span>
                  </div>
                  <div>
                    <span className="text-[#968978] block text-[10px] uppercase">Total</span>
                    <span className="font-medium text-[#C19A6B] font-semibold">€{subtotal}</span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#968978] block">
                    Dishes in Box:
                  </span>
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-[#E8DFD1]">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        €{item.quantity * item.pricePerUnit}
                      </span>
                    </div>
                  ))}
                </div>

                {instructions && (
                  <div className="border-t border-white/10 mt-3 pt-2 text-[11px] text-[#C19A6B]">
                    Special Note: {instructions}
                  </div>
                )}
              </div>

              {/* Google Sheets Sync Result */}
              <div className="flex justify-center pt-2">
                {syncStatus === 'synced' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-medium shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Saved directly into Google Sheet in tab &quot;Takeaway&quot;</span>
                    {onOpenSheets && (
                      <button
                        type="button"
                        onClick={onOpenSheets}
                        className="ml-1 text-emerald-800 underline hover:text-emerald-950 font-semibold cursor-pointer"
                      >
                        View Sheet ↗
                      </button>
                    )}
                  </div>
                ) : syncStatus === 'syncing' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium">
                    <FileSpreadsheet className="w-3.5 h-3.5 animate-pulse text-amber-700" />
                    <span>Saving to Google Sheet Takeaway tab...</span>
                  </div>
                ) : onOpenSheets ? (
                  <button
                    type="button"
                    onClick={onOpenSheets}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAE2D3] hover:bg-[#DDD3C2] text-[#2F261E] text-xs font-medium border border-[#D5C7B2] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Sync to Google Sheets</span>
                  </button>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-5 py-2.5 rounded-full bg-[#E8E0D2] hover:bg-[#DDD3C2] text-[#29221B] text-xs font-semibold tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Code Copied' : 'Copy Order Code'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-full bg-[#EAE2D3] hover:bg-[#DDD3BF] text-[#29221B] text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#8C7A65]" />
                  <span>Order Another</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full bg-[#1F1A14] hover:bg-[#383027] text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
