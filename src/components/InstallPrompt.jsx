"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Cek jika user sudah menggunakan app sebagai PWA (standalone)
        const isStandaloneActive = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone || document.referrer.includes("android-app://");
        setIsStandalone(isStandaloneActive);

        // Jika sudah diinstal, tidak perlu tampilkan popup
        if (isStandaloneActive) return;

        // Cek device iOS (karena Apple tidak mendukung beforeinstallprompt)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // Beri delay sedikit agar tidak mengganggu kesan pertama
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 5000);
            return () => clearTimeout(timer);
        }

        // Tangkap event install prompt native untuk Android/Desktop Chromium
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-emerald-950/95 backdrop-blur-md border border-emerald-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 text-emerald-50">
                <div className="shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1">
                    <img src="/android-chrome-192x192.png" alt="Amal.in" className="w-full h-full rounded-lg" />
                </div>

                <div className="flex-1">
                    <h4 className="font-bold text-sm">Install Amal.in</h4>
                    <p className="text-[10px] text-emerald-300/80 leading-tight mt-0.5">
                        {isIOS
                            ? "Tap ikon Share (bagikan) di menu bawah lalu pilih 'Add to Home Screen'."
                            : "Pasang aplikasi ini di layar utama agar bisa digunakan secara offline."}
                    </p>
                </div>

                {!isIOS && (
                    <button
                        onClick={handleInstallClick}
                        className="shrink-0 bg-amber-400 text-emerald-950 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm shadow-amber-500/20 active:scale-95 transition-transform"
                    >
                        Install
                    </button>
                )}

                <button
                    onClick={() => setShowPrompt(false)}
                    className={cn("absolute -top-2 -right-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-300 rounded-full p-1 border-2 border-emerald-950 transition-colors", isIOS ? "top-2 right-2 border-0 bg-transparent" : "")}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
