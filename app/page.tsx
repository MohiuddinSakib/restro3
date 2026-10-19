'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  ArrowRight,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Sparkles,
  Utensils,
  Wine,
  Calendar,
  Compass,
  Check,
  Menu,
  X,
  Phone,
  Clock,
  FileSpreadsheet,
  ShoppingBag,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronDown,
  Plus,
  FolderOpen,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  ADMIN_EMAIL,
  isAdminUser,
} from '@/lib/google-auth';
import { HeroSwiper } from '@/components/HeroSwiper';
import { DishDetailModal } from '@/components/DishDetailModal';
import { ReservationModal } from '@/components/ReservationModal';
import { AtelierModal } from '@/components/AtelierModal';
import { CellarModal } from '@/components/CellarModal';
import { MenuModal } from '@/components/MenuModal';
import { ReviewsModal } from '@/components/ReviewsModal';
import { GalleryModal } from '@/components/GalleryModal';
import { LocationModal } from '@/components/LocationModal';
import { SerialMenuShowcase } from '@/components/SerialMenuShowcase';
import { GoogleSheetsModal } from '@/components/GoogleSheetsModal';
import { TakeawayModal } from '@/components/TakeawayModal';
import { PEDESTAL_DISHES, DishItem } from '@/lib/restaurant-data';

export default function HomePage() {
  // Modal states
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTakeawayOpen, setIsTakeawayOpen] = useState(false);
  const [isAtelierOpen, setIsAtelierOpen] = useState(false);
  const [isCellarOpen, setIsCellarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('letoile_active_sheet_id') || 'demo-letoile-operations';
      } catch {}
    }
    return 'demo-letoile-operations';
  });
  const [activeSpreadsheetTitle, setActiveSpreadsheetTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('letoile_active_sheet_title') || "L'Étoile Atelier Gastronomique - Live Operations";
      } catch {}
    }
    return "L'Étoile Atelier Gastronomique - Live Operations";
  });
  const [infoDialog, setInfoDialog] = useState<{ title: string; text: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active navigation indicator
  const [activeNav, setActiveNav] = useState('home');

  // User Authentication & Admin status (ADMIN: mdmsakib2242@gmail.com)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAdmin = isAdminUser(currentUser);

  // Sheets options configuration states
  const [sheetsInitialTab, setSheetsInitialTab] = useState<'reservations' | 'takeaway' | 'menu' | 'cellar' | 'drive'>('reservations');
  const [sheetsOpenSelector, setSheetsOpenSelector] = useState(false);
  const [sheetsOpenCreate, setSheetsOpenCreate] = useState(false);
  const [isSheetsNavMenuOpen, setIsSheetsNavMenuOpen] = useState(false);

  const openSheetsWithConfig = (
    tab: 'reservations' | 'takeaway' | 'menu' | 'cellar' | 'drive' = 'reservations',
    openSelector = false,
    openCreate = false
  ) => {
    setSheetsInitialTab(tab);
    setSheetsOpenSelector(openSelector);
    setSheetsOpenCreate(openCreate);
    setIsSheetsOpen(true);
    setIsSheetsNavMenuOpen(false);
    setActiveNav('sheets');
  };

  // Initialize Firebase Auth listener
  React.useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        if (isAdminUser(res.user)) {
          setInfoDialog({
            title: 'Administrator Verified',
            text: `Welcome back, ${res.user.displayName || 'Administrator'} (${res.user.email}). The Sheets option is now unlocked in your navigation.`,
          });
        } else {
          setInfoDialog({
            title: 'Signed In Successfully',
            text: `Welcome, ${res.user.displayName || 'Guest'} (${res.user.email}). Please note that restaurant operational spreadsheets are restricted to the administrator (${ADMIN_EMAIL}).`,
          });
        }
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      if (!msg.includes('closed-by-user') && !msg.includes('popup_closed') && !msg.includes('cancelled')) {
        setInfoDialog({
          title: 'Sign In Notice',
          text: msg,
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    if (activeNav === 'sheets') {
      setActiveNav('home');
    }
    setInfoDialog({
      title: 'Signed Out',
      text: 'You have been signed out successfully.',
    });
  };

  // Scroll spy to dynamically sync activeNav with visible section
  React.useEffect(() => {
    const handleScroll = () => {
      // Do not override if user opened a modal like reservation, contact, or takeaway
      if (isBookingOpen || isLocationOpen || isReviewsOpen || isTakeawayOpen) return;

      const scrollPos = window.scrollY + 220;
      const menuEl = document.getElementById('menu');

      if (menuEl && scrollPos >= menuEl.offsetTop) {
        setActiveNav('menu');
      } else {
        setActiveNav('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isBookingOpen, isLocationOpen, isReviewsOpen, isTakeawayOpen]);

  // Close mobile menu on resize to desktop (>= 1024px)
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on Escape key and manage body overflow
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Static dishes from our curated data
  const scallopDish = PEDESTAL_DISHES[0];
  const morelsDish = PEDESTAL_DISHES[1];
  const ganacheDish = PEDESTAL_DISHES[2];

  return (
    <div className="min-h-screen py-2 sm:py-6 md:py-8 px-2 sm:px-4 md:px-8 max-w-full overflow-x-hidden">
      {/* Outer framed container matching the exact tablet mockup border from the screenshot */}
      <div className="max-w-[1280px] mx-auto px-3.5 sm:px-6 md:px-10 lg:px-12 bg-[#F3EFE6] rounded-2xl sm:rounded-[36px] md:rounded-[48px] shadow-2xl border border-[#DFD8C9] overflow-hidden">
        
        {/* BEGIN: Header (Sticky & Fully Responsive Across All Devices) */}
        <header
          className="sticky top-0 z-40 bg-[#F3EFE6]/95 backdrop-blur-md py-3 sm:py-5 border-b border-[#E3DBD0]/80 transition-all duration-300 -mx-3.5 sm:-mx-6 md:-mx-10 lg:-mx-12 px-3.5 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between"
          data-purpose="main-nav"
        >
          {/* Monogram Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav('home');
              setIsMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="L'ÉTOILE Home"
            className="group flex items-center gap-2 sm:gap-3 transition-transform duration-300 shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border border-[#8C7A65] flex items-center justify-center p-1.5 sm:p-2 text-[#715E49] transition-all duration-500 group-hover:scale-105 group-hover:border-[#524438] group-hover:shadow-[0_4px_16px_rgba(113,94,73,0.18)]">
              {/* Stylized Gastronomy Monogram Emblem */}
              <svg
                className="w-4.5 h-4.5 sm:w-6 sm:h-6 stroke-[1.2] transition-transform duration-700 ease-out group-hover:rotate-45"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 40 40"
              >
                <circle cx="20" cy="20" r="18" strokeDasharray="2 2" />
                <path
                  d="M20 7V33M12 15C12 21 28 21 28 15M14 26C14 29 26 29 26 26"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-serif text-base sm:text-xl md:text-2xl tracking-widest text-[#2D261E] font-medium transition-colors duration-300 group-hover:text-[#15110E] whitespace-nowrap">
              {"L'ÉTOILE"}
            </span>
          </a>

          {/* Desktop Navigation Menu (Active on screens >= 1024px) */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-xs font-semibold tracking-[0.2em]">
            {[
              {
                key: 'home',
                label: 'HOME',
                onClick: () => {
                  setActiveNav('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                },
              },
              {
                key: 'menu',
                label: 'MENU',
                onClick: () => {
                  setActiveNav('menu');
                  const el = document.getElementById('menu');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setIsMenuOpen(true);
                  }
                },
              },
              {
                key: 'contact',
                label: 'CONTACT',
                onClick: () => {
                  setActiveNav('contact');
                  setIsLocationOpen(true);
                },
              },
              ...(isAdmin
                ? [
                    {
                      key: 'sheets',
                      label: 'SHEETS',
                      onClick: () => {
                        setIsSheetsNavMenuOpen(!isSheetsNavMenuOpen);
                      },
                    },
                  ]
                : []),
            ].map((item, idx) => {
              const isActive = activeNav === item.key;
              const isSheetsItem = item.key === 'sheets';

              return (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => {
                    if (isSheetsItem) setIsSheetsNavMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (isSheetsItem) setIsSheetsNavMenuOpen(false);
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (isSheetsItem) {
                        setIsSheetsNavMenuOpen(!isSheetsNavMenuOpen);
                      } else {
                        item.onClick();
                      }
                    }}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.06, duration: 0.3 }}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className={`group relative px-4 xl:px-4.5 py-1.5 rounded-full uppercase cursor-pointer select-none transition-all duration-200 z-10 text-[11px] xl:text-xs font-semibold tracking-[0.2em] flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#1F1710] font-bold'
                        : 'text-[#6A5E50] hover:text-[#1F1710] hover:bg-[#EAE2D3]/40'
                    }`}
                  >
                    {/* Fluid Animated Active Golden Pill Background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeDesktopNavHighlight"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F7F2EB] via-[#ECE2D2] to-[#F7F2EB] border border-[#C19A6B]/55 shadow-[0_2px_14px_rgba(193,154,107,0.25),inset_0_1px_1px_rgba(255,255,255,0.95)] z-0"
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                          mass: 0.8,
                        }}
                      >
                        {/* Glossy Top Glass Rim */}
                        <span className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                        {/* Radiant Golden Baseline Beam */}
                        <span className="absolute inset-x-2.5 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#C19A6B] to-transparent shadow-[0_0_8px_rgba(193,154,107,0.8)]" />
                      </motion.div>
                    )}

                    {/* Active Sparkle Jewel Indicator */}
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        <Sparkles className="w-3 h-3 text-[#B3874B] animate-pulse" />
                      </motion.span>
                    )}

                    <span className="relative z-10 inline-block transition-transform duration-200">
                      {item.label}
                    </span>

                    {/* Dropdown Chevron for Sheets with Options */}
                    {isSheetsItem && (
                      <ChevronDown
                        className={`relative z-10 w-3 h-3 text-[#8C6D37] transition-transform duration-200 ${
                          isSheetsNavMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    )}

                    {/* Soft Hover Underline for Inactive Items */}
                    {!isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] rounded-full bg-[#C19A6B]/40 transition-all duration-300 group-hover:w-1/2" />
                    )}
                  </motion.button>

                  {/* Sheet Options Floating Luxury Dropdown */}
                  {isSheetsItem && isSheetsNavMenuOpen && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-[#FAF7F2] border border-[#D5C7B3] rounded-2xl shadow-2xl p-3 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Active Sheet Header Banner */}
                      <div className="p-2.5 rounded-xl bg-[#EBE2D2] border border-[#DDD3C2] mb-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#8C6D37] uppercase tracking-wider mb-0.5">
                          <span>Active Sheet</span>
                          <span className="flex items-center gap-1 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live Sync
                          </span>
                        </div>
                        <div className="text-xs font-serif font-bold text-[#1F1A14] truncate">
                          {activeSpreadsheetTitle}
                        </div>
                      </div>

                      {/* Primary Sheet Options: Select Sheet & Create Sheet */}
                      <div className="space-y-1 text-xs">
                        {/* 1. SELECT SHEET OPTION */}
                        <button
                          type="button"
                          onClick={() => openSheetsWithConfig('drive', true, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-white/80 hover:bg-[#ECE4D5] text-[#1F1A14] font-semibold transition-colors cursor-pointer border border-[#E3D8C8] group shadow-2xs"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                            <FolderOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="font-bold text-[#1F1A14] flex items-center gap-1.5">
                              <span>Select / Switch Sheet...</span>
                            </div>
                            <div className="text-[10px] text-[#716454] font-normal truncate">
                              Pick from templates or Drive files
                            </div>
                          </div>
                        </button>

                        {/* 2. CREATE NEW SHEET OPTION */}
                        <button
                          type="button"
                          onClick={() => openSheetsWithConfig('drive', false, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-white/80 hover:bg-[#ECE4D5] text-[#1F1A14] font-semibold transition-colors cursor-pointer border border-[#E3D8C8] group shadow-2xs"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#C19A6B]/20 text-[#8C6D37] flex items-center justify-center shrink-0 group-hover:bg-[#C19A6B]/30 transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="font-bold text-[#1F1A14]">Create New Sheet...</div>
                            <div className="text-[10px] text-[#716454] font-normal truncate">
                              Start fresh with all restaurant tabs
                            </div>
                          </div>
                        </button>

                        <div className="h-[1px] bg-[#E8DEC9] my-1" />

                        {/* 3. Reservations Sheet */}
                        <button
                          type="button"
                          onClick={() => openSheetsWithConfig('reservations')}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left hover:bg-[#ECE4D5] text-[#332A21] text-xs transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#8C6D37]" />
                          <span>View Reservations Sheet</span>
                        </button>

                        {/* 4. Takeaway Orders */}
                        <button
                          type="button"
                          onClick={() => openSheetsWithConfig('takeaway')}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left hover:bg-[#ECE4D5] text-[#332A21] text-xs transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#8C6D37]" />
                          <span>View Takeaway Orders</span>
                        </button>

                        {/* 5. Tasting Menu & Cellar */}
                        <button
                          type="button"
                          onClick={() => openSheetsWithConfig('menu')}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left hover:bg-[#ECE4D5] text-[#332A21] text-xs transition-colors cursor-pointer"
                        >
                          <Wine className="w-3.5 h-3.5 text-[#8C6D37]" />
                          <span>Tasting Menu & Cellar</span>
                        </button>

                        <div className="h-[1px] bg-[#E8DEC9] my-1" />

                        {/* 6. External sheets.new link */}
                        <a
                          href="https://sheets.new"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-[#ECE4D5] text-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <span>Open sheets.new in Google</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Book A Table & Google Sheets CTA Buttons & Mobile/Tablet Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Where sheet option was: If not logged in, show Google Icon to sign in; If Admin, show Sheets + Admin Chip; If Non-Admin, show Member Chip only */}
            {!currentUser ? (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                aria-label="Sign in with Google"
                title="Sign in with Google (Admin unlocks Google Sheets)"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full border border-[#8C7A65]/50 bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#2F261E] text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-300 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {isLoggingIn ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#C19A6B] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span className="hidden sm:inline">SIGN IN</span>
              </button>
            ) : isAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Google Sheets Hub CTA - Visible to Admin */}
                <button
                  type="button"
                  onClick={() => openSheetsWithConfig('drive', true)}
                  aria-label="Google Sheets Operations"
                  title={`Google Sheets Operations (Admin: ${currentUser.email})`}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-emerald-800/40 bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-900 text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-300 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                  <span className="hidden sm:inline">SHEETS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                </button>

                {/* Admin Profile Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-label="Admin menu"
                    title={`Admin: ${currentUser.email}`}
                    className="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full border border-[#C19A6B]/50 bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#2F261E] text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Admin"
                        className="w-5 h-5 rounded-full object-cover border border-[#C19A6B]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#C19A6B] text-white flex items-center justify-center text-[10px] font-bold">
                        {(currentUser.email?.[0] || 'A').toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:inline font-bold text-[#8C6D37] text-[10px] tracking-wider">ADMIN</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#FAF6F0] border border-[#D5C7B3] rounded-2xl shadow-xl p-3 z-50 text-left animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#E8DEC9]">
                        <div className="w-8 h-8 rounded-full bg-[#C19A6B]/20 text-[#8C6D37] flex items-center justify-center font-bold text-sm shrink-0">
                          {(currentUser.email?.[0] || 'A').toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-[#2D241C] truncate">{currentUser.displayName || 'Administrator'}</p>
                          <p className="text-[10px] text-[#7A6B58] truncate">{currentUser.email}</p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#C19A6B]/20 text-[#8C6D37]">
                            ADMINISTRATOR
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsSheetsOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#2D241C] hover:bg-[#EFE7DC] rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Open Google Sheets</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Non-Admin Signed In: NO Sheets option visible! */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User profile menu"
                  title={`Signed in as ${currentUser.email}`}
                  className="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full border border-[#D5C7B3] bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#2F261E] text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="w-5 h-5 rounded-full object-cover border border-[#D5C7B3]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#8C7A65] text-white flex items-center justify-center text-[10px] font-bold">
                      {(currentUser.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-[#665744] text-[10px]">MEMBER</span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#FAF6F0] border border-[#D5C7B3] rounded-2xl shadow-xl p-3 z-50 text-left animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#E8DEC9]">
                      <div className="w-8 h-8 rounded-full bg-[#8C7A65]/20 text-[#665744] flex items-center justify-center font-bold text-sm shrink-0">
                        {(currentUser.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[#2D241C] truncate">{currentUser.displayName || 'Guest Diner'}</p>
                        <p className="text-[10px] text-[#7A6B58] truncate">{currentUser.email}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E8DEC9] text-[#665744]">
                          STANDARD MEMBER
                        </span>
                      </div>
                    </div>
                    <p className="px-2 py-1 text-[10px] text-[#8C7A65] italic">
                      Sheets operations are restricted to admin ({ADMIN_EMAIL}).
                    </p>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Switch</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Takeaway Order CTA Button */}
            <button
              type="button"
              onClick={() => setIsTakeawayOpen(true)}
              aria-label="Order Takeaway"
              title="Order Gourmet Takeaway"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full border border-[#8C7A65]/50 bg-[#EAE2D3]/70 hover:bg-[#DDD3BF] text-[#2F261E] text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-300 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#8C7A65]" />
              <span className="hidden sm:inline">TAKEAWAY</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              data-purpose="cta-booking"
              className="inline-flex items-center justify-center px-3 sm:px-6 md:px-7 py-2 sm:py-2.5 rounded-full border border-[#443C32] text-[11px] sm:text-xs font-semibold tracking-wider text-[#2E2820] hover:bg-[#2E2820] hover:text-[#FAF8F5] active:scale-95 transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_-4px_rgba(46,40,32,0.35)] cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">BOOK A TABLE</span>
              <span className="sm:hidden">RESERVE</span>
            </button>

            {/* Mobile / Tablet Menu Button (Visible on screens < 1024px) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-[#8C7A65]/50 text-[#332A21] hover:bg-[#EAE2D3] active:scale-95 transition-all cursor-pointer shrink-0 relative overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close-icon"
                    initial={{ rotate: -90, opacity: 0, scale: 0.75 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu-icon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.75 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Responsive Slide-over Navigation Drawer with Smooth Spring Physics */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
              {/* Backdrop with smooth fade in/out */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed inset-0 bg-black/55 backdrop-blur-xs"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Drawer Content with smooth spring slide */}
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Mobile Navigation"
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '100%' }}
                transition={{
                  type: 'spring',
                  damping: 30,
                  stiffness: 300,
                  mass: 0.85,
                }}
                className="relative w-full max-w-[340px] sm:max-w-[380px] h-full bg-[#F3EFE6] text-[#2E2820] shadow-[0_0_50px_rgba(0,0,0,0.3)] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-l border-[#DFD8C9] z-10"
              >
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-5 border-b border-[#E3DBD0]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full border border-[#8C7A65] flex items-center justify-center p-1.5 text-[#715E49]">
                        <svg
                          className="w-5 h-5 stroke-[1.2]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 40 40"
                        >
                          <circle cx="20" cy="20" r="18" strokeDasharray="2 2" />
                          <path
                            d="M20 7V33M12 15C12 21 28 21 28 15M14 26C14 29 26 29 26 26"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span className="font-serif text-lg tracking-widest text-[#2D261E] font-medium">
                        {"L'ÉTOILE"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="Close navigation"
                      className="w-9 h-9 rounded-full border border-[#8C7A65]/40 flex items-center justify-center text-[#554C40] hover:bg-[#EAE2D3] active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation Items with smooth staggered entrance */}
                  <nav className="py-6 flex flex-col space-y-1 text-sm font-semibold tracking-wider">
                    {[
                      {
                        key: 'home',
                        label: 'HOME',
                        desc: 'Overview',
                        action: () => {
                          setActiveNav('home');
                          setIsMobileMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                      },
                      {
                        key: 'menu',
                        label: 'OUR MENU',
                        desc: '6 Courses',
                        action: () => {
                          setActiveNav('menu');
                          setIsMobileMenuOpen(false);
                          const el = document.getElementById('menu');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            setIsMenuOpen(true);
                          }
                        },
                      },
                      {
                        key: 'reviews',
                        label: 'REVIEWS',
                        desc: 'Michelin 3★',
                        action: () => {
                          setActiveNav('reviews');
                          setIsMobileMenuOpen(false);
                          setIsReviewsOpen(true);
                        },
                      },
                      {
                        key: 'contact',
                        label: 'CONTACT',
                        desc: 'Mayfair',
                        action: () => {
                          setActiveNav('contact');
                          setIsMobileMenuOpen(false);
                          setIsLocationOpen(true);
                        },
                      },
                      ...(isAdmin
                        ? [
                            {
                              key: 'sheets',
                              label: 'GOOGLE SHEETS HUB',
                              desc: 'Select / Switch Sheet',
                              action: () => {
                                setIsMobileMenuOpen(false);
                                openSheetsWithConfig('drive', true);
                              },
                            },
                            {
                              key: 'sheets-create',
                              label: '+ CREATE NEW SHEET',
                              desc: 'Start Fresh Operations',
                              action: () => {
                                setIsMobileMenuOpen(false);
                                openSheetsWithConfig('drive', false, true);
                              },
                            },
                          ]
                        : []),
                    ].map((item, idx) => {
                      const isActive = activeNav === item.key;
                      return (
                        <motion.button
                          key={item.key}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.08 + idx * 0.035,
                            duration: 0.35,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          onClick={item.action}
                          className={`relative flex items-center justify-between py-3 px-4 rounded-xl transition-all cursor-pointer text-left overflow-hidden select-none ${
                            isActive
                              ? 'text-[#1F1A14] font-bold shadow-xs'
                              : 'text-[#554C40] hover:bg-[#EAE2D3] hover:text-[#1F1A14]'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="mobileActiveNavPill"
                              className="absolute inset-0 bg-[#E5DCCB] border-l-4 border-[#C19A6B] rounded-xl z-0"
                              transition={{
                                type: 'spring',
                                stiffness: 420,
                                damping: 32,
                              }}
                            />
                          )}
                          <span className="relative z-10">{item.label}</span>
                          <span
                            className={`relative z-10 text-[11px] font-normal transition-colors ${
                              isActive ? 'text-[#5B4C38] font-medium' : 'text-[#8A7965]'
                            }`}
                          >
                            {item.desc}
                          </span>
                        </motion.button>
                      );
                    })}
                  </nav>

                  {/* Account / Sign-In Status Card in Mobile Drawer */}
                  <div className="pt-2 pb-4 border-t border-[#E3DBD0]/80">
                    {!currentUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleGoogleSignIn();
                        }}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#D5C7B3] bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#2F261E] text-xs font-semibold tracking-wider transition-all shadow-2xs active:scale-98 cursor-pointer"
                      >
                        {isLoggingIn ? (
                          <div className="w-4 h-4 border-2 border-[#C19A6B] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        )}
                        <span>SIGN IN WITH GOOGLE</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-2xl bg-[#EBE3D4] border border-[#DDD3C2] flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="User"
                              className={`w-8 h-8 rounded-full object-cover border ${
                                isAdmin ? 'border-2 border-[#C19A6B]' : 'border border-[#C5B7A2]'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1F1A14] text-[#FAF8F5] flex items-center justify-center font-bold text-xs shrink-0">
                              {(currentUser.email?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#1F1A14] truncate">
                                {currentUser.displayName || 'Google Account'}
                              </span>
                              {isAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#C19A6B]/20 text-[#8C6D37] border border-[#C19A6B]/50 shrink-0">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#716454] truncate block">
                              {currentUser.email}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSignOut}
                          title="Sign Out"
                          className="w-7 h-7 rounded-full bg-[#DFD6C5] hover:bg-[#D2C8B5] text-[#554A3B] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawer Footer & Direct CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-5 border-t border-[#E3DBD0] space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsBookingOpen(true);
                    }}
                    className="w-full py-3.5 px-4 rounded-full bg-[#2E2820] text-[#FAF8F5] text-xs font-semibold tracking-widest uppercase hover:bg-[#443C32] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C19A6B]" />
                    <span>Reserve A Table</span>
                  </button>

                  <div className="space-y-2 text-xs text-[#6B5F50] pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#8C7A65] shrink-0" />
                      <span>Dinner: Daily 17:30 – 23:30</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#8C7A65] shrink-0" />
                      <span>14 Berkeley Square, Mayfair, London</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#8C7A65] shrink-0" />
                      <a href="tel:+442079460912" className="hover:text-[#1F1A14] transition-colors underline-offset-2 hover:underline">
                        +44 20 7946 0912
                      </a>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* END: Header */}

        {/* BEGIN: Hero Section with Swiper JS */}
        <HeroSwiper
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
        {/* END: Hero Section */}

        {/* BEGIN: Main Content Grid (Our Menu with Serial Cards + Philosophy + Reviews) */}
        <section className="py-4 sm:py-10 relative space-y-8 sm:space-y-10" data-purpose="menu-showcase" id="menu">
          {/* The Serial Menu Cards (Up-to-down on mobile, side-by-side on tablet/desktop) */}
          <SerialMenuShowcase
            dishes={PEDESTAL_DISHES}
            onSelectDish={(dish) => setSelectedDish(dish)}
            onOpenMenu={() => setIsMenuOpen(true)}
          />

          {/* Culinary Philosophy Banner with reveal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8 rounded-2xl bg-[#EAE2D3]/70 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-5"
          >
            <div className="max-w-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A7965] font-semibold">
                Kitchen Ethos
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#221C16] mt-1">
                Culinary Philosophy
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5F50] mt-2 leading-relaxed">
                Every creation is built with seasonal biodynamic harvests, artisanal fermentations, and ancient fire roasting techniques. We honor French precision and coastal nature.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#2E2820] text-xs font-semibold tracking-wider text-[#FAF8F5] hover:bg-[#443C32] transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap active:scale-95"
            >
              Explore Tasting Journey
            </button>
          </motion.div>

          {/* CUSTOMER REVIEWS with reveal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8 rounded-2xl bg-[#EAE2D3]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            data-purpose="customer-reviews"
            id="reviews"
          >
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[#C19A6B]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-[11px] font-sans text-[#786D5E] font-medium">
                  The Michelin Guide 2024
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#221C16] font-normal">
                Customer Reviews
              </h3>
              <div
                onClick={() => setIsReviewsOpen(true)}
                className="border-l-2 border-[#8A7965] pl-3 py-1 cursor-pointer group/rev"
              >
                <p className="text-xs sm:text-sm text-[#5D5243] leading-relaxed italic group-hover/rev:text-[#1F1A14] transition-colors">
                  &ldquo;An unforgettable symphonic dinner. The scallop crudo and wine pairing remain unequaled in all our travels.&rdquo;
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsReviewsOpen(true)}
                className="inline-block px-6 py-2.5 rounded-full bg-[#D4C8B5] hover:bg-[#C2B5A0] text-[#29221B] text-xs font-semibold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Read Guest Stories
              </button>
            </div>
          </motion.div>
        </section>
        {/* END: Main Content Grid */}

        {/* BEGIN: Bento Highlights Section with Staggered Card Reveal */}
        <section className="py-12 border-t border-[#E1D8CA]" data-purpose="gallery-bento-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Bento 1: Cellar Reserves */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.55, delay: 0, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#DFD7C7] p-6 rounded-3xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 group"
            >
              <div>
                <h3 className="font-serif text-2xl text-[#221C16] font-medium transition-transform duration-300 group-hover:translate-x-0.5">
                  Cellar Reserves
                </h3>
                <p className="text-xs text-[#635747] mt-3 leading-relaxed">
                  Rare vintages, natural small-batch biodynamic vineyards, and bespoke pairings curated by head sommelier.
                </p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => setIsCellarOpen(true)}
                  className="px-5 py-2 rounded-full bg-[#1F1A14] text-[#FAF8F5] text-xs font-semibold tracking-wider hover:bg-[#383027] active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Explore Cellar
                </button>
              </div>
            </motion.div>

            {/* Bento 2: Dark Food Feature Card (The Tasting Table) */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setGalleryIndex(0)}
              className="bg-[#181410] rounded-3xl overflow-hidden p-3 transition-all duration-500 hover:-translate-y-1.5 group flex flex-col justify-between cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="View Tasting Table gallery photo"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setGalleryIndex(0);
              }}
            >
              <div className="h-44 rounded-2xl overflow-hidden relative">
                <img
                  alt="Gourmet dinner tabletop arrangement"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm_F8GT_y-pZMb-m_IoE2MNAfZo0pShbzfkbmV53BeV2MKvH2U7CsVYRH0cLf3pol3e1GQCGPmMiUluGgtYKZqdmL-5EWQdGL2sqzENso_yd2ZEN_cqjx9BwnZ5PbFIcdaQQxFDrUN9a34XHZz9kvMmZKAlhV1zuw5JWvQsoor5CutH8yp97EYn77MspEGE6LVDXp6rgBKEkAQNyXYTAOPWMtsSF6RbVM6GbJA3YRIGUcKckyYYGJc"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
              </div>
              <div className="p-3 text-center">
                <span className="text-xs text-[#D8CEBF] font-serif tracking-widest uppercase transition-colors duration-300 group-hover:text-white">
                  The Tasting Table
                </span>
              </div>
            </motion.div>

            {/* Bento 3: The Gallery Editorial Card */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#DFD7C7] p-6 rounded-3xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 group"
            >
              <div>
                <h3 className="font-serif text-2xl text-[#221C16] font-medium transition-transform duration-300 group-hover:translate-x-0.5">
                  The Gallery
                </h3>
                <p className="text-xs text-[#635747] mt-3 leading-relaxed">
                  Step into the architectural ambiance: brutalist travertine textures, soft linen drapery, and warm candlelit intimacy.
                </p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => setGalleryIndex(3)}
                  className="px-5 py-2 rounded-full bg-[#1F1A14] text-[#FAF8F5] text-xs font-semibold tracking-wider hover:bg-[#383027] active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Private Events
                </button>
              </div>
            </motion.div>

            {/* Bento 4: Gallery Imagery Collage / Plating */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#D9CEBC] rounded-3xl overflow-hidden p-3 transition-all duration-500 hover:-translate-y-1.5 group cursor-pointer"
            >
              <div className="grid grid-cols-2 gap-2 h-full">
                <div
                  onClick={() => setGalleryIndex(1)}
                  className="rounded-xl overflow-hidden h-24 sm:h-28"
                  role="button"
                  tabIndex={0}
                  aria-label="View refined appetizers"
                >
                  <img
                    alt="Refined appetizers"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJfV1b0n63xPYWRkjuFlRNU0_3qla259BYULyzajV_6fNIBGx_6GMQ7p0Rzod6zWV6CLo09ie6_yMSKwPXsJPWmPfw5PKOzYktZPIJrynEFu4CZEh4Egn3ZUckE44ljr4wfmPIrWSYy2-l5MqeLQnieUQgk9qkPj98uu4KomsIh1KZlseoKYD7hpkw-rxM2e5XmN7eJ0NANWTn7qzkrmin2gJuDNb6HC9SNIv5IDS9FCSk7lSbIRC_"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div
                  onClick={() => setGalleryIndex(2)}
                  className="rounded-xl overflow-hidden h-24 sm:h-28"
                  role="button"
                  tabIndex={0}
                  aria-label="View dessert architecture"
                >
                  <img
                    alt="Culinary delicacy presentation"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFYe8e27w9DFls_l-i5TKujtOKAC_lXwAu-jxjSlQUonIiAQzTsgWbotEgO3bXR9_r9qp1mJG1kCodWUaHZI0ckQQIYCk-NleMsb6lMu24KDLkAJLv1D2N9UZTJQiaKD2lsJxfeTdZhoHv108PnQSJiirVeCqY05FIs7KkaEP9Q1IUmdqLJkhUPJbLF9H8tetKqM4x6vkIxry0YNb-WNfRIiTUxcPAyjYPyg7xhTewKnH8RMRuC4i1"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div
                  onClick={() => setGalleryIndex(3)}
                  className="rounded-xl overflow-hidden col-span-2 h-24"
                  role="button"
                  tabIndex={0}
                  aria-label="View dining ambiance"
                >
                  <img
                    alt="Candlelit dining atmosphere"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlk9e-E_idyC7lqb_DrGFHlNLf8rTVdpQtWF9a2TYverDRyw2f60tF8Cxd1f775SYssVWWEScF8i1Xtvmnm-jbPKlIQrOTfS6m6o_jGbYfwl4ePXhz6WQ78rxviziqCosNew_AMykkT0t6ZnLPGDJZVXQZKEIAIh-AM6NVpcZmu6Tqv_91ousnBaoua1AaV-wU03X-DGisL7o1Yw7MzLrRVYQob2tQVaVnf21DR19NgD1JjwsYa01K"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </section>
        {/* END: Bento Highlights Section */}

        {/* BEGIN: About Us Section (Positioned Directly Above Footer) with Reveal */}
        <section className="my-10 sm:my-16" id="about" data-purpose="about-section">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsAtelierOpen(true)}
            className="relative rounded-3xl overflow-hidden bg-[#1E1914] text-[#FAF8F5] flex flex-col lg:flex-row group transition-all duration-500 cursor-pointer"
            data-purpose="about-card"
            role="button"
            tabIndex={0}
            aria-label="Meet Executive Chef Alexandre Moreau and the Atelier"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsAtelierOpen(true);
            }}
          >
            {/* Floating Indicator Icon */}
            <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs animate-badge-pulse">
              ✦
            </div>

            {/* Left Text Content */}
            <div className="p-7 sm:p-10 lg:p-12 lg:w-1/2 flex flex-col justify-center relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C19A6B] font-semibold">
                  Mastery &amp; Lineage
                </span>
                <span className="text-[10px] text-[#A89C8C] uppercase tracking-wider">
                  • Three Michelin Stars
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F5EFE6] font-normal mb-4 transition-transform duration-500 group-hover:translate-x-1">
                About Us
              </h2>
              <p className="text-xs sm:text-sm text-[#BCB0A0] leading-relaxed mb-4 transition-colors duration-500 group-hover:text-[#D5C9B8]">
                Led by Michelin-starred Executive Chef Alexandre Moreau, our kitchen elevates gastronomy into sculptural storytelling. We honor French precision, coastal nature, and ancestral fire roasting.
              </p>
              <p className="text-xs text-[#8E8272] leading-relaxed mb-6 hidden sm:block">
                Every plate is a tribute to small-batch biodynamic farmers, maritime fishermen, and wild botanicals gathered daily from Brittany to Provence.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#E5D7C2] uppercase group/link">
                <span className="border-b border-transparent group-hover:border-[#E5D7C2] transition-all duration-300">
                  Meet the Atelier &amp; Philosophy
                </span>
                <ArrowRight className="w-3.5 h-3.5 transform transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </div>

            {/* Right Chef Portrait */}
            <div className="lg:w-1/2 h-72 sm:h-80 lg:h-auto min-h-[280px] relative overflow-hidden">
              <img
                alt="Executive Chef Alexandre Moreau in white uniform inside elegant restaurant"
                className="w-full h-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108 group-hover:brightness-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4TRI5myWEwEFE1e0-Y0LZMU58UGJQ9HjqHwYVggWmJjoXJfroNYIgtedrjvK8byibhmf5vK69lvU5CB1kSLtnZdENIyrFuinH0sANNuClu9dCFoZuBfeMo_FfRKtc_cBGBdR9QGeCPs3A0wxID5CUnboejMYmv_bODX3y0tFHMeI-KPmaYmSvcDyrJKxD8D0Qgbqgb-O-pxZv73IgjrJu9PsWW1r5hSrxCvC2qZB2ppgwLodmkf5n"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#1E1914] via-transparent to-transparent" />
              
              <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[#FAF8F5] text-[10px] font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C19A6B]" />
                <span>Chef Alexandre Moreau</span>
              </div>
            </div>
          </motion.div>
        </section>
        {/* END: About Us Section */}

        {/* BEGIN: Footer */}
        <footer
          className="pt-10 pb-8 border-t border-[#DFD6C7] mt-4"
          data-purpose="site-footer"
          id="contact"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
            
            {/* Column 1: Restaurant Info */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg tracking-wider text-[#241E18] uppercase font-semibold">
                {"L'Étoile Atelier"}
              </h4>
              <p className="text-xs text-[#6F6352] leading-relaxed">
                42 Rue de la Paix, 75002 Paris<br />
                reservations@letoile-dining.com<br />
                +33 (0) 1 42 68 55 00
              </p>
              {/* Social Media Icons in Circular Badges */}
              <div className="flex items-center space-x-2 pt-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-[#302720] text-[#EFEBE4] flex items-center justify-center hover:bg-[#524438] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <Instagram className="w-4 h-4 transition-transform duration-300 hover:rotate-6" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-[#302720] text-[#EFEBE4] flex items-center justify-center hover:bg-[#524438] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <Facebook className="w-4 h-4 transition-transform duration-300 hover:rotate-6" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-8 h-8 rounded-full bg-[#302720] text-[#EFEBE4] flex items-center justify-center hover:bg-[#524438] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <Twitter className="w-4 h-4 transition-transform duration-300 hover:rotate-6" />
                </a>
              </div>
            </div>

            {/* Column 2: Hours */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg tracking-wider text-[#241E18] uppercase font-semibold">
                Service Hours
              </h4>
              <ul className="text-xs text-[#6F6352] space-y-1.5">
                <li className="flex justify-between border-b border-[#E3DBD0] pb-1 hover:text-[#2A241E] transition-colors duration-200">
                  <span>Wednesday – Friday:</span>
                  <span className="font-mono">18:30 – 23:30</span>
                </li>
                <li className="flex justify-between border-b border-[#E3DBD0] pb-1 hover:text-[#2A241E] transition-colors duration-200">
                  <span>Saturday &amp; Sunday:</span>
                  <span className="font-mono">12:00 – 15:30 / 18:30 – 00:00</span>
                </li>
                <li className="flex justify-between text-[#8E8272] hover:text-[#2A241E] transition-colors duration-200">
                  <span>Monday &amp; Tuesday:</span>
                  <span>Private Bookings Only</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Recognition */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg tracking-wider text-[#241E18] uppercase font-semibold">
                Recognition
              </h4>
              <ul className="text-xs text-[#6F6352] space-y-1.5">
                <li
                  onClick={() => setIsReviewsOpen(true)}
                  className="hover:translate-x-1 hover:text-[#2A241E] transition-all duration-300 cursor-pointer"
                >
                  Three Michelin Stars (2021–2024)
                </li>
                <li
                  onClick={() => setIsReviewsOpen(true)}
                  className="hover:translate-x-1 hover:text-[#2A241E] transition-all duration-300 cursor-pointer"
                >
                  {"World's 50 Best Restaurants #12"}
                </li>
                <li
                  onClick={() => setIsCellarOpen(true)}
                  className="hover:translate-x-1 hover:text-[#2A241E] transition-all duration-300 cursor-pointer"
                >
                  Grand Prix du Sommelier 2023
                </li>
                <li
                  onClick={() => setIsAtelierOpen(true)}
                  className="hover:translate-x-1 hover:text-[#2A241E] transition-all duration-300 cursor-pointer"
                >
                  Sustainable Gastronomy Clover Leaf
                </li>
              </ul>
            </div>

            {/* Column 4: Interactive Map Widget */}
            <div className="space-y-2">
              <h4 className="font-serif text-lg tracking-wider text-[#241E18] uppercase font-semibold">
                Location
              </h4>
              <div
                onClick={() => setIsLocationOpen(true)}
                className="rounded-2xl overflow-hidden border border-[#D5C9B7] bg-[#EAE3D5] shadow-sm p-1.5 group cursor-pointer hover:border-[#8C7A65] hover:shadow-md transition-all duration-500"
                role="button"
                tabIndex={0}
                aria-label="Open location map and directions"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setIsLocationOpen(true);
                }}
              >
                {/* Stylized Map Container */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                  <img
                    alt="Map view placeholder"
                    className="w-full h-full object-cover filter saturate-[0.6] contrast-[0.9] group-hover:scale-105 group-hover:saturate-[0.8] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXabAsX4z-4SupNRkFakwm9aAecBn719L_fbbbqgrfHplJZLMkUMf5dhUMr13D5y7dr-MXEvv9YGZo_6vd5aXC_WQ8JndFYQk8s0wMpBihkifNhos58j8SW7P_XwWwLijZjt8VeAl9N8yDq2wFD9R5YvyispPZGQC--dPdS5E3w6NY_-JQCWEOoAZ-m_tGnj2iUvdaC8HZTuboh35XeT4gSxSuPVT6V-aMDSELwAiXNvSvHuzNpz3H"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-[#E8E2D5]/40 backdrop-blur-[1px] group-hover:bg-transparent transition-colors duration-500" />
                  {/* Map Pin Point */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
                      <div className="w-7 h-7 rounded-full bg-[#1F1A14] text-[#E8DCC9] flex items-center justify-center shadow-lg group-hover:bg-[#C19A6B] group-hover:text-black transition-colors duration-300">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="bg-[#1F1A14] text-[#FAF8F5] text-[9px] px-2 py-0.5 rounded-md font-sans tracking-widest mt-1 shadow-sm">
                        {"L'ÉTOILE"}
                      </span>
                    </div>
                  </div>
                  {/* Google Map Badge aesthetic */}
                  <div className="absolute bottom-1.5 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-semibold text-gray-700 shadow-xs">
                    Google Maps
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright Bar */}
          <div className="pt-6 border-t border-[#DFD6C7] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7A6D5D]">
            <p>{"© 2024 L'Étoile Atelier Gastronomique. All Rights Reserved."}</p>
            <div className="flex space-x-6 mt-3 sm:mt-0">
              <button
                onClick={() => setInfoDialog({ title: 'Privacy Policy', text: "L'Étoile Atelier Gastronomique respects patron confidentiality. All personal guest credentials, dining notes, and reservation details are encrypted and strictly confidential." })}
                className="hover:text-[#2A241E] hover:underline transition-colors duration-200 cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setInfoDialog({ title: 'Terms of Service', text: "Tasting reservations open 60 days in advance. Cancellations or party adjustments are honored up to 48 hours prior to service. Attire is Smart Elegant." })}
                className="hover:text-[#2A241E] hover:underline transition-colors duration-200 cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                onClick={() => setInfoDialog({ title: 'Press & Editorial Inquiries', text: "For Michelin Guide, Le Figaro, or culinary publication photography and interviews, please direct correspondence to press@letoile-dining.com." })}
                className="hover:text-[#2A241E] hover:underline transition-colors duration-200 cursor-pointer"
              >
                Press Inquiries
              </button>
            </div>
          </div>
        </footer>
        {/* END: Footer */}

      </div>

      {/* MODALS */}
      <DishDetailModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onReserve={() => {
          setSelectedDish(null);
          setIsBookingOpen(true);
        }}
        onTakeaway={() => {
          setSelectedDish(null);
          setIsTakeawayOpen(true);
        }}
      />

      <ReservationModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        activeSpreadsheetId={activeSpreadsheetId}
        onOpenSheets={() => {
          setIsBookingOpen(false);
          setIsSheetsOpen(true);
        }}
      />

      <GoogleSheetsModal
        isOpen={isSheetsOpen}
        onClose={() => setIsSheetsOpen(false)}
        activeSpreadsheetId={activeSpreadsheetId}
        onSelectSpreadsheet={(id, title) => {
          setActiveSpreadsheetId(id);
          setActiveSpreadsheetTitle(title);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('letoile_active_sheet_id', id);
              localStorage.setItem('letoile_active_sheet_title', title);
            } catch {}
          }
        }}
        currentUser={currentUser}
        initialTab={sheetsInitialTab}
        openSelector={sheetsOpenSelector}
        openCreateDialog={sheetsOpenCreate}
      />

      <TakeawayModal
        isOpen={isTakeawayOpen}
        onClose={() => setIsTakeawayOpen(false)}
        activeSpreadsheetId={activeSpreadsheetId}
        onOpenSheets={() => {
          setIsTakeawayOpen(false);
          setIsSheetsOpen(true);
        }}
      />

      <AtelierModal
        isOpen={isAtelierOpen}
        onClose={() => setIsAtelierOpen(false)}
        onOpenBooking={() => {
          setIsAtelierOpen(false);
          setIsBookingOpen(true);
        }}
      />

      <CellarModal
        isOpen={isCellarOpen}
        onClose={() => setIsCellarOpen(false)}
        onOpenBooking={() => {
          setIsCellarOpen(false);
          setIsBookingOpen(true);
        }}
      />

      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenBooking={() => {
          setIsMenuOpen(false);
          setIsBookingOpen(true);
        }}
      />

      <ReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
      />

      <GalleryModal
        isOpen={galleryIndex !== null}
        initialIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
        onOpenBooking={() => {
          setGalleryIndex(null);
          setIsBookingOpen(true);
        }}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onOpenBooking={() => {
          setIsLocationOpen(false);
          setIsBookingOpen(true);
        }}
      />

      {/* Info Notice Modal */}
      {infoDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-[#F4EFE6] text-[#221E19] rounded-2xl border border-[#D8CEBC] shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl text-[#1E1914] mb-2">{infoDialog.title}</h3>
            <p className="text-xs text-[#5D5142] leading-relaxed mb-6">{infoDialog.text}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setInfoDialog(null)}
                className="px-5 py-2 rounded-full bg-[#1F1A14] text-white text-xs font-semibold tracking-wider hover:bg-[#383027] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
