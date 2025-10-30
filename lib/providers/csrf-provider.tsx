'use client';

/**
 * CSRF Token Provider
 * Manages CSRF tokens for client-side forms and API requests
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @since 2025-10-27
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface CsrfContextValue {
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextValue | undefined>(undefined);

interface CsrfProviderProps {
  children: React.ReactNode;
}

export function CsrfProvider({ children }: CsrfProviderProps) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch CSRF token from the API
   */
  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.csrfToken) {
        setCsrfToken(data.csrfToken);
      } else {
        throw new Error('Invalid CSRF token response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
      console.error('CSRF token fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh the CSRF token (generates a new one)
   */
  const refreshToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/csrf', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh CSRF token: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.csrfToken) {
        setCsrfToken(data.csrfToken);
      } else {
        throw new Error('Invalid CSRF token response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh CSRF token';
      setError(errorMessage);
      console.error('CSRF token refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Auto-refresh token every 20 minutes
  useEffect(() => {
    if (!csrfToken) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(interval);
  }, [csrfToken, refreshToken]);

  const value: CsrfContextValue = {
    csrfToken,
    isLoading,
    error,
    refreshToken,
  };

  return <CsrfContext.Provider value={value}>{children}</CsrfContext.Provider>;
}

/**
 * Hook to access CSRF token in components
 * @returns CSRF token, loading state, error state, and refresh function
 */
export function useCsrfToken() {
  const context = useContext(CsrfContext);

  if (context === undefined) {
    throw new Error('useCsrfToken must be used within a CsrfProvider');
  }

  return context;
}

/**
 * Higher-order component to protect forms with CSRF tokens
 * Automatically adds CSRF token as hidden field
 */
export function withCsrfProtection<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function CsrfProtectedComponent(props: P) {
    return (
      <CsrfProvider>
        <Component {...props} />
      </CsrfProvider>
    );
  };
}

/**
 * Helper component to add CSRF token as hidden input field
 * Usage: <CsrfTokenField />
 */
export function CsrfTokenField() {
  const { csrfToken, isLoading } = useCsrfToken();

  if (isLoading || !csrfToken) {
    return null;
  }

  return <input type="hidden" name="csrf_token" value={csrfToken} />;
}

/**
 * Helper to add CSRF token to fetch requests
 * Usage: await fetchWithCsrf('/api/endpoint', { method: 'POST', ... })
 */
export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  // Get CSRF token from cookie (client-side)
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')[1];

  if (!csrfToken) {
    throw new Error('CSRF token not found. Please refresh the page.');
  }

  // Add CSRF token to headers
  const headers = new Headers(options.headers);
  headers.set('X-CSRF-Token', csrfToken);

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // Ensure cookies are sent
  });
}
