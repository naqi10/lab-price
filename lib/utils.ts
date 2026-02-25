import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 * Handles conditional classes, deduplication, and conflict resolution.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
 * // => "py-2 px-6 bg-blue-500" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a numeric amount as a localized currency string.
 *
 * @param amount  - The numeric value to format
 * @param locale  - BCP 47 locale tag (default: "fr-FR")
 * @param currency - ISO 4217 currency code (default: "MAD" – Moroccan Dirham)
 * @returns Formatted currency string, e.g. "1 250,00 MAD"
 */
export function formatCurrency(
  amount: number,
  locale: string = "fr-FR",
  currency: string = "MAD"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Date object as a localized date string.
 *
 * @param date   - The Date to format
 * @param locale - BCP 47 locale tag (default: "fr-FR")
 * @returns Formatted date string, e.g. "12/02/2026"
 */
export function formatDate(
  date: Date | string,
  locale: string = "fr-FR"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Generate a unique quotation number.
 *
 * Format: QT-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit hex segment for uniqueness.
 *
 * @returns A quotation number string, e.g. "QT-20260212-A3F1"
 */
export function generateQuotationNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();

  return `QT-${datePart}-${randomHex}`;
}

/**
 * Convert a text string into a URL-friendly slug.
 *
 * - Lowercases everything
 * - Replaces accented characters with their ASCII equivalents
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses consecutive hyphens
 * - Trims leading/trailing hyphens
 *
 * @param text - The input text to slugify
 * @returns A URL-safe slug string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")                   // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")    // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")       // replace non-alphanumeric with hyphen
    .replace(/-+/g, "-")               // collapse consecutive hyphens
    .replace(/^-|-$/g, "");            // trim leading/trailing hyphens
}

/**
 * Truncate a text string to a maximum length, appending an ellipsis
 * if the text exceeds the limit.
 *
 * @param text   - The input text
 * @param length - Maximum number of characters (default: 100)
 * @returns The truncated string with "..." appended if needed
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}
