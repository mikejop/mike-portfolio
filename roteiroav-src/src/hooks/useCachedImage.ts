"use client";

import { useState, useEffect } from "react";

export function useCachedImage(url: string | undefined): string {
    const [cachedUrl, setCachedUrl] = useState<string>("");

    useEffect(() => {
        if (!url) {
            setCachedUrl("");
            return;
        }

        if (!url.startsWith("http")) {
            setCachedUrl(url);
            return;
        }

        let isMounted = true;

        const loadImg = async () => {
            try {
                const cache = await caches.open("roteiroav-image-cache");
                const cachedResponse = await cache.match(url);

                if (cachedResponse) {
                    const blob = await cachedResponse.blob();
                    if (isMounted) {
                        setCachedUrl(URL.createObjectURL(blob));
                    }
                } else {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response.clone());
                        const blob = await response.blob();
                        if (isMounted) {
                            setCachedUrl(URL.createObjectURL(blob));
                        }
                    } else {
                        if (isMounted) setCachedUrl(url);
                    }
                }
            } catch (err) {
                console.warn("Failed to load cached image:", err);
                if (isMounted) setCachedUrl(url);
            }
        };

        loadImg();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return cachedUrl || url || "";
}
