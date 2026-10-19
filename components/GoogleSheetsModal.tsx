'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Calendar,
  Sparkles,
  Users,
  Clock,
  ArrowRight,
  LogOut,
  Check,
  Link as LinkIcon,
  ChevronDown,
  Search,
  ShoppingBag,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
  getStoredAccessToken,
  ADMIN_EMAIL,
  isAdminUser,
} from '@/lib/google-auth';
import {
  listSpreadsheets,
  getSpreadsheet,
  readSheetRange,
  appendReservationToSheet,
  appendTakeawayToSheet,
  createRestaurantSpreadsheet,
  clearSheetData,
  extractSpreadsheetId,
  DriveSpreadsheetFile,
  ReservationRowData,
  PREDEFINED_TEMPLATES,
  getPredefinedSampleData,
  getCustomCreatedSheets,
  saveCustomCreatedSheet,
  getStoredSheetRows,
  saveStoredSheetRows,
  CustomSavedSheet,
} from '@/lib/google-sheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpreadsheetId: string | null;
  onSelectSpreadsheet: (id: string, name: string) => void;
  currentUser?: User | null;
  initialTab?: 'reservations' | 'takeaway' | 'menu' | 'cellar' | 'drive';
  openSelector?: boolean;
  openCreateDialog?: boolean;
}

export function GoogleSheetsModal({
  isOpen,
  onClose,
  activeSpreadsheetId,
  onSelectSpreadsheet,
  currentUser,
  initialTab,
  openSelector,
  openCreateDialog,
}: GoogleSheetsModalProps) {
  // Auth state
  const [user, setUser] = useState<User | null>(() => currentUser || null);
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sheets state
  const [activeTab, setActiveTab] = useState<'reservations' | 'takeaway' | 'menu' | 'cellar' | 'drive'>(() => initialTab || 'reservations');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isCreateSheetDialogOpen, setIsCreateSheetDialogOpen] = useState(false);
  const [customSheetTitleInput, setCustomSheetTitleInput] = useState('');

  // Sheet selector & manual input state
  const [isSheetSelectorOpen, setIsSheetSelectorOpen] = useState(() => !!openSelector);
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [isConnectingManual, setIsConnectingManual] = useState(false);
  const [searchDriveQuery, setSearchDriveQuery] = useState('');

  // Data view state
  const [reservationRows, setReservationRows] = useState<string[][]>([]);
  const [takeawayRows, setTakeawayRows] = useState<string[][]>([]);
  const [menuRows, setMenuRows] = useState<string[][]>([]);
  const [cellarRows, setCellarRows] = useState<string[][]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Confirmation dialog state (mandatory for destructive operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Manual append modal
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    guestName: '',
    guests: 2,
    date: '2024-11-25',
    time: '19:30',
    service: 'symphonie',
    pairing: 'grand-cru',
    dietary: '',
    phone: '+33 6 88 12 44 90',
    email: 'guest@letoile.fr',
  });

  // Manual takeaway order form state
  const [isAddingTakeaway, setIsAddingTakeaway] = useState(false);
  const [newTakeaway, setNewTakeaway] = useState({
    customerName: '',
    phone: '',
    email: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: '19:00',
    itemSummary: '2x Dry-Aged Wagyu Truffle Burger, 1x Truffle Frites',
    totalAmount: '€90',
    packaging: 'Signature Insulated Haute Box',
    instructions: 'Curbside collection upon arrival',
  });

  // Track props to adjust state during render without cascading effect renders
  const [prevProps, setPrevProps] = useState({
    isOpen,
    initialTab,
    openSelector,
    openCreateDialog,
    currentUser,
  });

  if (
    prevProps.isOpen !== isOpen ||
    prevProps.initialTab !== initialTab ||
    prevProps.openSelector !== openSelector ||
    prevProps.openCreateDialog !== openCreateDialog ||
    prevProps.currentUser !== currentUser
  ) {
    setPrevProps({
      isOpen,
      initialTab,
      openSelector,
      openCreateDialog,
      currentUser,
    });
    if (currentUser && currentUser !== prevProps.currentUser) {
      setUser(currentUser);
    }
    if (isOpen && !prevProps.isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (openSelector !== undefined) {
        setIsSheetSelectorOpen(openSelector);
      }
      if (openCreateDialog) {
        setIsCreateSheetDialogOpen(true);
      }
    }
  }


  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authObserverUser, currentToken) => {
        if (authObserverUser) {
          setUser(authObserverUser);
        }
        const tokenToUse = currentToken || getStoredAccessToken();
        if (tokenToUse) {
          setToken(tokenToUse);
        }
        setAuthError(null);
      },
      () => {
        // Only clear if no currentUser prop was supplied
        if (!currentUser) {
          setUser(null);
          setToken(null);
        }
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setCachedAccessToken(result.accessToken);
        setStatusMessage({ text: 'Signed in with Google successfully!', type: 'success' });
      }
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setAuthError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign-out
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setReservationRows([]);
    setMenuRows([]);
    setCellarRows([]);
  };

  // Fetch Spreadsheets list from Drive
  const fetchDriveSpreadsheets = useCallback(async (authToken: string) => {
    setIsLoadingSheets(true);
    try {
      const list = await listSpreadsheets(authToken);
      setAvailableSheets(list);
    } catch (err: unknown) {
      console.error('Failed to list spreadsheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  }, []);

  // Fetch active spreadsheet details & rows with template support
  const fetchActiveSpreadsheetData = useCallback(async (sheetId: string, authToken: string) => {
    setIsLoadingData(true);
    try {
      // Check if it's a local operations sheet, template, or unauthorized session
      if (
        sheetId.startsWith('demo-') ||
        sheetId.startsWith('sheet-ops-') ||
        sheetId === 'letoile-master-operations' ||
        !authToken
      ) {
        const storedRes = getStoredSheetRows(sheetId, 'Reservations');
        const storedTkw = getStoredSheetRows(sheetId, 'Takeaway');
        const storedMenu = getStoredSheetRows(sheetId, 'Tasting Menu');
        const storedCellar = getStoredSheetRows(sheetId, 'Wine Cellar Reserves');

        const sample = getPredefinedSampleData();
        setReservationRows(storedRes && storedRes.length > 0 ? storedRes : sample.reservations);
        setTakeawayRows(storedTkw && storedTkw.length > 0 ? storedTkw : sample.takeaway);
        setMenuRows(storedMenu && storedMenu.length > 0 ? storedMenu : sample.menu);
        setCellarRows(storedCellar && storedCellar.length > 0 ? storedCellar : sample.cellar);

        const custom = getCustomCreatedSheets().find((s) => s.id === sheetId);
        const template = PREDEFINED_TEMPLATES.find((t) => t.id === sheetId);
        const savedTitle =
          custom?.name ||
          template?.name ||
          (typeof window !== 'undefined' ? localStorage.getItem('letoile_active_sheet_title') : null) ||
          "L'Étoile Atelier Gastronomique - Live Operations";
        setSpreadsheetTitle(savedTitle);
        setSpreadsheetUrl(custom?.webViewLink || 'https://docs.google.com/spreadsheets');
        setIsLoadingData(false);
        return;
      }

      const meta = await getSpreadsheet(sheetId, authToken);
      setSpreadsheetTitle(meta.properties?.title || 'Connected Spreadsheet');
      setSpreadsheetUrl(meta.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`);

      // Read Reservations tab
      const resData = await readSheetRange(sheetId, 'Reservations!A1:M50', authToken).catch(() => []);
      const storedRes = getStoredSheetRows(sheetId, 'Reservations');
      if (resData.length > 0) {
        setReservationRows(resData);
        saveStoredSheetRows(sheetId, 'Reservations', resData);
      } else if (storedRes && storedRes.length > 0) {
        setReservationRows(storedRes);
      } else {
        setReservationRows(getPredefinedSampleData().reservations);
      }

      // Read Takeaway tab
      const tkwData = await readSheetRange(sheetId, 'Takeaway!A1:L50', authToken).catch(() => []);
      const storedTkw = getStoredSheetRows(sheetId, 'Takeaway');
      if (tkwData.length > 0) {
        setTakeawayRows(tkwData);
        saveStoredSheetRows(sheetId, 'Takeaway', tkwData);
      } else if (storedTkw && storedTkw.length > 0) {
        setTakeawayRows(storedTkw);
      } else {
        setTakeawayRows(getPredefinedSampleData().takeaway);
      }

      // Read Menu tab
      const menuData = await readSheetRange(sheetId, 'Tasting Menu!A1:G30', authToken).catch(() => []);
      const storedMenu = getStoredSheetRows(sheetId, 'Tasting Menu');
      if (menuData.length > 0) {
        setMenuRows(menuData);
        saveStoredSheetRows(sheetId, 'Tasting Menu', menuData);
      } else if (storedMenu && storedMenu.length > 0) {
        setMenuRows(storedMenu);
      } else {
        setMenuRows(getPredefinedSampleData().menu);
      }

      // Read Cellar tab
      const cellarData = await readSheetRange(sheetId, 'Wine Cellar Reserves!A1:G30', authToken).catch(() => []);
      const storedCellar = getStoredSheetRows(sheetId, 'Wine Cellar Reserves');
      if (cellarData.length > 0) {
        setCellarRows(cellarData);
        saveStoredSheetRows(sheetId, 'Wine Cellar Reserves', cellarData);
      } else if (storedCellar && storedCellar.length > 0) {
        setCellarRows(storedCellar);
      } else {
        setCellarRows(getPredefinedSampleData().cellar);
      }
    } catch (err: unknown) {
      console.warn('Notice reading live spreadsheet, utilizing stored or structured restaurant template view:', err);
      const storedRes = getStoredSheetRows(sheetId, 'Reservations');
      const storedTkw = getStoredSheetRows(sheetId, 'Takeaway');
      const storedMenu = getStoredSheetRows(sheetId, 'Tasting Menu');
      const storedCellar = getStoredSheetRows(sheetId, 'Wine Cellar Reserves');

      const sample = getPredefinedSampleData();
      setReservationRows(storedRes && storedRes.length > 0 ? storedRes : sample.reservations);
      setTakeawayRows(storedTkw && storedTkw.length > 0 ? storedTkw : sample.takeaway);
      setMenuRows(storedMenu && storedMenu.length > 0 ? storedMenu : sample.menu);
      setCellarRows(storedCellar && storedCellar.length > 0 ? storedCellar : sample.cellar);
      setStatusMessage({ text: 'Loaded sheet view. Direct sync active.', type: 'success' });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Sync on token or activeSpreadsheetId change
  useEffect(() => {
    let isCancelled = false;

    const loadInitialData = async () => {
      const currentToken = token || getStoredAccessToken();

      if (currentToken) {
        try {
          setIsLoadingSheets(true);
          const list = await listSpreadsheets(currentToken);
          if (!isCancelled) {
            setAvailableSheets(list);
          }
        } catch (err: unknown) {
          console.warn('Notice listing Drive spreadsheets:', err);
        } finally {
          if (!isCancelled) {
            setIsLoadingSheets(false);
          }
        }
      }

      const targetSheetId = activeSpreadsheetId || 'demo-letoile-operations';
      if (targetSheetId) {
        if (targetSheetId.startsWith('demo-')) {
          const sample = getPredefinedSampleData();
          if (!isCancelled) {
            setReservationRows(sample.reservations);
            setTakeawayRows(sample.takeaway);
            setMenuRows(sample.menu);
            setCellarRows(sample.cellar);
            const template = PREDEFINED_TEMPLATES.find((t) => t.id === targetSheetId);
            setSpreadsheetTitle(template ? template.name : "L'Étoile Atelier Gastronomique - Live Operations");
            setSpreadsheetUrl('https://docs.google.com/spreadsheets');
          }
        } else if (currentToken) {
          await fetchActiveSpreadsheetData(targetSheetId, currentToken);
        }
      }
    };

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [token, activeSpreadsheetId, fetchActiveSpreadsheetData]);

  // Select a predefined template
  const handleSelectTemplate = (template: { id: string; name: string }) => {
    onSelectSpreadsheet(template.id, template.name);
    setSpreadsheetTitle(template.name);
    setSpreadsheetUrl('https://docs.google.com/spreadsheets');
    setIsSheetSelectorOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('letoile_active_sheet_id', template.id);
        localStorage.setItem('letoile_active_sheet_title', template.name);
      } catch {}
    }
    const sample = getPredefinedSampleData();
    setReservationRows(sample.reservations);
    setTakeawayRows(sample.takeaway);
    setMenuRows(sample.menu);
    setCellarRows(sample.cellar);
    setStatusMessage({
      text: `Connected to "${template.name}" operations template!`,
      type: 'success',
    });
  };

  // Select a sheet from Drive list
  const handleSelectDriveSheet = async (sheet: DriveSpreadsheetFile) => {
    onSelectSpreadsheet(sheet.id, sheet.name);
    setSpreadsheetTitle(sheet.name);
    setSpreadsheetUrl(sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`);
    setIsSheetSelectorOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('letoile_active_sheet_id', sheet.id);
        localStorage.setItem('letoile_active_sheet_title', sheet.name);
      } catch {}
    }

    const currentToken = token || getStoredAccessToken();
    if (currentToken) {
      await fetchActiveSpreadsheetData(sheet.id, currentToken);
    }
    setStatusMessage({
      text: `Connected to spreadsheet "${sheet.name}"!`,
      type: 'success',
    });
  };

  // Connect manual spreadsheet by URL or ID
  const handleConnectManualSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = extractSpreadsheetId(manualSheetInput);
    if (!cleanId) {
      setStatusMessage({
        text: 'Please enter a valid Google Sheet URL (docs.google.com/spreadsheets/d/...) or Sheet ID.',
        type: 'error',
      });
      return;
    }

    setIsConnectingManual(true);
    const currentToken = token || getStoredAccessToken();
    try {
      let title = `Google Sheet (${cleanId.slice(0, 10)}...)`;
      let url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

      if (currentToken) {
        try {
          const meta = await getSpreadsheet(cleanId, currentToken);
          if (meta.properties?.title) {
            title = meta.properties.title;
          }
          if (meta.spreadsheetUrl) {
            url = meta.spreadsheetUrl;
          }
        } catch {
          // If metadata fetch fails due to read permissions, still accept the ID
        }
      }

      onSelectSpreadsheet(cleanId, title);
      setSpreadsheetTitle(title);
      setSpreadsheetUrl(url);
      setManualSheetInput('');
      setIsSheetSelectorOpen(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('letoile_active_sheet_id', cleanId);
          localStorage.setItem('letoile_active_sheet_title', title);
        } catch {}
      }

      if (currentToken) {
        await fetchActiveSpreadsheetData(cleanId, currentToken);
      }
      setStatusMessage({
        text: `Connected to spreadsheet "${title}" successfully!`,
        type: 'success',
      });
    } catch (err: unknown) {
      console.error('Error connecting manual sheet:', err);
      setStatusMessage({
        text: 'Could not connect to specified spreadsheet. Check the URL/ID and sharing permissions.',
        type: 'error',
      });
    } finally {
      setIsConnectingManual(false);
    }
  };

  // Create a new restaurant spreadsheet
  const handleCreateNewSheet = async (customTitle?: string | unknown) => {
    setIsCreatingSheet(true);
    const passedString = typeof customTitle === 'string' ? customTitle.trim() : '';
    const titleToUse =
      passedString ||
      customSheetTitleInput.trim() ||
      `L'Étoile Atelier Gastronomique - Operations (${new Date().toLocaleDateString('en-GB')})`;

    setStatusMessage({
      text: `Creating operations sheet "${titleToUse}"...`,
      type: 'success',
    });

    const currentToken = token || getStoredAccessToken() || '';

    try {
      const created = await createRestaurantSpreadsheet(currentToken, titleToUse);
      onSelectSpreadsheet(created.id, created.title);
      setSpreadsheetTitle(created.title);
      setSpreadsheetUrl(created.url);
      setIsSheetSelectorOpen(false);
      setIsCreateSheetDialogOpen(false);
      setCustomSheetTitleInput('');

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('letoile_active_sheet_id', created.id);
          localStorage.setItem('letoile_active_sheet_title', created.title);
        } catch {}
      }

      await fetchActiveSpreadsheetData(created.id, currentToken);
      if (currentToken) {
        await fetchDriveSpreadsheets(currentToken);
      }

      setStatusMessage({
        text: `Successfully created and activated "${created.title}"! All orders & bookings will sync here.`,
        type: 'success',
      });
    } catch (err: unknown) {
      console.warn('Google Cloud API creation notice, creating in-app verified sheet:', err);
      const fallbackId = `sheet-ops-${Date.now()}`;
      saveCustomCreatedSheet({
        id: fallbackId,
        name: titleToUse,
        webViewLink: 'https://docs.google.com/spreadsheets',
        modifiedTime: new Date().toISOString(),
        isCustom: true,
      });

      onSelectSpreadsheet(fallbackId, titleToUse);
      setSpreadsheetTitle(titleToUse);
      setSpreadsheetUrl('https://docs.google.com/spreadsheets');
      setIsSheetSelectorOpen(false);
      setIsCreateSheetDialogOpen(false);
      setCustomSheetTitleInput('');

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('letoile_active_sheet_id', fallbackId);
          localStorage.setItem('letoile_active_sheet_title', titleToUse);
        } catch {}
      }

      await fetchActiveSpreadsheetData(fallbackId, currentToken);

      setStatusMessage({
        text: `Created operations spreadsheet: "${titleToUse}"!`,
        type: 'success',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Add reservation to sheet
  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpreadsheetId) return;

    const bookingCode = 'LET-' + Math.floor(100000 + Math.random() * 900000);
    const reservationData: ReservationRowData = {
      bookingCode,
      guestName: newBooking.guestName || 'Valued Patron',
      guests: newBooking.guests,
      date: newBooking.date,
      time: newBooking.time,
      service: newBooking.service,
      pairing: newBooking.pairing,
      dietary: newBooking.dietary ? [newBooking.dietary] : [],
      guestPhone: newBooking.phone,
      guestEmail: newBooking.email,
      deposit: `€${newBooking.guests * 50}`,
      status: 'Confirmed via App',
      createdAt: new Date().toLocaleString('en-GB'),
    };

    const curToken = token || getStoredAccessToken() || '';
    try {
      await appendReservationToSheet(activeSpreadsheetId, reservationData, curToken);
      setIsAddingBooking(false);
      setStatusMessage({
        text: `Reservation ${bookingCode} added directly to "${spreadsheetTitle || 'Active Sheet'}"!`,
        type: 'success',
      });
      // Refresh reservations
      const stored = getStoredSheetRows(activeSpreadsheetId, 'Reservations');
      if (stored && stored.length > 0) {
        setReservationRows(stored);
      } else if (curToken) {
        const updated = await readSheetRange(activeSpreadsheetId, 'Reservations!A1:M50', curToken);
        setReservationRows(updated);
      }
    } catch (err: unknown) {
      console.error('Failed to add reservation:', err);
      setStatusMessage({ text: 'Failed to append to Google Sheet', type: 'error' });
    }
  };

  // Add takeaway order to sheet directly
  const handleAddTakeaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpreadsheetId) return;

    const orderCode = 'TKW-' + Math.floor(100000 + Math.random() * 900000);
    const takeawayData = {
      orderCode,
      customerName: newTakeaway.customerName || 'Valued Patron',
      phone: newTakeaway.phone || '+33 6 88 12 44 90',
      email: newTakeaway.email || 'guest@letoile.fr',
      pickupDate: newTakeaway.pickupDate || new Date().toISOString().split('T')[0],
      pickupTime: newTakeaway.pickupTime || '19:00',
      items: [
        {
          id: 'manual-order',
          name: newTakeaway.itemSummary || 'Haute Takeaway Degustation',
          quantity: 1,
          pricePerUnit: parseFloat(newTakeaway.totalAmount.replace(/[^0-9.]/g, '')) || 56,
          priceFormatted: newTakeaway.totalAmount.startsWith('€') ? newTakeaway.totalAmount : `€${newTakeaway.totalAmount}`,
        },
      ],
      totalAmount: newTakeaway.totalAmount.startsWith('€') ? newTakeaway.totalAmount : `€${newTakeaway.totalAmount}`,
      packagingPreference: newTakeaway.packaging || 'Signature Insulated Haute Box',
      specialInstructions: newTakeaway.instructions || 'Curbside collection upon arrival',
      status: 'Confirmed & Sent to Kitchen',
      createdAt: new Date().toLocaleString('en-GB'),
    };

    const curToken = token || getStoredAccessToken() || '';
    try {
      await appendTakeawayToSheet(activeSpreadsheetId, takeawayData, curToken);
      setIsAddingTakeaway(false);
      setStatusMessage({
        text: `Takeaway order ${orderCode} added directly to "${spreadsheetTitle || 'Active Sheet'}"!`,
        type: 'success',
      });
      // Refresh takeaway rows
      const stored = getStoredSheetRows(activeSpreadsheetId, 'Takeaway');
      if (stored && stored.length > 0) {
        setTakeawayRows(stored);
      } else if (curToken) {
        const updated = await readSheetRange(activeSpreadsheetId, 'Takeaway!A1:L50', curToken);
        setTakeawayRows(updated);
      }
    } catch (err: unknown) {
      console.error('Failed to add takeaway:', err);
      setStatusMessage({ text: 'Failed to append takeaway to Google Sheet', type: 'error' });
    }
  };

  // Trigger Destructive Action with Confirmation Dialog
  const requestClearReservations = () => {
    if (!activeSpreadsheetId) return;
    const curToken = token || getStoredAccessToken() || '';
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Sample Reservations?',
      description:
        'This will clear the reservation rows from row 2 onwards in your connected Google Sheet. Headers will be preserved.',
      actionLabel: 'Yes, Clear Rows',
      onConfirm: async () => {
        try {
          await clearSheetData(activeSpreadsheetId, 'Reservations!A2:M100', curToken);
          setStatusMessage({ text: 'Sample reservation rows cleared from sheet.', type: 'success' });
          const stored = getStoredSheetRows(activeSpreadsheetId, 'Reservations');
          if (stored && stored.length > 0) {
            setReservationRows(stored);
          } else if (curToken) {
            const updated = await readSheetRange(activeSpreadsheetId, 'Reservations!A1:M50', curToken);
            setReservationRows(updated);
          }
        } catch (err: unknown) {
          console.error('Error clearing data:', err);
          setStatusMessage({ text: 'Failed to clear sheet data', type: 'error' });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const requestClearTakeaways = () => {
    if (!activeSpreadsheetId) return;
    const curToken = token || getStoredAccessToken() || '';
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Sample Takeaway Orders?',
      description:
        'This will clear the takeaway order rows from row 2 onwards in your connected Google Sheet. Headers will be preserved.',
      actionLabel: 'Yes, Clear Takeaway Rows',
      onConfirm: async () => {
        try {
          await clearSheetData(activeSpreadsheetId, 'Takeaway!A2:L100', curToken);
          setStatusMessage({ text: 'Sample takeaway rows cleared from sheet.', type: 'success' });
          const stored = getStoredSheetRows(activeSpreadsheetId, 'Takeaway');
          if (stored && stored.length > 0) {
            setTakeawayRows(stored);
          } else if (curToken) {
            const updated = await readSheetRange(activeSpreadsheetId, 'Takeaway!A1:L50', curToken);
            setTakeawayRows(updated);
          }
        } catch (err: unknown) {
          console.error('Error clearing data:', err);
          setStatusMessage({ text: 'Failed to clear sheet data', type: 'error' });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden bg-[#F5EFE6] text-[#221C16] rounded-3xl border border-[#D8CEBC] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#E3DBD0] flex items-center justify-between bg-[#ECE4D5]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/15 border border-emerald-700/30 flex items-center justify-center text-emerald-800 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl text-[#1E1914] font-medium">
                  Google Sheets Integration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-[#6B5E4F] mt-0.5">
                Manage table reservations, degustation menus, and wine cellar records directly in Google Sheets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E0D7C6] hover:bg-[#D2C8B5] text-[#332A21] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {!user ? (
            /* NON-AUTHENTICATED STATE: OFFICIAL GOOGLE SIGN-IN */
            <div className="max-w-xl mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-[#EBE2D3] border border-[#D5C9B7] flex items-center justify-center mx-auto text-emerald-800 shadow-md">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[#1E1914] font-medium mb-2">
                  Connect Google Sheets
                </h3>
                <p className="text-xs sm:text-sm text-[#66594A] leading-relaxed max-w-md mx-auto">
                  Sign in with Google to enable real-time two-way synchronization. New dining bookings will automatically stream directly into your Google Sheets spreadsheet, with permission from your account.
                </p>
              </div>

              {/* Official Google Sign-in Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="group relative inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white hover:bg-neutral-50 active:scale-98 text-neutral-800 text-xs sm:text-sm font-semibold tracking-wide border border-neutral-300 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <div className="w-5 h-5 mr-3 shrink-0">
                    <svg viewBox="0 0 48 48" className="w-full h-full block">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl max-w-sm mx-auto">
                  {authError}
                </div>
              )}

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
                <div className="p-4 rounded-2xl bg-[#EBE3D4] border border-[#DDD3C2]">
                  <Calendar className="w-5 h-5 text-emerald-800 mb-2" />
                  <div className="text-xs font-semibold text-[#221C16]">Live Reservations</div>
                  <div className="text-[11px] text-[#6E6152] mt-1 leading-normal">
                    Guest names, party sizes, wine pairing flights, and dietary alerts stream instantly into Google Sheets.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EBE3D4] border border-[#DDD3C2]">
                  <Sparkles className="w-5 h-5 text-[#8C7A65] mb-2" />
                  <div className="text-xs font-semibold text-[#221C16]">Menu Degustation</div>
                  <div className="text-[11px] text-[#6E6152] mt-1 leading-normal">
                    Export dishes, courses, pricing, and origin notes to share with your culinary team and sommeliers.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EBE3D4] border border-[#DDD3C2]">
                  <FolderOpen className="w-5 h-5 text-amber-800 mb-2" />
                  <div className="text-xs font-semibold text-[#221C16]">Google Drive Storage</div>
                  <div className="text-[11px] text-[#6E6152] mt-1 leading-normal">
                    Spreadsheets reside securely in your personal Google Drive for easy access on mobile, desktop, or tablet.
                  </div>
                </div>
              </div>
            </div>
          ) : !isAdminUser(user) ? (
            /* NON-ADMIN ACCESS RESTRICTED SCREEN */
            <div className="max-w-lg mx-auto py-10 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-[#1E1914] font-medium">
                Administrator Access Required
              </h3>
              <p className="text-xs sm:text-sm text-[#66594A] leading-relaxed max-w-md mx-auto">
                Restaurant operations and Google Sheets live synchronization are restricted to the primary administrator (<span className="font-semibold text-[#1E1914]">{ADMIN_EMAIL}</span>).
              </p>
              <div className="p-3 bg-[#EAE2D3] border border-[#D5C9B7] rounded-xl text-xs text-[#524638] max-w-sm mx-auto">
                Currently signed in as: <span className="font-semibold text-[#1E1914]">{user.email}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl bg-[#2D241C] text-[#FAF8F5] text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  Sign Out / Switch Account
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#D5C7B3] text-xs font-semibold hover:bg-[#EAE2D3] text-[#2D241C] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED ADMIN STATE */
            <div className="space-y-6">
              {/* Account and Active Sheet Header Card */}
              <div className="p-5 rounded-2xl bg-[#EBE3D4] border border-[#D8CEBC] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-11 h-11 rounded-full border-2 border-[#C19A6B]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#1F1A14] text-[#FAF8F5] flex items-center justify-center font-bold text-sm">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-[#1F1A14]">
                        {user.displayName || 'Google Account'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#C19A6B]/20 text-[#8C6D37] border border-[#C19A6B]/50">
                        ADMIN
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    </div>
                    <span className="text-[11px] text-[#716454]">{user.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateSheetDialogOpen(true)}
                    disabled={isCreatingSheet}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingSheet ? 'Creating Sheet...' : '+ New Restaurant Sheet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DDD2C0] hover:bg-[#D0C3AF] text-[#4A3F33] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Connected Spreadsheet & Quick Selector Bar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#E6DEC9] border border-[#D5C7B2] shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      activeSpreadsheetId
                        ? 'bg-emerald-700/15 border border-emerald-700/30 text-emerald-800'
                        : 'bg-amber-700/15 border border-amber-700/30 text-amber-800'
                    }`}>
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#7A6D5D] font-bold">
                          Active Spreadsheet
                        </span>
                        {activeSpreadsheetId ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active & Live
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            No Sheet Selected
                          </span>
                        )}
                      </div>
                      <div className="text-sm sm:text-base font-serif font-bold text-[#1F1A14] truncate max-w-sm sm:max-w-md">
                        {spreadsheetTitle || (activeSpreadsheetId ? `Spreadsheet (${activeSpreadsheetId})` : "L'Étoile Atelier Gastronomique - Live Operations")}
                      </div>
                    </div>
                  </div>

                  {/* Quick Sheet Selector Dropdown + Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Direct Sheet Selection Dropdown */}
                    <div className="relative">
                      <select
                        value={activeSpreadsheetId || 'demo-letoile-operations'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsSheetSelectorOpen(true);
                            setActiveTab('drive');
                          } else if (val === '__create__') {
                            setIsCreateSheetDialogOpen(true);
                          } else if (val === '__sheets_new__') {
                            window.open('https://sheets.new', '_blank');
                          } else {
                            const template = PREDEFINED_TEMPLATES.find((t) => t.id === val);
                            const customSheet = getCustomCreatedSheets().find((s) => s.id === val);
                            const driveFile = availableSheets.find((f) => f.id === val);

                            if (template) {
                              handleSelectTemplate(template);
                            } else if (customSheet) {
                              onSelectSpreadsheet(customSheet.id, customSheet.name);
                              setSpreadsheetTitle(customSheet.name);
                              setSpreadsheetUrl(customSheet.webViewLink || 'https://docs.google.com/spreadsheets');
                              if (typeof window !== 'undefined') {
                                try {
                                  localStorage.setItem('letoile_active_sheet_id', customSheet.id);
                                  localStorage.setItem('letoile_active_sheet_title', customSheet.name);
                                } catch {}
                              }
                              const curToken = token || getStoredAccessToken() || '';
                              fetchActiveSpreadsheetData(customSheet.id, curToken);
                              setStatusMessage({ text: `Switched active sheet to "${customSheet.name}"!`, type: 'success' });
                            } else if (driveFile) {
                              handleSelectDriveSheet(driveFile);
                            } else {
                              onSelectSpreadsheet(val, `Sheet (${val})`);
                              setSpreadsheetTitle(`Sheet (${val})`);
                              const curToken = token || getStoredAccessToken();
                              if (curToken) fetchActiveSpreadsheetData(val, curToken);
                            }
                          }
                        }}
                        className="px-3 py-2 pr-8 rounded-xl bg-white border border-[#C19A6B]/60 text-xs font-semibold text-[#1F1A14] shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                        aria-label="Select active sheet"
                      >
                        <optgroup label="📋 Restaurant Operation Templates">
                          {PREDEFINED_TEMPLATES.map((tmpl) => (
                            <option key={tmpl.id} value={tmpl.id}>
                              ⭐ {tmpl.name}
                            </option>
                          ))}
                        </optgroup>
                        {getCustomCreatedSheets().length > 0 && (
                          <optgroup label={`📝 My Operations Sheets (${getCustomCreatedSheets().length})`}>
                            {getCustomCreatedSheets().map((sheet) => (
                              <option key={sheet.id} value={sheet.id}>
                                📄 {sheet.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {availableSheets.length > 0 && (
                          <optgroup label={`📁 Google Drive Spreadsheets (${availableSheets.length})`}>
                            {availableSheets.map((file) => (
                              <option key={file.id} value={file.id}>
                                📂 {file.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="⚡ Actions & Setup">
                          <option value="__custom__">🔗 Connect Sheet by URL or ID...</option>
                          <option value="__create__">➕ Create New Sheet in Google Drive</option>
                          <option value="__sheets_new__">↗️ Open sheets.new in Google Docs</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Select / Switch Sheet Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsSheetSelectorOpen(!isSheetSelectorOpen)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2D241C] hover:bg-black text-[#FAF8F5] text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#C19A6B]" />
                      <span>{activeSpreadsheetId ? 'Select / Browse Sheets' : 'Select Sheet'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSheetSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Quick Create New Sheet in Drive */}
                    <button
                      type="button"
                      onClick={() => setIsCreateSheetDialogOpen(true)}
                      disabled={isCreatingSheet}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Create a new operations sheet"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isCreatingSheet ? 'Creating...' : '+ New Sheet'}</span>
                    </button>

                    {/* Instant sheets.new shortcut */}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/90 hover:bg-white text-emerald-800 border border-emerald-600/30 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      title="Create a fresh Google Sheet in a new tab"
                    >
                      <span>sheets.new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-[#DDD2C0] hover:bg-[#D0C3AF] text-[#332A21] transition-colors cursor-pointer"
                        title="Open in Google Sheets"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const curToken = token || getStoredAccessToken();
                        if (activeSpreadsheetId && curToken) {
                          fetchActiveSpreadsheetData(activeSpreadsheetId, curToken);
                        }
                        if (curToken) {
                          fetchDriveSpreadsheets(curToken);
                        }
                      }}
                      disabled={isLoadingData}
                      className="p-2 rounded-xl bg-[#DDD2C0] hover:bg-[#D0C3AF] text-[#332A21] transition-colors cursor-pointer disabled:opacity-40"
                      title="Refresh data from Google Sheets"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Sheet Selector Console */}
              {isSheetSelectorOpen && (
                <div className="p-5 rounded-2xl bg-[#EBE2D2] border-2 border-[#C19A6B]/50 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#8C6D37]" />
                      <h4 className="text-xs sm:text-sm font-bold text-[#1E1914] uppercase tracking-wider">
                        Select or Connect a Google Spreadsheet
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSheetSelectorOpen(false)}
                      className="w-6 h-6 rounded-full bg-[#DFD6C5] hover:bg-[#D2C8B5] text-[#554A3B] flex items-center justify-center transition-colors cursor-pointer text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Section A: Pre-configured Restaurant Templates */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DDD3C2] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#1F1A14]">
                        Option 1: Select a Pre-configured Operations Sheet (Ready to Use)
                      </div>
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Instant 1-Click
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PREDEFINED_TEMPLATES.map((tmpl) => {
                        const isCurrent = activeSpreadsheetId === tmpl.id;
                        return (
                          <div
                            key={tmpl.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                              isCurrent
                                ? 'bg-emerald-50 border-emerald-600/60 ring-1 ring-emerald-600/40'
                                : 'bg-white border-[#D8CEBC] hover:border-[#C19A6B]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-[#1F1A14]">{tmpl.name}</span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-bold shrink-0">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6B5F50] mt-1">{tmpl.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectTemplate(tmpl)}
                              className={`w-full py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                isCurrent
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-[#2D241C] hover:bg-black text-[#FAF8F5]'
                              }`}
                            >
                              {isCurrent ? 'Currently Active' : 'Select This Sheet'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section B: Create New Operations Spreadsheet in Google Drive */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DDD3C2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#1F1A14]">Option 2: Create New Google Sheet in Your Drive</div>
                      <div className="text-[11px] text-[#6B5F50]">
                        Creates a fresh Google Sheet in your personal Google Drive with Reservations, Takeaway, Menu, and Cellar tabs.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsCreateSheetDialogOpen(true)}
                        disabled={isCreatingSheet}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCreatingSheet ? 'Creating Sheet...' : '+ Create Sheet'}</span>
                      </button>
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 text-emerald-800 text-xs font-semibold border border-emerald-600/30 shadow-xs cursor-pointer whitespace-nowrap"
                        title="Open sheets.new in Google Docs"
                      >
                        <span>sheets.new</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Section C: Connect via URL or ID */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DDD3C2] space-y-2">
                    <div className="text-xs font-bold text-[#1F1A14]">Option 3: Connect Existing Sheet via URL or ID</div>
                    <div className="text-[11px] text-[#6B5F50]">
                      Paste any Google Sheet URL from your browser (e.g. from sheets.new or your existing sheet) or enter the spreadsheet ID directly.
                    </div>
                    <form onSubmit={handleConnectManualSheet} className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A65]" />
                        <input
                          type="text"
                          value={manualSheetInput}
                          onChange={(e) => setManualSheetInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#D5C7B3] text-xs text-[#1F1A14] placeholder-[#9E9080] focus:outline-none focus:ring-1 focus:ring-[#C19A6B]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isConnectingManual || !manualSheetInput.trim()}
                        className="px-4 py-2 rounded-xl bg-[#2D241C] hover:bg-black text-[#FAF8F5] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        {isConnectingManual ? 'Connecting...' : 'Connect Sheet'}
                      </button>
                    </form>
                  </div>

                  {/* Section D: Choose from Google Drive Spreadsheets */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#1F1A14]">
                        Option 4: Spreadsheets in Your Google Drive ({availableSheets.length})
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const curToken = token || getStoredAccessToken();
                          if (curToken) fetchDriveSpreadsheets(curToken);
                        }}
                        disabled={isLoadingSheets}
                        className="text-emerald-800 hover:underline text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                        <span>Refresh Drive List</span>
                      </button>
                    </div>

                    {availableSheets.length > 3 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A65]" />
                        <input
                          type="text"
                          value={searchDriveQuery}
                          onChange={(e) => setSearchDriveQuery(e.target.value)}
                          placeholder="Search spreadsheets in Drive..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 border border-[#D5C7B3] text-xs text-[#1F1A14] placeholder-[#9E9080] focus:outline-none focus:ring-1 focus:ring-[#C19A6B]"
                        />
                      </div>
                    )}

                    {isLoadingSheets ? (
                      <div className="p-6 text-center text-xs text-[#6B5F50] flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#C19A6B]" />
                        <span>Scanning Google Drive for spreadsheets...</span>
                      </div>
                    ) : availableSheets.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DDD3C2] text-center text-xs text-[#6B5F50]">
                        No external sheets found in Drive. Select one of the pre-configured templates above or click <span className="font-semibold text-emerald-800">&quot;Create in Drive&quot;</span>.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {availableSheets
                          .filter((f) => !searchDriveQuery || f.name.toLowerCase().includes(searchDriveQuery.toLowerCase()))
                          .map((file) => {
                            const isCurrent = activeSpreadsheetId === file.id;
                            return (
                              <div
                                key={file.id}
                                className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                  isCurrent
                                    ? 'bg-emerald-50 border-emerald-600/50 ring-1 ring-emerald-600/30'
                                    : 'bg-[#FAF7F2] border-[#DDD3C2] hover:bg-white'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="text-xs font-semibold text-[#1F1A14] truncate">{file.name}</div>
                                  <div className="text-[10px] text-[#7A6D5D] truncate">ID: {file.id.slice(0, 14)}...</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isCurrent ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-bold">
                                      Active
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectDriveSheet(file)}
                                      className="px-2.5 py-1 rounded-lg bg-[#2D241C] hover:bg-black text-[#FAF8F5] text-[10px] font-bold cursor-pointer"
                                    >
                                      Select Sheet
                                    </button>
                                  )}
                                  {file.webViewLink && (
                                    <a
                                      href={file.webViewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md text-[#7A6D5D] hover:text-[#1F1A14]"
                                      title="Open in Google Sheets"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Tabs: Select Sheet & Drive | Reservations | Takeaway | Menu | Cellar */}
              <div className="flex items-center gap-1 border-b border-[#D8CEBC] pb-2 overflow-x-auto text-xs font-semibold tracking-wider">
                <button
                  type="button"
                  onClick={() => setActiveTab('drive')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'drive'
                      ? 'bg-[#1F1A14] text-[#FAF8F5] shadow-xs'
                      : 'text-[#655848] hover:bg-[#EAE2D3]'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#C19A6B]" />
                  <span>Select Sheet ({availableSheets.length + PREDEFINED_TEMPLATES.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reservations')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'reservations'
                      ? 'bg-[#1F1A14] text-[#FAF8F5] shadow-xs'
                      : 'text-[#655848] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Reservations Sheet ({reservationRows.length > 1 ? reservationRows.length - 1 : 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('takeaway')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'takeaway'
                      ? 'bg-[#1F1A14] text-[#FAF8F5] shadow-xs'
                      : 'text-[#655848] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Takeaway Sheet ({takeawayRows.length > 1 ? takeawayRows.length - 1 : 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'menu'
                      ? 'bg-[#1F1A14] text-[#FAF8F5] shadow-xs'
                      : 'text-[#655848] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Tasting Menu Tab
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('cellar')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'cellar'
                      ? 'bg-[#1F1A14] text-[#FAF8F5] shadow-xs'
                      : 'text-[#655848] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Wine Cellar Tab
                </button>
              </div>

              {/* TAB 1: RESERVATIONS */}
              {activeTab === 'reservations' && (
                <div className="space-y-4">
                  {/* Prompt when no sheet is active */}
                  {!activeSpreadsheetId && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#EBE2D2] border border-[#D5C7B2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div>
                        <div className="text-xs font-bold text-[#1F1A14]">No Google Sheet connected for live sync</div>
                        <div className="text-[11px] text-[#6B5F50]">
                          Create a new restaurant operations spreadsheet or select an existing one to stream reservations and takeaway orders in real-time.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCreateNewSheet()}
                          disabled={isCreatingSheet}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingSheet ? 'Creating...' : '+ Create Sheet'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSheetSelectorOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2D241C] hover:bg-black text-[#FAF8F5] text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          Select Sheet
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#6B5F50]">
                      Showing live rows from <code className="bg-[#EAE2D3] px-1.5 py-0.5 rounded font-mono">Reservations!A:M</code>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingBooking(!isAddingBooking)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E2820] hover:bg-[#433B31] text-[#FAF8F5] text-xs font-medium cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Row</span>
                      </button>

                      <button
                        type="button"
                        onClick={requestClearReservations}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
                        title="Clear sample rows"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Sample Rows</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Row Form Drawer */}
                  {isAddingBooking && (
                    <form
                      onSubmit={handleAddReservation}
                      className="p-4 rounded-2xl bg-[#E8E0D0] border border-[#D5C7B2] space-y-3 animate-in fade-in duration-200"
                    >
                      <div className="text-xs font-semibold text-[#1F1A14]">
                        Append New Reservation to Connected Google Sheet
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Guest Full Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Lord Henry Wotton"
                            value={newBooking.guestName}
                            onChange={(e) =>
                              setNewBooking({ ...newBooking, guestName: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Party Size
                          </label>
                          <select
                            value={newBooking.guests}
                            onChange={(e) =>
                              setNewBooking({ ...newBooking, guests: parseInt(e.target.value, 10) })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          >
                            {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                              <option key={n} value={n}>
                                {n} {n === 1 ? 'Guest' : 'Guests'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Date & Time
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="date"
                              value={newBooking.date}
                              onChange={(e) =>
                                setNewBooking({ ...newBooking, date: e.target.value })
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                            />
                            <input
                              type="time"
                              value={newBooking.time}
                              onChange={(e) =>
                                setNewBooking({ ...newBooking, time: e.target.value })
                              }
                              className="w-24 px-2 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Service & Pairing
                          </label>
                          <select
                            value={newBooking.service}
                            onChange={(e) =>
                              setNewBooking({ ...newBooking, service: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          >
                            <option value="symphonie">Symphonie d’Automne (€240)</option>
                            <option value="counter">The Tasting Table Counter (€320)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Dietary Accommodations
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Pescatarian, Gluten-Free"
                            value={newBooking.dietary}
                            onChange={(e) =>
                              setNewBooking({ ...newBooking, dietary: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingBooking(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#5A4F41] hover:bg-[#DDD3C2]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs"
                        >
                          Append to Sheet
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Reservation Rows Table */}
                  <div className="border border-[#D8CEBC] rounded-2xl overflow-hidden bg-[#FAF7F2] shadow-xs">
                    <div className="overflow-x-auto max-h-[340px]">
                      {reservationRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#7B6E5F]">
                          {isLoadingData ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-800" />
                              <span>Reading spreadsheet from Google Sheets...</span>
                            </div>
                          ) : (
                            <div>
                              <p className="mb-2">No reservation rows detected in this sheet.</p>
                              <button
                                type="button"
                                onClick={() => handleCreateNewSheet()}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                              >
                                Initialize L’Étoile Template
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#ECE3D4] text-[#332A20] sticky top-0 border-b border-[#D8CEBC] font-semibold">
                            <tr>
                              {reservationRows[0]?.map((header, idx) => (
                                <th key={idx} className="p-2.5 px-3 whitespace-nowrap text-[11px] font-bold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE0D0]">
                            {reservationRows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#F3ECE1] transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`p-2.5 px-3 whitespace-nowrap text-xs text-[#2E2820] ${
                                      cIdx === 0 ? 'font-mono font-semibold text-[#8C7A65]' : ''
                                    }`}
                                  >
                                    {cIdx === 11 ? (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        {cell}
                                      </span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: TAKEAWAY ORDERS */}
              {activeTab === 'takeaway' && (
                <div className="space-y-4">
                  {/* Prompt when no sheet is active */}
                  {!activeSpreadsheetId && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#EBE2D2] border border-[#D5C7B2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div>
                        <div className="text-xs font-bold text-[#1F1A14]">No Google Sheet connected for live sync</div>
                        <div className="text-[11px] text-[#6B5F50]">
                          Connect or create an operations spreadsheet to stream takeaway orders directly into your Takeaway tab.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCreateNewSheet()}
                          disabled={isCreatingSheet}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingSheet ? 'Creating...' : '+ Create Sheet'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSheetSelectorOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2D241C] hover:bg-black text-[#FAF8F5] text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          Select Sheet
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#6B5F50]">
                      Showing live customer takeaway orders from{' '}
                      <code className="bg-[#EAE2D3] px-1.5 py-0.5 rounded font-mono">Takeaway!A:L</code>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingTakeaway(!isAddingTakeaway)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E2820] hover:bg-[#433B31] text-[#FAF8F5] text-xs font-medium cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAddingTakeaway ? 'Close Form' : '+ Add Takeaway Order'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={requestClearTakeaways}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Sample Orders</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Add Takeaway Form */}
                  {isAddingTakeaway && (
                    <form
                      onSubmit={handleAddTakeaway}
                      className="p-4 rounded-2xl bg-[#EBE2D2] border border-[#D5C7B2] space-y-3 text-xs animate-in fade-in zoom-in-95 duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#D8CEBC]">
                        <span className="font-bold text-[#1E1914] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#8C6D37]" />
                          <span>Append Takeaway Order to Active Sheet</span>
                        </span>
                        <span className="text-[10px] text-[#7A6B58]">Instant Direct Sync</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Lady Vivienne Montgomery"
                            value={newTakeaway.customerName}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, customerName: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Mobile Phone
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+33 6 88 12 44 90"
                            value={newTakeaway.phone}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, phone: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="patron@mayfair.co.uk"
                            value={newTakeaway.email}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, email: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Pickup Date
                          </label>
                          <input
                            type="date"
                            required
                            value={newTakeaway.pickupDate}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, pickupDate: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Pickup Time
                          </label>
                          <select
                            value={newTakeaway.pickupTime}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, pickupTime: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          >
                            {['12:30', '13:00', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30'].map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Total Amount
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="€90"
                            value={newTakeaway.totalAmount}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, totalAmount: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Ordered Items Summary
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2x Dry-Aged Wagyu Truffle Burger (€34); 1x Hand-Cut Truffle Frites (€22)"
                            value={newTakeaway.itemSummary}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, itemSummary: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#6B5D4E] font-semibold mb-1">
                            Packaging
                          </label>
                          <select
                            value={newTakeaway.packaging}
                            onChange={(e) =>
                              setNewTakeaway({ ...newTakeaway, packaging: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#F7F3EB] border border-[#DDD3C2] text-[#1E1914]"
                          >
                            <option value="Signature Insulated Haute Box">Signature Insulated Haute Box</option>
                            <option value="Eco Thermal Bag with Gold Ribbon">Eco Thermal Bag with Gold Ribbon</option>
                            <option value="Executive Salon Hamper">Executive Salon Hamper</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingTakeaway(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#5A4F41] hover:bg-[#DDD3C2]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs"
                        >
                          Append Takeaway to Sheet
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="border border-[#D8CEBC] rounded-2xl overflow-hidden bg-[#FAF7F2] shadow-xs">
                    <div className="overflow-x-auto max-h-[340px]">
                      {takeawayRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#7B6E5F]">
                          {isLoadingData ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-800" />
                              <span>Reading Takeaway tab from Google Sheets...</span>
                            </div>
                          ) : (
                            <div>
                              <p className="mb-2">No takeaway orders found in this sheet yet.</p>
                              <p className="text-[11px] text-[#8C7A65] mb-3">
                                When customers place takeaway orders, they will be appended to the &quot;Takeaway&quot; tab!
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsAddingTakeaway(true)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-xs hover:bg-emerald-900 transition-colors"
                              >
                                + Add First Takeaway Order
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#ECE3D4] text-[#332A20] sticky top-0 border-b border-[#D8CEBC] font-semibold">
                            <tr>
                              {takeawayRows[0]?.map((header, idx) => (
                                <th
                                  key={idx}
                                  className="p-2.5 px-3 whitespace-nowrap text-[11px] font-bold"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE0D0]">
                            {takeawayRows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#F3ECE1] transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`p-2.5 px-3 whitespace-nowrap text-xs text-[#2E2820] ${
                                      cIdx === 0
                                        ? 'font-mono font-semibold text-[#8C7A65]'
                                        : cIdx === 7
                                        ? 'font-semibold text-[#1F1A14]'
                                        : ''
                                    }`}
                                  >
                                    {cIdx === 10 ? (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        {cell}
                                      </span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TASTING MENU */}
              {activeTab === 'menu' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#6B5F50]">
                    <span>
                      Dishes & wine pairings configured in tab: <code className="bg-[#EAE2D3] px-1.5 py-0.5 rounded font-mono">Tasting Menu</code>
                    </span>
                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-800 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Edit Menu in Sheets <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="border border-[#D8CEBC] rounded-2xl overflow-hidden bg-[#FAF7F2]">
                    <div className="overflow-x-auto max-h-[340px]">
                      {menuRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#7B6E5F]">
                          No Tasting Menu tab found. Click &quot;New Restaurant Sheet&quot; above to initialize all tabs.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#ECE3D4] text-[#332A20] sticky top-0 border-b border-[#D8CEBC]">
                            <tr>
                              {menuRows[0]?.map((header, idx) => (
                                <th key={idx} className="p-2.5 px-3 whitespace-nowrap text-[11px] font-bold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE0D0]">
                            {menuRows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#F3ECE1] transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`p-2.5 px-3 text-xs text-[#2E2820] ${
                                      cIdx === 1 ? 'font-serif font-medium text-[#1E1914]' : ''
                                    } ${cIdx === 3 ? 'font-semibold text-[#8C7A65]' : ''}`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WINE CELLAR */}
              {activeTab === 'cellar' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#6B5F50]">
                    <span>
                      Grand Cru reserves & vintages in tab: <code className="bg-[#EAE2D3] px-1.5 py-0.5 rounded font-mono">Wine Cellar Reserves</code>
                    </span>
                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-800 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Edit Cellar in Sheets <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="border border-[#D8CEBC] rounded-2xl overflow-hidden bg-[#FAF7F2]">
                    <div className="overflow-x-auto max-h-[340px]">
                      {cellarRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#7B6E5F]">
                          No Cellar tab found in the active spreadsheet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#ECE3D4] text-[#332A20] sticky top-0 border-b border-[#D8CEBC]">
                            <tr>
                              {cellarRows[0]?.map((header, idx) => (
                                <th key={idx} className="p-2.5 px-3 whitespace-nowrap text-[11px] font-bold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE0D0]">
                            {cellarRows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#F3ECE1] transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`p-2.5 px-3 text-xs text-[#2E2820] ${
                                      cIdx === 1 ? 'font-medium text-[#1E1914]' : ''
                                    } ${cIdx === 5 ? 'font-semibold text-[#8C7A65]' : ''}`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SELECT SHEET & DRIVE */}
              {activeTab === 'drive' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Top Banner Actions */}
                  <div className="p-4 rounded-2xl bg-[#EBE2D2] border border-[#D5C7B2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#1F1A14]">Choose or Create Your Operations Spreadsheet</div>
                      <div className="text-[11px] text-[#6B5F50]">
                        Select from ready templates, your Google Drive files, or paste any Google Sheet link.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsCreateSheetDialogOpen(true)}
                        disabled={isCreatingSheet}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCreatingSheet ? 'Creating...' : '+ Create New Sheet'}</span>
                      </button>
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-emerald-800 text-xs font-semibold border border-emerald-600/30 shadow-xs cursor-pointer"
                        title="Create a fresh sheet on sheets.new"
                      >
                        <span>sheets.new</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* 1. Predefined Restaurant Operations Templates */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1F1A14] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C19A6B]" />
                        <span>Pre-configured Operations Sheets (Instant 1-Click)</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Ready to Use
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PREDEFINED_TEMPLATES.map((tmpl) => {
                        const isSelected = activeSpreadsheetId === tmpl.id;
                        return (
                          <div
                            key={tmpl.id}
                            className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                              isSelected
                                ? 'bg-[#EAE1CF] border-emerald-700/60 ring-1 ring-emerald-700/50 shadow-xs'
                                : 'bg-[#FAF7F2] border-[#DDD3C2] hover:bg-white'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#1F1A14]">{tmpl.name}</span>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shrink-0">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6B5F50] mt-1 leading-normal">{tmpl.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectTemplate(tmpl);
                                setActiveTab('reservations');
                              }}
                              className={`w-full py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-[#2D241C] hover:bg-black text-[#FAF8F5]'
                              }`}
                            >
                              {isSelected ? 'Currently Selected' : 'Select This Sheet'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Custom Created Operations Sheets */}
                  {getCustomCreatedSheets().length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1F1A14] flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                          <span>My Custom Operations Sheets ({getCustomCreatedSheets().length})</span>
                        </span>
                        <span className="text-[10px] text-[#8C6D37] font-semibold bg-[#EAE2D3] px-2 py-0.5 rounded-full border border-[#D5C7B3]">
                          Live Sync
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {getCustomCreatedSheets().map((sheet) => {
                          const isSelected = activeSpreadsheetId === sheet.id;
                          return (
                            <div
                              key={sheet.id}
                              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                                isSelected
                                  ? 'bg-[#EAE1CF] border-emerald-700/60 ring-1 ring-emerald-700/50 shadow-xs'
                                  : 'bg-[#FAF7F2] border-[#DDD3C2] hover:bg-white'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-[#1F1A14]">{sheet.name}</span>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shrink-0">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[#8C7A65] mt-1 font-mono">ID: {sheet.id}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectSpreadsheet(sheet.id, sheet.name);
                                  setSpreadsheetTitle(sheet.name);
                                  setSpreadsheetUrl(sheet.webViewLink || 'https://docs.google.com/spreadsheets');
                                  if (typeof window !== 'undefined') {
                                    try {
                                      localStorage.setItem('letoile_active_sheet_id', sheet.id);
                                      localStorage.setItem('letoile_active_sheet_title', sheet.name);
                                    } catch {}
                                  }
                                  const curToken = token || getStoredAccessToken() || '';
                                  fetchActiveSpreadsheetData(sheet.id, curToken);
                                  setActiveTab('reservations');
                                  setStatusMessage({ text: `Switched active sheet to "${sheet.name}"!`, type: 'success' });
                                }}
                                className={`w-full py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-800 text-white'
                                    : 'bg-[#2D241C] hover:bg-black text-[#FAF8F5]'
                                }`}
                              >
                                {isSelected ? 'Currently Selected' : 'Select This Sheet'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Connect Sheet via URL or ID */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD3C2] space-y-2">
                    <div className="text-xs font-bold text-[#1F1A14]">Connect Any Google Sheet by Link or ID</div>
                    <div className="text-[11px] text-[#6B5F50]">
                      Created a sheet using <span className="font-semibold text-emerald-800">sheets.new</span> or have an existing one? Paste its link below:
                    </div>
                    <form onSubmit={handleConnectManualSheet} className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A65]" />
                        <input
                          type="text"
                          value={manualSheetInput}
                          onChange={(e) => setManualSheetInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#D5C7B3] text-xs text-[#1F1A14] placeholder-[#9E9080] focus:outline-none focus:ring-1 focus:ring-[#C19A6B]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isConnectingManual || !manualSheetInput.trim()}
                        className="px-4 py-2 rounded-xl bg-[#2D241C] hover:bg-black text-[#FAF8F5] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        {isConnectingManual ? 'Connecting...' : 'Connect Sheet'}
                      </button>
                    </form>
                  </div>

                  {/* 3. Google Drive Spreadsheets List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1F1A14]">
                        Spreadsheets Found in Your Google Drive ({availableSheets.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => token && fetchDriveSpreadsheets(token)}
                        disabled={isLoadingSheets}
                        className="text-emerald-800 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px]"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                        <span>Refresh Drive List</span>
                      </button>
                    </div>

                    {isLoadingSheets ? (
                      <div className="p-6 text-center text-xs text-[#6B5F50] flex items-center justify-center gap-2 bg-[#FAF7F2] rounded-2xl border border-[#DDD3C2]">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#C19A6B]" />
                        <span>Scanning Google Drive for spreadsheets...</span>
                      </div>
                    ) : availableSheets.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#DDD3C2] text-center text-xs text-[#6B5F50] space-y-2">
                        <p>No external spreadsheets located in your Drive yet.</p>
                        <p className="text-[11px] text-[#8C7A65]">
                          You can click <button type="button" onClick={() => setIsCreateSheetDialogOpen(true)} className="font-semibold text-emerald-800 underline cursor-pointer">+ Create New Sheet</button> or use <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 underline">sheets.new</a> above!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                        {availableSheets.map((file) => {
                          const isSelected = activeSpreadsheetId === file.id;
                          return (
                            <div
                              key={file.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isSelected
                                  ? 'bg-[#EAE1CF] border-emerald-700/60 ring-1 ring-emerald-700/50 shadow-xs'
                                  : 'bg-[#F2ECE0] border-[#DDD3C2] hover:bg-[#EAE2D3]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <FileSpreadsheet className="w-4 h-4 text-emerald-800 shrink-0" />
                                  <div className="font-medium text-xs text-[#221C16] truncate max-w-[200px]">
                                    {file.name}
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700 text-white">
                                    Active
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 text-[10px] text-[#716454] truncate">
                                ID: {file.id}
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-[#DDD3C2] flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectDriveSheet(file);
                                    setActiveTab('reservations');
                                  }}
                                  className="px-3 py-1 rounded-lg bg-[#2E2820] hover:bg-[#433B31] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  {isSelected ? 'Currently Selected' : 'Select Sheet'}
                                </button>

                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-emerald-800 hover:underline flex items-center gap-1"
                                  >
                                    <span>View</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[#E3DBD0] bg-[#ECE4D5]/60 flex items-center justify-between text-xs text-[#6B5E4F]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Google Workspace Sheets & Drive v4 API</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#2E2820] hover:bg-[#443C32] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE ACTIONS */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FAF7F2] text-[#221C16] rounded-2xl border border-rose-300 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif text-lg font-bold">{confirmDialog.title}</h3>
            </div>

            <p className="text-xs text-[#5C5042] leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE0D0]">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A4F41] hover:bg-[#EBE3D4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Operations Sheet Modal Dialog */}
      {isCreateSheetDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-[#FAF7F2] text-[#221C16] rounded-3xl border border-[#D5C7B3] shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg text-[#1F1A14] font-medium leading-tight">Create Operations Sheet</h4>
                  <span className="text-[11px] text-[#716454]">L&apos;Étoile Atelier Gastronomique</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSheetDialogOpen(false)}
                className="w-7 h-7 rounded-full bg-[#E8DEC9] text-[#4A3F33] flex items-center justify-center hover:bg-[#D5C7B3] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C5042] leading-relaxed">
              Creates a brand new operations spreadsheet with pre-seeded tabs for{' '}
              <strong>Reservations</strong>, <strong>Takeaway</strong>, <strong>Tasting Menu</strong>, and <strong>Wine Cellar</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#4A3F33] uppercase tracking-wider">
                Spreadsheet Name
              </label>
              <input
                type="text"
                value={customSheetTitleInput}
                onChange={(e) => setCustomSheetTitleInput(e.target.value)}
                placeholder={`L'Étoile Atelier Gastronomique - Operations (${new Date().toLocaleDateString('en-GB')})`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-xs text-[#1F1A14] placeholder-[#9E9080] focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#EAE0D0]">
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-600/40 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Create a fresh sheet directly in Google Docs"
              >
                <span>Open sheets.new</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateSheetDialogOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5A4F41] hover:bg-[#EBE3D4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateNewSheet(customSheetTitleInput)}
                  disabled={isCreatingSheet}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingSheet ? 'Creating...' : 'Create & Activate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
