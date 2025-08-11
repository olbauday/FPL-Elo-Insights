import Papa from 'papaparse';

export async function loadCSVData<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url);
    const csv = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csv, {
        header: true,
        complete: (results) => {
          resolve(results.data as T[]);
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
