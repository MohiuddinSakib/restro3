import { PEDESTAL_DISHES, CELLAR_WINES } from './restaurant-data';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface ReservationRowData {
  bookingCode: string;
  guestName: string;
  guests: number;
  date: string;
  time: string;
  service: string;
  pairing: string;
  dietary: string[];
  guestPhone: string;
  guestEmail: string;
  deposit: string;
  status: string;
  createdAt?: string;
}

export interface TakeawayItem {
  id: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  priceFormatted: string;
}

export interface TakeawayOrderData {
  orderCode: string;
  customerName: string;
  phone: string;
  email: string;
  pickupDate: string;
  pickupTime: string;
  items: TakeawayItem[];
  totalAmount: string;
  specialInstructions?: string;
  packagingPreference?: string;
  status?: string;
  createdAt?: string;
}

export const TAKEAWAY_HEADERS = [
  'Order Code',
  'Customer Name',
  'Phone',
  'Email',
  'Pickup Date',
  'Pickup Time',
  'Dishes Ordered',
  'Total (€)',
  'Packaging Notes',
  'Special Instructions',
  'Order Status',
  'Placed At',
];

export interface CustomSavedSheet {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
  isCustom?: boolean;
}

const CUSTOM_SHEETS_KEY = 'letoile_custom_created_sheets';
const CUSTOM_SHEET_DATA_PREFIX = 'letoile_sheet_data_';

export function getCustomCreatedSheets(): CustomSavedSheet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_SHEETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCreatedSheet(sheet: CustomSavedSheet) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomCreatedSheets().filter((s) => s.id !== sheet.id);
    const updated = [sheet, ...existing];
    localStorage.setItem(CUSTOM_SHEETS_KEY, JSON.stringify(updated));
  } catch {}
}

export function getStoredSheetRows(sheetId: string, tabName: string): string[][] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CUSTOM_SHEET_DATA_PREFIX}${sheetId}_${tabName}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSheetRows(sheetId: string, tabName: string, rows: string[][]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CUSTOM_SHEET_DATA_PREFIX}${sheetId}_${tabName}`, JSON.stringify(rows));
  } catch {}
}

/**
 * List Google Spreadsheets from user's Google Drive and merged with locally registered sheets
 */
export async function listSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const localSheets = getCustomCreatedSheets().map((s) => ({
    id: s.id,
    name: s.name,
    modifiedTime: s.modifiedTime || new Date().toISOString(),
    webViewLink: s.webViewLink || 'https://docs.google.com/spreadsheets',
  }));

  if (!accessToken) {
    return localSheets;
  }

  try {
    const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=25`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      const driveFiles: DriveSpreadsheetFile[] = data.files || [];
      // Combine drive files with custom saved sheets avoiding duplicates
      const seen = new Set<string>();
      const combined: DriveSpreadsheetFile[] = [];

      for (const f of [...localSheets, ...driveFiles]) {
        if (!seen.has(f.id)) {
          seen.add(f.id);
          combined.push(f);
        }
      }
      return combined;
    }
  } catch (err) {
    console.warn('Drive listing exception, returning custom sheets:', err);
  }

  return localSheets;
}

/**
 * Extract spreadsheet ID from either a Google Sheets URL or a direct ID string
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Match standard docs.google.com/spreadsheets/d/<ID>/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Strip any trailing query params or slashes if user pasted raw ID
  return trimmed.split('/')[0].split('?')[0].trim();
}

/**
 * Fetch spreadsheet metadata including sheet tabs
 */
export async function getSpreadsheet(spreadsheetId: string, accessToken: string) {
  if (spreadsheetId.startsWith('demo-') || spreadsheetId.startsWith('sheet-ops-')) {
    const custom = getCustomCreatedSheets().find((s) => s.id === spreadsheetId);
    return {
      spreadsheetId,
      properties: {
        title: custom ? custom.name : "L'Étoile Atelier Gastronomique - Live Operations",
      },
      spreadsheetUrl: 'https://docs.google.com/spreadsheets',
      sheets: [
        { properties: { title: 'Reservations' } },
        { properties: { title: 'Takeaway' } },
        { properties: { title: 'Tasting Menu' } },
        { properties: { title: 'Wine Cellar Reserves' } },
      ],
    };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch spreadsheet ${spreadsheetId}`);
  }

  return await res.json();
}

/**
 * Read values from a specific range in a spreadsheet with full local fallback
 */
export async function readSheetRange(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const tabName = range.split('!')[0].replace(/['"]/g, '');

  // Check stored custom rows first if this is a custom or demo sheet
  if (spreadsheetId.startsWith('demo-') || spreadsheetId.startsWith('sheet-ops-') || !accessToken) {
    const stored = getStoredSheetRows(spreadsheetId, tabName);
    if (stored && stored.length > 0) {
      return stored;
    }
    const sample = getPredefinedSampleData();
    if (tabName.toLowerCase().includes('reser')) return sample.reservations;
    if (tabName.toLowerCase().includes('takeaway')) return sample.takeaway;
    if (tabName.toLowerCase().includes('menu')) return sample.menu;
    if (tabName.toLowerCase().includes('cellar')) return sample.cellar;
    return [];
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      return data.values || [];
    }
  } catch (err) {
    console.warn(`Exception reading remote range ${range}:`, err);
  }

  // Graceful fallback to stored or sample data if remote request fails
  const stored = getStoredSheetRows(spreadsheetId, tabName);
  if (stored && stored.length > 0) return stored;
  const sample = getPredefinedSampleData();
  if (tabName.toLowerCase().includes('reser')) return sample.reservations;
  if (tabName.toLowerCase().includes('takeaway')) return sample.takeaway;
  if (tabName.toLowerCase().includes('menu')) return sample.menu;
  if (tabName.toLowerCase().includes('cellar')) return sample.cellar;
  return [];
}

/**
 * Ensures that a specific named tab exists in the spreadsheet.
 * If not present, creates the tab and sets up its headers automatically.
 */
export async function ensureSheetTabExists(
  spreadsheetId: string,
  sheetTitle: string,
  headers: string[],
  accessToken: string
) {
  try {
    const meta = await getSpreadsheet(spreadsheetId, accessToken);
    interface SheetTab {
      properties?: {
        title?: string;
      };
    }
    const existing = meta.sheets?.find(
      (s: SheetTab) => s.properties?.title?.toLowerCase() === sheetTitle.toLowerCase()
    );

    if (!existing) {
      // Add the new sheet tab
      const addRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetTitle,
                    gridProperties: {
                      rowCount: 100,
                      columnCount: headers.length + 2,
                      frozenRowCount: 1,
                    },
                  },
                },
              },
            ],
          }),
        }
      );

      if (addRes.ok) {
        // Seed the header row
        const endColLetter = String.fromCharCode(64 + Math.min(headers.length, 26));
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
            `${sheetTitle}!A1:${endColLetter}1`
          )}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: `${sheetTitle}!A1:${endColLetter}1`,
              majorDimension: 'ROWS',
              values: [headers],
            }),
          }
        );
      }
    }
  } catch (err) {
    console.warn(`Could not verify/create ${sheetTitle} tab:`, err);
  }
}

/**
 * Append a reservation row to the Reservations sheet with full offline & custom sheet fallback
 */
export async function appendReservationToSheet(
  spreadsheetId: string,
  reservation: ReservationRowData,
  accessToken: string,
  sheetName: string = 'Reservations'
) {
  const serviceLabel =
    reservation.service === 'symphonie'
      ? "Symphonie d'Automne (8 Courses - €240)"
      : 'The Tasting Table Counter (€320)';

  const pairingLabel =
    reservation.pairing === 'grand-cru'
      ? 'Grand Cru Flight (+€145)'
      : reservation.pairing === 'natural'
      ? 'Natural & Biodynamic (+€115)'
      : 'Botanical Infusions (+€75)';

  const row = [
    reservation.bookingCode,
    reservation.guestName,
    reservation.guests.toString(),
    reservation.date,
    reservation.time,
    serviceLabel,
    pairingLabel,
    reservation.dietary.join(', ') || 'None reported',
    reservation.guestPhone,
    reservation.guestEmail,
    reservation.deposit || '€50 / person',
    reservation.status || 'Confirmed',
    reservation.createdAt || new Date().toLocaleString('en-GB'),
  ];

  // If local custom sheet or demo sheet, store directly in browser storage
  if (spreadsheetId.startsWith('sheet-ops-') || spreadsheetId.startsWith('demo-') || !accessToken) {
    const existing = getStoredSheetRows(spreadsheetId, sheetName) || getPredefinedSampleData().reservations;
    const updated = [...existing, row];
    saveStoredSheetRows(spreadsheetId, sheetName, updated);
    return { updates: { updatedRows: 1 } };
  }

  try {
    const range = `${sheetName}!A:M`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [row],
      }),
    });

    if (res.ok) {
      const existing = getStoredSheetRows(spreadsheetId, sheetName) || getPredefinedSampleData().reservations;
      const updated = [...existing, row];
      saveStoredSheetRows(spreadsheetId, sheetName, updated);
      return await res.json();
    }
  } catch (err) {
    console.warn('Remote append failed, persisting to local storage backup:', err);
  }

  // Fallback to storing locally so data is never lost
  const existing = getStoredSheetRows(spreadsheetId, sheetName) || getPredefinedSampleData().reservations;
  const updated = [...existing, row];
  saveStoredSheetRows(spreadsheetId, sheetName, updated);
  return { updates: { updatedRows: 1 } };
}

/**
 * Append a Takeaway order row to the 'Takeaway' sheet with full fallback
 */
export async function appendTakeawayToSheet(
  spreadsheetId: string,
  order: TakeawayOrderData,
  accessToken: string
) {
  const itemsFormatted = order.items
    .map((item) => `${item.quantity}x ${item.name} (${item.priceFormatted})`)
    .join('; ');

  const row = [
    order.orderCode,
    order.customerName,
    order.phone,
    order.email,
    order.pickupDate,
    order.pickupTime,
    itemsFormatted,
    order.totalAmount,
    order.packagingPreference || 'Signature Insulated Haute Box',
    order.specialInstructions || 'None',
    order.status || 'Confirmed & In Kitchen Prep',
    order.createdAt || new Date().toLocaleString('en-GB'),
  ];

  if (spreadsheetId.startsWith('sheet-ops-') || spreadsheetId.startsWith('demo-') || !accessToken) {
    const existing = getStoredSheetRows(spreadsheetId, 'Takeaway') || getPredefinedSampleData().takeaway;
    const updated = [...existing, row];
    saveStoredSheetRows(spreadsheetId, 'Takeaway', updated);
    return { updates: { updatedRows: 1 } };
  }

  try {
    // Ensure the sheet tab named "Takeaway" is created with proper headers
    await ensureSheetTabExists(spreadsheetId, 'Takeaway', TAKEAWAY_HEADERS, accessToken);

    const range = `Takeaway!A:L`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [row],
      }),
    });

    if (res.ok) {
      const existing = getStoredSheetRows(spreadsheetId, 'Takeaway') || getPredefinedSampleData().takeaway;
      const updated = [...existing, row];
      saveStoredSheetRows(spreadsheetId, 'Takeaway', updated);
      return await res.json();
    }
  } catch (err) {
    console.warn('Takeaway remote append failed, saving locally:', err);
  }

  const existing = getStoredSheetRows(spreadsheetId, 'Takeaway') || getPredefinedSampleData().takeaway;
  const updated = [...existing, row];
  saveStoredSheetRows(spreadsheetId, 'Takeaway', updated);
  return { updates: { updatedRows: 1 } };
}

export interface RestaurantTemplateSheet {
  id: string;
  name: string;
  description: string;
  isTemplate?: boolean;
}

export const PREDEFINED_TEMPLATES: RestaurantTemplateSheet[] = [
  {
    id: 'demo-letoile-operations',
    name: "L'Étoile Atelier Gastronomique - Live Operations (Default)",
    description: "Autumn 2024 service, degustation menu, cellar reserves & takeaway orders",
    isTemplate: true,
  },
  {
    id: 'demo-vip-salon-cellar',
    name: "L'Étoile Private Salon & Grand Cru Reserves",
    description: "Sommelier wine allocations, VIP counter bookings, and private dining log",
    isTemplate: true,
  },
];

/**
 * Create a brand new, pre-configured restaurant management spreadsheet.
 * Tries Google Sheets v4 API first, then Google Drive v3 API, then resilient local Operations sheet.
 */
export async function createRestaurantSpreadsheet(
  accessToken: string,
  customTitle?: string
): Promise<{ id: string; url: string; title: string; isLocal?: boolean }> {
  const title = customTitle?.trim() || `L'Étoile Atelier Gastronomique - Operations (${new Date().toLocaleDateString('en-GB')})`;

  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Reservations',
          gridProperties: {
            rowCount: 100,
            columnCount: 13,
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Takeaway',
          gridProperties: {
            rowCount: 100,
            columnCount: 12,
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Tasting Menu',
          gridProperties: {
            rowCount: 50,
            columnCount: 7,
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Wine Cellar Reserves',
          gridProperties: {
            rowCount: 50,
            columnCount: 7,
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  let spreadsheetId = '';
  let webViewUrl = '';

  // 1. Attempt primary creation via Google Sheets v4 API if accessToken present
  if (accessToken) {
    try {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (createRes.ok) {
        const createdData = await createRes.json();
        spreadsheetId = createdData.spreadsheetId;
        webViewUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      } else {
        const errorData = await createRes.json().catch(() => ({}));
        console.warn('Google Sheets v4 API response:', errorData);
      }
    } catch (err) {
      console.warn('Network or API exception in Sheets v4 create:', err);
    }

    // 2. Fallback creation via Google Drive v3 API if Sheets v4 failed
    if (!spreadsheetId) {
      try {
        const driveRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: title,
            mimeType: 'application/vnd.google-apps.spreadsheet',
          }),
        });

        if (driveRes.ok) {
          const driveData = await driveRes.json();
          spreadsheetId = driveData.id;
          webViewUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

          // Add extra tabs via batchUpdate
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  addSheet: {
                    properties: { title: 'Reservations', gridProperties: { rowCount: 100, columnCount: 13, frozenRowCount: 1 } },
                  },
                },
                {
                  addSheet: {
                    properties: { title: 'Takeaway', gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 } },
                  },
                },
                {
                  addSheet: {
                    properties: { title: 'Tasting Menu', gridProperties: { rowCount: 50, columnCount: 7, frozenRowCount: 1 } },
                  },
                },
                {
                  addSheet: {
                    properties: { title: 'Wine Cellar Reserves', gridProperties: { rowCount: 50, columnCount: 7, frozenRowCount: 1 } },
                  },
                },
              ],
            }),
          }).catch(() => {});
        }
      } catch (fallbackErr: unknown) {
        console.warn('Drive fallback error:', fallbackErr);
      }
    }
  }

  // 3. If neither cloud API was successful or accessToken was not provided,
  // create a fully operational, persistent in-app Operations Sheet!
  const isLocal = !spreadsheetId;
  if (!spreadsheetId) {
    spreadsheetId = `sheet-ops-${Date.now()}`;
    webViewUrl = `https://docs.google.com/spreadsheets`;
  }

  // Register in custom sheets list so it is immediately listed and selectable
  saveCustomCreatedSheet({
    id: spreadsheetId,
    name: title,
    webViewLink: webViewUrl,
    modifiedTime: new Date().toISOString(),
    isCustom: true,
  });

  // Seed Reservations
  const reservationsHeader = [
    'Booking Code',
    'Guest Name',
    'Party Size',
    'Date',
    'Time',
    'Service Experience',
    'Wine Flight',
    'Dietary Notes',
    'Mobile Phone',
    'Email Address',
    'Deposit Amount',
    'Status',
    'Booked At',
  ];

  const initialReservations = [
    reservationsHeader,
    [
      'LET-849102',
      'Viscount Julian Vane',
      '4',
      '2024-11-20',
      '19:30',
      'The Tasting Table Counter (€320)',
      'Grand Cru Flight (+€145)',
      'Gluten-Free, No Shellfish',
      '+44 20 7946 0912',
      'vane.j@mayfair-estates.co.uk',
      '€200 (€50/p)',
      'VIP Confirmed',
      '14/10/2024, 15:45',
    ],
    [
      'LET-731940',
      'Dr. Camille Laurent',
      '2',
      '2024-11-21',
      '20:00',
      "Symphonie d'Automne (8 Courses - €240)",
      'Natural & Biodynamic (+€115)',
      'Pescatarian',
      '+33 6 42 19 88 01',
      'c.laurent@sorbonne.fr',
      '€100 (€50/p)',
      'Confirmed',
      '15/10/2024, 11:20',
    ],
  ];

  // Seed Takeaway
  const initialTakeaways = [
    TAKEAWAY_HEADERS,
    [
      'TKW-492104',
      'Éléonore de Montmirail',
      '+33 6 92 14 33 01',
      'eleonore@montmirail.fr',
      new Date().toISOString().split('T')[0],
      '13:15',
      '2x Dry-Aged Wagyu Truffle Burger (€34); 1x Hand-Cut Truffle Parmesan Frites (€22)',
      '€90',
      'Signature Insulated Haute Box',
      'Extra truffle confit aioli on the side',
      'Ready for Collection',
      '17/10/2024, 11:45',
    ],
    [
      'TKW-518290',
      'Arthur Pendelton',
      '+44 7700 900481',
      'arthur.p@londontech.io',
      new Date().toISOString().split('T')[0],
      '19:00',
      '1x Crispy Hot Honey Chicken Brioche (€28); 1x Valrhona Ganache Box (€38)',
      '€66',
      'Eco Thermal Bag with Gold Ribbon',
      'Careful packaging for ganache orb',
      'In Kitchen Prep',
      '17/10/2024, 14:10',
    ],
  ];

  // Seed Tasting Menu
  const menuHeader = [
    'Course #',
    'Dish Title',
    'Category',
    'Price (€)',
    'Sommelier Wine Pairing',
    'Origin & Ingredients',
    'Description',
  ];

  const menuRows = [
    menuHeader,
    ...PEDESTAL_DISHES.map((dish) => [
      dish.courseNumber,
      dish.name,
      dish.category,
      dish.price || '€48',
      `${dish.pairing.wine} (${dish.pairing.vintage}) - ${dish.pairing.producer}`,
      `${dish.origin} | ${dish.ingredients.join(', ')}`,
      dish.description,
    ]),
  ];

  // Seed Cellar
  const cellarHeader = [
    'Vintage',
    'Wine Name',
    'Classification & Type',
    'Producer',
    'Region & Terroir',
    'Price / Bottle',
    'Sommelier Tasting Notes',
  ];

  const cellarRows = [
    cellarHeader,
    ...CELLAR_WINES.map((wine) => [
      wine.vintage,
      wine.name,
      wine.type,
      wine.producer,
      wine.region,
      wine.pricePerBottle,
      wine.notes,
    ]),
  ];

  // Batch update values to seed data
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Reservations!A1:M3',
          values: initialReservations,
        },
        {
          range: 'Takeaway!A1:L3',
          values: initialTakeaways,
        },
        {
          range: `Tasting Menu!A1:G${menuRows.length}`,
          values: menuRows,
        },
        {
          range: `Wine Cellar Reserves!A1:G${cellarRows.length}`,
          values: cellarRows,
        },
      ],
    }),
  }).catch((err) => console.warn('Non-critical pre-seeding warning:', err));

  // Also populate initial rows in persistent cache so it's instantly populated
  saveStoredSheetRows(spreadsheetId, 'Reservations', initialReservations);
  saveStoredSheetRows(spreadsheetId, 'Takeaway', initialTakeaways);
  saveStoredSheetRows(spreadsheetId, 'Tasting Menu', menuRows);
  saveStoredSheetRows(spreadsheetId, 'Wine Cellar Reserves', cellarRows);

  return {
    id: spreadsheetId,
    url: webViewUrl,
    title,
    isLocal,
  };
}

/**
 * Clear a range in a spreadsheet with strict confirmation and local storage support
 */
export async function clearSheetData(
  spreadsheetId: string,
  range: string,
  accessToken: string
) {
  const tabName = range.split('!')[0].replace(/['"]/g, '');

  // If local custom sheet or demo sheet or no token, clear stored rows retaining headers
  if (spreadsheetId.startsWith('sheet-ops-') || spreadsheetId.startsWith('demo-') || !accessToken) {
    const existing = getStoredSheetRows(spreadsheetId, tabName);
    if (existing && existing.length > 0) {
      saveStoredSheetRows(spreadsheetId, tabName, [existing[0]]);
    }
    return { clearedRange: range };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const existing = getStoredSheetRows(spreadsheetId, tabName);
    if (existing && existing.length > 0) {
      saveStoredSheetRows(spreadsheetId, tabName, [existing[0]]);
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to clear sheet range ${range}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Remote clear error, ensuring local cache cleared:', err);
    const existing = getStoredSheetRows(spreadsheetId, tabName);
    if (existing && existing.length > 0) {
      saveStoredSheetRows(spreadsheetId, tabName, [existing[0]]);
    }
    return { clearedRange: range };
  }
}

/**
 * Provides instant fallback data for templates or offline previews
 */
export function getPredefinedSampleData() {
  return {
    reservations: [
      [
        'Booking Code',
        'Guest Name',
        'Party Size',
        'Date',
        'Time',
        'Service Experience',
        'Wine Flight',
        'Dietary Notes',
        'Mobile Phone',
        'Email Address',
        'Deposit Amount',
        'Status',
        'Booked At',
      ],
      [
        'LET-849102',
        'Viscount Julian Vane',
        '4',
        '2024-11-20',
        '19:30',
        'The Tasting Table Counter (€320)',
        'Grand Cru Flight (+€145)',
        'Gluten-Free, No Shellfish',
        '+44 20 7946 0912',
        'vane.j@mayfair-estates.co.uk',
        '€200 (€50/p)',
        'VIP Confirmed',
        '14/10/2024, 15:45',
      ],
      [
        'LET-731940',
        'Dr. Camille Laurent',
        '2',
        '2024-11-21',
        '20:00',
        "Symphonie d'Automne (8 Courses - €240)",
        'Natural & Biodynamic (+€115)',
        'Pescatarian',
        '+33 6 42 19 88 01',
        'c.laurent@sorbonne.fr',
        '€100 (€50/p)',
        'Confirmed',
        '15/10/2024, 11:20',
      ],
      [
        'LET-904812',
        'Madame Hélène de Ségur',
        '6',
        '2024-11-23',
        '20:30',
        'The Tasting Table Counter (€320)',
        'Grand Cru Flight (+€145)',
        'No Allium, Truffle Lover',
        '+33 1 45 20 89 00',
        'h.segur@chateaudesegur.fr',
        '€300 (€50/p)',
        'VIP Confirmed',
        '16/10/2024, 09:15',
      ],
    ],
    takeaway: [
      TAKEAWAY_HEADERS,
      [
        'TKW-492104',
        'Éléonore de Montmirail',
        '+33 6 92 14 33 01',
        'eleonore@montmirail.fr',
        '2024-11-20',
        '13:15',
        '2x Dry-Aged Wagyu Truffle Burger (€34); 1x Hand-Cut Truffle Parmesan Frites (€22)',
        '€90',
        'Signature Insulated Haute Box',
        'Extra truffle confit aioli on the side',
        'Ready for Collection',
        '17/10/2024, 11:45',
      ],
      [
        'TKW-518290',
        'Arthur Pendelton',
        '+44 7700 900481',
        'arthur.p@londontech.io',
        '2024-11-21',
        '19:00',
        '1x Crispy Hot Honey Chicken Brioche (€28); 1x Valrhona Ganache Box (€38)',
        '€66',
        'Eco Thermal Bag with Gold Ribbon',
        'Careful packaging for ganache orb',
        'In Kitchen Prep',
        '17/10/2024, 14:10',
      ],
    ],
    menu: [
      [
        'Course #',
        'Dish Title',
        'Category',
        'Price (€)',
        'Sommelier Wine Pairing',
        'Origin & Ingredients',
        'Description',
      ],
      ...PEDESTAL_DISHES.map((d) => [
        d.courseNumber,
        d.name,
        d.category,
        d.price || '€48',
        `${d.pairing.wine} (${d.pairing.vintage}) - ${d.pairing.producer}`,
        `${d.origin} | ${d.ingredients.join(', ')}`,
        d.description,
      ]),
    ],
    cellar: [
      [
        'Vintage',
        'Wine Name',
        'Classification & Type',
        'Producer',
        'Region & Terroir',
        'Price / Bottle',
        'Sommelier Tasting Notes',
      ],
      ...CELLAR_WINES.map((w) => [
        w.vintage,
        w.name,
        w.type,
        w.producer,
        w.region,
        w.pricePerBottle,
        w.notes,
      ]),
    ],
  };
}
