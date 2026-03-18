/**
 * SWR Fetcher with error handling
 * Handles API requests with proper error states and typed responses
 */

export class FetchError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.data = data;
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: res.statusText };
    }

    throw new FetchError(
      `API error: ${res.status}`,
      res.status,
      errorData
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Fetcher with custom options
 */
export async function fetcherWithOptions<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: res.statusText };
    }

    throw new FetchError(
      `API error: ${res.status}`,
      res.status,
      errorData
    );
  }

  return res.json() as Promise<T>;
}
