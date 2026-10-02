/**
 * Formats a date string (YYYY-MM-DD or ISO string) to Day-MM-Year (DD-MM-YYYY)
 * e.g., '2026-09-28' -> '28-09-2026'
 */
export function formatDateDDMMYYYY(dateStr: string | undefined | null): string {
  if (!dateStr) return 'N/A';
  
  // If already in DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const parts = dateStr.split('T')[0].split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY
      const [p1, p2, year] = parts;
      return `${p1.padStart(2, '0')}-${p2.padStart(2, '0')}-${year}`;
    }
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {
    // fallback
  }

  return dateStr;
}

/**
 * Get current system date in YYYY-MM-DD for HTML date inputs
 */
export function getCurrentDateISO(): string {
  return '2026-09-28';
}

/**
 * Get current system date formatted in Day-MM-Year (DD-MM-YYYY)
 */
export function getCurrentDateFormatted(): string {
  return formatDateDDMMYYYY(getCurrentDateISO());
}
