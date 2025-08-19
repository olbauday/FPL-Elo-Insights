import Papa from 'papaparse';

/**
 * Loads CSV data safely with basic sanitation:
 * - Skips empty lines
 * - Filters out rows where all values are empty
 *
 * Works in browser and vitest/node:
 * - In browser, uses fetch with an absolute URL based on window.location.origin.
 * - In tests/Node (vitest), falls back to reading from the local filesystem under `public/`.
 */
export async function loadCSVData<T>(url: string): Promise<T[]> {
  // Helper to parse CSV consistently
  const parseCsv = (csv: string) =>
    new Promise<T[]>((resolve, reject) => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = (results.data as any[]).filter((row) => {
            // Keep row if any value is non-empty
            return Object.values(row || {}).some(
              (v) => v !== undefined && v !== null && String(v).trim() !== ''
            );
          });
          resolve(rows as T[]);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });

  const isVitest = typeof (import.meta as any).vitest !== 'undefined';

  // Filesystem fallback for vitest/node environment
  const readFromFs = async () => {
    try {
      const rel = url.startsWith('/') ? url.slice(1) : url;
      const { join } = await import('node:path');
      const { readFile } = await import('node:fs/promises');
      const hasProcess = typeof (globalThis as any).process !== 'undefined';
      const cwd = hasProcess && (globalThis as any).process.cwd ? (globalThis as any).process.cwd() : '';
      // Public assets are served from /, so map "/data/..." => "<cwd>/public/data/..."
      const filePath = join(cwd, 'public', rel);
      const csv = await readFile(filePath, 'utf-8');
      return await parseCsv(csv);
    } catch (e) {
      // Surface a helpful message, then rethrow
      console.warn('FS fallback failed when loading CSV:', url, e);
      throw e;
    }
  };

  // Prefer filesystem in tests to avoid JSDOM URL issues
  if (isVitest) {
    return readFromFs();
  }

  // Browser/default path: fetch from server
  try {
    let absoluteUrl = url;
    if (typeof window !== 'undefined') {
      const base = window.location && window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'http://localhost';
      absoluteUrl = url.startsWith('http') ? url : new URL(url, base).toString();
    }

    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${absoluteUrl}: ${response.status} ${response.statusText}`);
    }
    const csv = await response.text();
    return await parseCsv(csv);
  } catch (error) {
    // As a last resort (e.g., SSR), try filesystem
    try {
      return await readFromFs();
    } catch (_) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }
}
