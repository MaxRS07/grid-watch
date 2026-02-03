'use client';

import { useEffect, useRef } from 'react';
import { initializeSeriesCache, isCacheInitializing } from '@/lib/series-cache';

/**
 * Component that initializes the series cache on app load
 * Place this high in the component tree (e.g., in root layout)
 */
export function SeriesCacheInitializer() {
    const initRef = useRef(false);

    useEffect(() => {
        // Only initialize once
        if (initRef.current || isCacheInitializing()) {
            return;
        }

        initRef.current = true;

        // Start cache initialization in the background
        // This doesn't block the UI because it's an async operation
        initializeSeriesCache().catch(err => {
            console.error('Failed to initialize series cache:', err);
        });
    }, []);

    // This component renders nothing
    return null;
}
