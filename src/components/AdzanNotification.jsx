"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bell, BellRing, BellOff, Volume2, VolumeX, Play, Square, MapPin, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";

export default function AdzanNotification({ prayerToday, city }) {
    // Notification & Sound State
    const [notifEnabled, setNotifEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isPlayingAdzan, setIsPlayingAdzan] = useState(false);
    const [currentPrayer, setCurrentPrayer] = useState("");
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const [audioBlockedPrompt, setAudioBlockedPrompt] = useState(null);

    const audioRef = useRef(null);
    const notifiedMap = useRef({});

    // Prevent body scroll when settings modal is open
    useEffect(() => {
        if (isSettingsModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isSettingsModalOpen]);

    // Initial Load for localStorage & permissions
    useEffect(() => {
        // Load Sound preference (default: true)
        const s = localStorage.getItem("ramadan-sound");
        if (s !== null) {
            setSoundEnabled(s === "true");
        } else {
            setSoundEnabled(true);
            localStorage.setItem("ramadan-sound", "true");
        }

        // Load Notification preference
        const n = localStorage.getItem("ramadan-notif");
        if (n === "true" && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
    }, []);

    // Unlock Audio Context & Audio Element for Mobile Browsers (iOS Safari / Android Chrome)
    const unlockAudio = () => {
        // 1. Resume Web Audio API AudioContext if suspended
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
        } catch (e) {
            console.warn("AudioContext unlock note:", e);
        }

        // 2. Prime the HTML5 Audio element
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
                        setIsAudioUnlocked(true);
                    })
                    .catch((err) => {
                        audio.muted = prevMuted;
                        console.log("Audio unlock attempt caught:", err);
                    });
            }
        } else if (audio && !audio.paused) {
            setIsAudioUnlocked(true);
        }
    };

    // Attach interaction listener to unlock audio on first touch/click anywhere on smartphone
    useEffect(() => {
        const handleUserGesture = () => {
            unlockAudio();
        };

        window.addEventListener("touchstart", handleUserGesture, { passive: true, once: true });
        window.addEventListener("pointerdown", handleUserGesture, { passive: true, once: true });
        window.addEventListener("click", handleUserGesture, { once: true });

        return () => {
            window.removeEventListener("touchstart", handleUserGesture);
            window.removeEventListener("pointerdown", handleUserGesture);
            window.removeEventListener("click", handleUserGesture);
        };
    }, []);

    // Play Adzan
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
                    setIsAudioUnlocked(true);
                    setAudioBlockedPrompt(null);
                })
                .catch((err) => {
                    console.warn("Autoplay blocked on mobile browser:", err);
                    // Provide fallback notification so user can tap to start audio
                    setAudioBlockedPrompt({
                        prayer: prayerName,
                        time: prayerTime
                    });
                });
        }
    };

    // Stop Adzan
    const stopAdzan = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAdzan(false);
        setCurrentPrayer("");
    };

    // Safe Notification Trigger for Android Chrome & Desktop
    const triggerNotification = (prayerName, prayerTime) => {
        const cityName = city?.name || "Wilayah Anda";
        const title = `Waktu Shalat ${prayerName} - ${cityName}`;
        const body = `Telah masuk waktu shalat ${prayerName} (${prayerTime}) untuk wilayah ${cityName} dan sekitarnya.`;

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            // Android Chrome requires ServiceWorkerRegistration.showNotification()
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
                            new Notification(title, {
                                body,
                                icon: "/android-chrome-192x192.png"
                            });
                        } catch (e) {
                            console.warn("Standard notification not permitted:", e);
                        }
                    });
            } else {
                try {
                    new Notification(title, {
                        body,
                        icon: "/android-chrome-192x192.png"
                    });
                } catch (e) {
                    console.warn("Notification error:", e);
                }
            }
        }
    };

    // Notification & Audio Scheduling System based on selected city & prayer times
    useEffect(() => {
        if (!prayerToday) return;
        // If neither sound nor notification is active, skip scheduling
        if (!soundEnabled && !notifEnabled) return;

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

                        // 1. Trigger Push Notification if enabled
                        if (notifEnabled) {
                            triggerNotification(p.id, cleanTime);
                        }

                        // 2. Trigger Audio Adzan if sound enabled
                        if (soundEnabled) {
                            playAdzan(p.id, cleanTime);
                        }
                    }
                }
            });
        };

        checkPrayerTimes();
        const interval = setInterval(checkPrayerTimes, 5000); // Check every 5s for precision
        return () => clearInterval(interval);
    }, [prayerToday, city, notifEnabled, soundEnabled]);

    // Handle initial button toggle
    const handleNotifToggle = async () => {
        unlockAudio();

        if (!("Notification" in window) || window.Notification.permission === "denied") {
            setIsSettingsModalOpen(true);
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setNotifEnabled(true);
                setSoundEnabled(true);
                localStorage.setItem("ramadan-notif", "true");
                localStorage.setItem("ramadan-sound", "true");
            } else {
                setIsSettingsModalOpen(true);
            }
        } catch (e) {
            setIsSettingsModalOpen(true);
        }
    };

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
            } else {
                alert("Izin notifikasi telah diblokir di setelan browser HP/Laptop Anda. Anda tetap dapat mendengarkan Suara Adzan.");
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

    const handleTestSound = () => {
        unlockAudio();
        if (isPlayingAdzan) {
            stopAdzan();
        } else {
            playAdzan("Uji Coba", "Sekarang");
        }
    };

    return (
        <>
            {/* Hidden persistent Audio element for seamless mobile playback */}
            <audio
                ref={audioRef}
                src="/Adzan.mp3"
                preload="auto"
                playsInline
                onEnded={() => {
                    setIsPlayingAdzan(false);
                    setCurrentPrayer("");
                }}
                onError={(e) => {
                    console.error("Audio error:", e);
                    setIsPlayingAdzan(false);
                }}
            />

            {/* Notification / Adzan Audio Control Bar */}
            <div className="mt-4 flex flex-col gap-2.5">
                {/* 1. Playing Adzan Active Alert Banner */}
                <AnimatePresence>
                    {isPlayingAdzan && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="flex items-center justify-between bg-emerald-950/80 border border-emerald-400/50 rounded-2xl p-3.5 backdrop-blur-md shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-accent/30 rounded-full text-accent animate-pulse">
                                    <Volume2 size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                        <h4 className="text-sm font-bold text-white">
                                            Adzan {currentPrayer}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-emerald-200/90 truncate max-w-[170px] sm:max-w-xs">
                                        {city?.name || "Wilayah Anda"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={stopAdzan}
                                className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                                <Square size={13} fill="currentColor" />
                                <span>Hentikan</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. Autoplay Blocked Fallback Banner (for strict mobile browser settings) */}
                <AnimatePresence>
                    {audioBlockedPrompt && !isPlayingAdzan && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="flex items-center justify-between bg-amber-500/20 border border-amber-400/50 rounded-2xl p-3 backdrop-blur-md"
                        >
                            <div className="flex items-center gap-2 text-left">
                                <AlertCircle size={18} className="text-amber-300 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-white">
                                        Waktu {audioBlockedPrompt.prayer} telah tiba!
                                    </p>
                                    <p className="text-[11px] text-white/80">
                                        Ketuk untuk memutar suara adzan
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => playAdzan(audioBlockedPrompt.prayer, audioBlockedPrompt.time)}
                                className="px-3 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-full text-xs font-bold shadow transition-all active:scale-95 cursor-pointer"
                            >
                                Kumandangkan
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. Main Status Card */}
                {!notifEnabled && !soundEnabled ? (
                    <div className="flex items-center justify-between bg-accent/20 border border-accent/30 rounded-2xl p-3.5 sm:p-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-accent/30 rounded-full text-white">
                                <Bell size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Pengaturan Adzan</h4>
                                <p className="text-xs text-white/80">
                                    {city?.name ? `Lokasi: ${city.name}` : "Atur suara dan notifikasi"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleNotifToggle}
                            className="px-3.5 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            Atur Sekarang
                        </button>
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 sm:p-4 cursor-pointer hover:bg-white/15 transition-all shadow-sm group"
                        onClick={() => {
                            unlockAudio();
                            setIsSettingsModalOpen(true);
                        }}
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-white/20 rounded-full text-white relative group-hover:scale-105 transition-transform">
                                {soundEnabled ? <Volume2 size={18} /> : notifEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-bold text-white">Pengingat & Suara Adzan</h4>
                                    {isAudioUnlocked && (
                                        <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-full font-medium hidden sm:inline-block">
                                            Audio HP Siap
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-white/70">
                                    {city?.name || "Wilayah Terpilih"} • {soundEnabled ? "Suara Aktif" : "Hanya Notif"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTestSound();
                                }}
                                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1 border border-white/20 cursor-pointer"
                                title="Uji Suara di HP"
                            >
                                {isPlayingAdzan ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                                <span>{isPlayingAdzan ? "Stop" : "Tes Suara"}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Settings Notifikasi & Suara */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setIsSettingsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-background w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto border border-border/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b flex justify-between items-center bg-muted/40">
                                <div>
                                    <h3 className="font-bold text-foreground text-base">Pengaturan Adzan & Pengingat</h3>
                                    <div className="flex items-center gap-1 text-xs text-primary font-medium mt-0.5">
                                        <MapPin size={12} />
                                        <span>{city?.name || "Kota Semarang"}</span>
                                        {city?.provinceName && (
                                            <span className="text-muted-foreground">({city.provinceName})</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-muted-foreground cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Toggles & Options */}
                            <div className="p-2 flex flex-col gap-1">
                                {/* Suara Adzan Toggle */}
                                <div className="p-3.5 flex justify-between items-center hover:bg-secondary/20 transition-colors rounded-2xl">
                                    <div className="flex flex-col pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <Volume2 size={16} className="text-primary" />
                                            <span className="font-semibold text-sm text-foreground">Suara Adzan Otomatis</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            Putar audio adzan saat masuk waktu shalat di {city?.name || "kota Anda"}
                                        </span>
                                    </div>
                                    <Switch checked={soundEnabled} onCheckedChange={toggleSettingsSound} />
                                </div>

                                {/* Push Notification Toggle */}
                                <div className="p-3.5 flex justify-between items-center hover:bg-secondary/20 transition-colors rounded-2xl">
                                    <div className="flex flex-col pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <Bell size={16} className="text-primary" />
                                            <span className="font-semibold text-sm text-foreground">Notifikasi Layar</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            Tampilkan notifikasi pop-up waktu shalat
                                        </span>
                                    </div>
                                    <Switch
                                        checked={notifEnabled}
                                        onCheckedChange={toggleSettingsNotif}
                                        disabled={typeof window !== "undefined" && window.Notification?.permission === "denied"}
                                    />
                                </div>

                                {/* Test Sound Row */}
                                <div className="p-3 bg-secondary/30 rounded-2xl flex items-center justify-between mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground">Uji Suara di Perangkat HP</span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {isAudioUnlocked ? "✓ Audio browser HP telah diizinkan" : "Tekan untuk verifikasi suara di HP"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleTestSound}
                                        className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs font-bold shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {isPlayingAdzan ? (
                                            <>
                                                <Square size={12} fill="currentColor" />
                                                <span>Stop</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={12} fill="currentColor" />
                                                <span>Tes Suara</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Smartphone Tips Footer */}
                            <div className="p-4 bg-muted/30 border-t border-border/40 text-left text-[11px] text-muted-foreground space-y-1.5">
                                <div className="flex items-start gap-1.5 font-medium text-foreground/80">
                                    <Info size={14} className="text-primary shrink-0 mt-0.5" />
                                    <span>Tips Penting untuk Pengguna Smartphone:</span>
                                </div>
                                <p className="leading-relaxed pl-5">
                                    1. Pastikan HP <strong>tidak dalam mode hening / silent</strong> dan volume media dinaikkan.
                                </p>
                                <p className="leading-relaxed pl-5">
                                    2. Jadwal adzan akan otomatis terpicu mengikuti waktu shalat di <strong>{city?.name || "lokasi yang dipilih"}</strong>. Jika Anda berpindah kota, jadwal adzan otomatis diperbarui.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
