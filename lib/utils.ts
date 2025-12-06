import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely copies text to clipboard with fallback for unsecured contexts
 * Clipboard API requires HTTPS, fallback to execCommand for HTTP
 */
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Failed to copy: ', err);
      return false;
    }
  } else {
    // Fallback for HTTP contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.warn('Fallback failed to copy: ', err);
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Sanitizes WhatsApp phone number by removing non-numeric characters
 * Assumes the number is already in international format (with country code)
 */
export function sanitizeWhatsappPhoneNumberStr(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

/**
 * Converts an array of objects to CSV format and triggers download
 * @param data Array of objects to convert
 * @param filename Name of the downloaded file (without .csv extension)
 * @param headers Optional custom headers, if not provided uses object keys
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    csvHeaders.join(','),

    // Data rows
    ...data.map(row =>
      csvHeaders.map(header => {
        const value = row[header];
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }

        // Convert to string and escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Formats currency for CSV export (removes currency symbols and formatting)
 */
export function formatCurrencyForCSV(amount: number): string {
  return amount?.toString() || '0';
}

/**
 * Formats date for CSV export
 */
export function formatDateForCSV(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}
