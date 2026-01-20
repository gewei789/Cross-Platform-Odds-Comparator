'use client';

import { ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';

/**
 * AppProviderWrapper Component
 * Client-side wrapper for the AppProvider context
 * This is needed because the root layout is a server component
 * and AppProvider uses client-side hooks
 */
export function AppProviderWrapper({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
