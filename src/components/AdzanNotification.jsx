"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bell, BellRing, BellOff, Volume2, Square, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";

export default function AdzanNotification({ prayerToday, city }) {
    const [notifEnabled, setNotifEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isPlayingAdzan, setIsPlayingAdzan] = useState(false);
    const [currentPrayer, setCurrentPrayer] = useState("");

    const audioRef = useRef(null);
    const notifiedMap = useRef({});

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = isSettingsModalOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isSettingsModalOpen]);

    // Initial Load for localStorage & permissions
    useEffect(() => {
        const s = localStorage.getItem("ramadan-sound");
        if (s !== null) {
            setSoundEnabled(s === "true");
        } else {
            setSoundEnabled(true);
            localStorage.setItem("ramadan-sound", "true");
        }

        const n = localStorage.getItem("ramadan-notif");
        if (n === "true" && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
    }, []);

    // Seamless background audio unlock on first user interaction
    const unlockAudio = () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!window.__ramadanAudioCtx) {
                    window.__ramadanAudioCtx = new AudioCtx();
                }
                if (window.__ramadanAudioCtx.state === "suspended") {
                    window.__ramadanAudioCtx.resume();
                }
            }
        } catch (e) {}

        const audio = audioRef.current;
        if (audio && audio.paused && !isPlayingAdzan) {
            const prevMuted = audio.muted;
            audio.muted = true;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.muted = prevMuted;
                    })
                    .catch(() => {
                        audio.muted = prevMuted;
                    });
            }
        }
    };

    useEffect(() => {
        const handleUserGesture = () => unlockAudio();
        window.addEventListener("touchstart", handleUserGesture, { passive: true, once: true });
        window.addEventListener("pointerdown", handleUserGesture, { passive: true, once: true });
        window.addEventListener("click", handleUserGesture, { once: true });

        return () => {
            window.removeEventListener("touchstart", handleUserGesture);
            window.removeEventListener("pointerdown", handleUserGesture);
            window.removeEventListener("click", handleUserGesture);
        };
    }, []);

    // Play Adzan with Media Session API for lockscreen integration
    const playAdzan = (prayerName = "Shalat", prayerTime = "") => {
        if (!audioRef.current || !soundEnabled) return;

        const audio = audioRef.current;
        audio.currentTime = 0;
        audio.muted = false;

        const promise = audio.play();
        if (promise !== undefined) {
            promise
                .then(() => {
                    setIsPlayingAdzan(true);
                    setCurrentPrayer(prayerName);

                    // Integrate with Mobile Media Session (displays native lockscreen player)
                    if ("mediaSession" in navigator) {
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: `Adzan ${prayerName}`,
                            artist: "Ramadan Tracker",
                            album: city?.name || "Jadwal Shalat",
                            artwork: [
                                { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
                                { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
                            ]
                        });
                        navigator.mediaSession.setActionHandler("stop", stopAdzan);
                        navigator.mediaSession.setActionHandler("pause", stopAdzan);
                    }
                })
                .catch((err) => {
                    console.warn("Autoplay blocked:", err);
                });
        }
    };

    const stopAdzan = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAdzan(false);
        setCurrentPrayer("");
    };

    // Safe Notification Trigger
    const triggerNotification = (prayerName, prayerTime) => {
        const cityName = city?.name || "Wilayah Anda";
        const title = `Waktu Shalat ${prayerName} - ${cityName}`;
        const body = `Telah masuk waktu shalat ${prayerName} (${prayerTime}) untuk ${cityName} dan sekitarnya.`;

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready
                    .then((reg) => {
                        reg.showNotification(title, {
                            body,
                            icon: "/android-chrome-192x192.png",
                            badge: "/favicon-32x32.png",
                            vibrate: [300, 100, 300, 100, 300],
                            tag: `adzan-${prayerName}`,
                            renotify: true
                        });
                    })
                    .catch(() => {
                        try {
                            new Notification(title, { body, icon: "/android-chrome-192x192.png" });
                        } catch (e) {}
                    });
            } else {
                try {
                    new Notification(title, { body, icon: "/android-chrome-192x192.png" });
                } catch (e) {}
            }
        }
    };

    // Scheduled checking based on location & prayer times
    useEffect(() => {
        if (!prayerToday || (!soundEnabled && !notifEnabled)) return;

        const checkPrayerTimes = () => {
            const now = new Date();
            const currentH = now.getHours().toString().padStart(2, "0");
            const currentM = now.getMinutes().toString().padStart(2, "0");
            const currentStr = `${currentH}:${currentM}`;
            const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            const cityKey = city?.id || city?.name || "default";

            const prayersToNotify = [
                { id: "Subuh", time: prayerToday.subuh },
                { id: "Dzuhur", time: prayerToday.dzuhur },
                { id: "Ashar", time: prayerToday.ashar },
                { id: "Maghrib", time: prayerToday.maghrib },
                { id: "Isya", time: prayerToday.isya }
            ];

            prayersToNotify.forEach((p) => {
                if (!p.time) return;
                const cleanTime = p.time.trim().slice(0, 5);

                if (cleanTime === currentStr) {
                    const key = `${todayStr}-${cityKey}-${p.id}-${cleanTime}`;
                    if (!notifiedMap.current[key]) {
                        notifiedMap.current[key] = true;

                        if (notifEnabled) {
                            triggerNotification(p.id, cleanTime);
                        }
                        if (soundEnabled) {
                            playAdzan(p.id, cleanTime);
                        }
                    }
                }
            });
        };

        checkPrayerTimes();
        const interval = setInterval(checkPrayerTimes, 5000);
        return () => clearInterval(interval);
    }, [prayerToday, city, notifEnabled, soundEnabled]);

    const toggleSettingsNotif = async (checked) => {
        unlockAudio();

        if (checked && "Notification" in window) {
            if (window.Notification.permission === "granted") {
                setNotifEnabled(true);
                localStorage.setItem("ramadan-notif", "true");
            } else if (window.Notification.permission !== "denied") {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    setNotifEnabled(true);
                    localStorage.setItem("ramadan-notif", "true");
                }
            }
        } else {
            setNotifEnabled(false);
            localStorage.setItem("ramadan-notif", "false");
        }
    };

    const toggleSettingsSound = (checked) => {
        unlockAudio();
        setSoundEnabled(checked);
        localStorage.setItem("ramadan-sound", checked.toString());
        if (!checked && isPlayingAdzan) {
            stopAdzan();
        }
    };

    return (
        <>
            {/* Background Audio element */}
            <audio
                ref={audioRef}
                src="/Adzan.mp3"
                preload="auto"
                playsInline
                onEnded={() => {
                    setIsPlayingAdzan(false);
                    setCurrentPrayer("");
                }}
            />

            <div className="mt-4 flex flex-col gap-2.5">
                {/* Active Adzan Playback Pill */}
                <AnimatePresence>
                    {isPlayingAdzan && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center justify-between bg-black/40 border border-accent/40 rounded-2xl p-3.5 backdrop-blur-md shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/20 rounded-full text-accent">
                                    <Volume2 size={18} className="animate-pulse" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xs font-semibold text-white">
                                        Adzan {currentPrayer} Berkumandang
                                    </h4>
                                    <p className="text-[11px] text-white/70">
                                        {city?.name || "Waktu Shalat"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={stopAdzan}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 border border-white/15 cursor-pointer"
                            >
                                <Square size={11} fill="currentColor" />
                                <span>Hentikan</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sleek, Clean Notification Trigger Card */}
                <div
                    className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 cursor-pointer hover:bg-white/15 transition-all shadow-sm"
                    onClick={() => {
                        unlockAudio();
                        setIsSettingsModalOpen(true);
                    }}
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-white/15 rounded-xl text-white">
                            {soundEnabled ? <Volume2 size={16} /> : notifEnabled ? <BellRing size={16} /> : <BellOff size={16} />}
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-white">Pengingat Shalat & Adzan</h4>
                            <p className="text-[11px] text-white/70">
                                {city?.name || "Wilayah Terpilih"} • {soundEnabled ? "Adzan Aktif" : "Hanya Notif"}
                            </p>
                        </div>
                    </div>

                    <div className="text-white/60 hover:text-white transition-colors">
                        <ChevronRight size={16} />
                    </div>
                </div>
            </div>

            {/* Clean, Non-AI-Slop Settings Modal */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setIsSettingsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            className="bg-background w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto border border-border/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="font-semibold text-foreground text-sm">Pengaturan Pengingat</h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {city?.name || "Kota Semarang"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="p-1.5 bg-black/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Toggles */}
                            <div className="p-3 flex flex-col gap-1">
                                <div className="p-3 flex justify-between items-center hover:bg-muted/40 transition-colors rounded-xl">
                                    <div className="flex flex-col pr-2">
                                        <span className="font-medium text-xs text-foreground">Suara Adzan</span>
                                        <span className="text-[11px] text-muted-foreground">
                                            Kumandangkan adzan otomatis saat masuk waktu shalat
                                        </span>
                                    </div>
                                    <Switch checked={soundEnabled} onCheckedChange={toggleSettingsSound} />
                                </div>

                                <div className="p-3 flex justify-between items-center hover:bg-muted/40 transition-colors rounded-xl">
                                    <div className="flex flex-col pr-2">
                                        <span className="font-medium text-xs text-foreground">Notifikasi Layar</span>
                                        <span className="text-[11px] text-muted-foreground">
                                            Pemberitahuan visual waktu shalat
                                        </span>
                                    </div>
                                    <Switch
                                        checked={notifEnabled}
                                        onCheckedChange={toggleSettingsNotif}
                                        disabled={typeof window !== "undefined" && window.Notification?.permission === "denied"}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
