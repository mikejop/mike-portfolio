"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export interface TrafficSource {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    referrer: string | null;
    timestamp: string;
}

const STORAGE_KEY = "traffic_source";

/**
 * Returns the saved traffic source from localStorage.
 */
export function getTrafficSource(): TrafficSource | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
}

/**
 * Hook to capture and persist traffic source on the first visit.
 */
export function useTrafficSource() {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if we already have it
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) return;

        const utm_source = searchParams.get("utm_source");
        const utm_medium = searchParams.get("utm_medium");
        const utm_campaign = searchParams.get("utm_campaign");
        const referrer = document.referrer || null;

        // Only save if at least one parameter is present (or always save if requested)
        // The user said "captura a origem do usuário quando ele chega no site pela primeira vez"
        // so we save even if it's direct/empty UTMs to record the initial referrer.
        const sourceData: TrafficSource = {
            utm_source,
            utm_medium,
            utm_campaign,
            referrer,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sourceData));
    }, [searchParams]);

    return { getTrafficSource };
}
