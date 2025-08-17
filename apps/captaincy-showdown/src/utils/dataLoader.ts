import Papa from 'papaparse';

/**
 * Loads CSV data safely with basic sanitation:
 * - Skips empty lines
 * - Filters out rows where all values are empty
 */
export async function loadCSVData<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const csv = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = (results.data as any[]).filter((row) => {
            // Keep row if any value is non-empty
            return Object.values(row || {}).some((v) => v !== undefined && v !== null && String(v).trim() !== '');
          });
          resolve(rows as T[]);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}
