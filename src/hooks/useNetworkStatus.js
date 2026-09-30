"use client";

import { useState, useEffect } from "react";

/**
 * Tracks online/offline status and executes a callback when the device reconnects
 * @param {Function} [onReconnect] Optional callback to trigger upon regaining internet
 */
export function useNetworkStatus(onReconnect) {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (typeof onReconnect === "function") {
                onReconnect();
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [onReconnect]);

    return { isOnline };
}
