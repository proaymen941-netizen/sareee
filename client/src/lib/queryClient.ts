import { QueryClient, QueryFunction } from "@tanstack/react-query";

const OFFLINE_CACHE_PREFIX = 'offline_cache_';
const OFFLINE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function saveToOfflineCache(key: string, data: unknown) {
  try {
    localStorage.setItem(OFFLINE_CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // ignore storage errors
  }
}

function loadFromOfflineCache(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > OFFLINE_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (url.startsWith('/api/admin/')) {
    const token = localStorage.getItem('admin_token');
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const cacheKey = queryKey.join('_');
    const headers: Record<string, string> = {};
    
    if (url.startsWith('/api/admin/')) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    try {
      const res = await fetch(url, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();

      // Cache successful responses for offline use (only public endpoints)
      if (!url.startsWith('/api/admin/') && !url.includes('/api/orders')) {
        saveToOfflineCache(cacheKey, data);
      }

      return data;
    } catch (error: any) {
      // If network error, try to serve from offline cache
      const isNetworkError = !navigator.onLine ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.name === 'TypeError';

      if (isNetworkError) {
        const cached = loadFromOfflineCache(cacheKey);
        if (cached !== null) {
          console.log(`[Offline] Serving cached data for: ${url}`);
          return cached as T;
        }
      }

      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('500')) {
          return false;
        }
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
