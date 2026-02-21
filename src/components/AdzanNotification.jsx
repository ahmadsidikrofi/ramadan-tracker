"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bell, BellRing, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";

export default function AdzanNotification({ prayerToday }) {
    // Notification State
    const [notifEnabled, setNotifEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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

    // Initial Load for localStorage
    useEffect(() => {
        const n = localStorage.getItem("ramadan-notif");
        if (n === "true" && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
        const s = localStorage.getItem("ramadan-sound");
        if (s !== null) {
            setSoundEnabled(s === "true");
        }
    }, []);

    // Notification Scheduling System
    useEffect(() => {
        if (!prayerToday || !notifEnabled) return;

        // Cek periodik untuk mementik notifikasi
        const checkPrayerTimes = () => {
            const now = new Date();
            const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

            const prayersToNotify = [
                { id: "Subuh", time: prayerToday.subuh },
                { id: "Dzuhur", time: prayerToday.dzuhur },
                { id: "Ashar", time: prayerToday.ashar },
                { id: "Maghrib", time: prayerToday.maghrib },
                { id: "Isya", time: prayerToday.isya }
            ];

            prayersToNotify.forEach(p => {
                if (p.time === currentStr) {
                    const key = `${todayStr}-${p.id}`;
                    if (!notifiedMap.current[key]) {
                        notifiedMap.current[key] = true;

                        // Fire Push Notification
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification(`Waktu ${p.id}`, {
                                body: `Telah masuk waktu shalat ${p.id} untuk wilayah Anda.`,
                                icon: "/favicon.ico"
                            });
                        }

                        // Fire Audio
                        if (soundEnabled) {
                            const audio = new Audio("/Adzan.mp3");
                            audio.play().catch(e => console.log("Autoplay blocked:", e));
                        }
                    }
                }
            });
        };

        checkPrayerTimes();
        const interval = setInterval(checkPrayerTimes, 10000); // Tiap 10 dtk
        return () => clearInterval(interval);
    }, [prayerToday, notifEnabled, soundEnabled]);

    const handleNotifToggle = async () => {
        if (!("Notification" in window)) {
            alert("Browser ini tidak mendukung notifikasi.");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setNotifEnabled(true);
            setSoundEnabled(true); // default on 
            localStorage.setItem("ramadan-notif", "true");
            localStorage.setItem("ramadan-sound", "true");
        } else {
            alert("Izin notifikasi ditolak. Anda tidak akan menerima notifikasi suara.");
        }
    };

    const toggleSettingsNotif = (checked) => {
        setNotifEnabled(checked);
        localStorage.setItem("ramadan-notif", checked.toString());
        if (checked && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    };

    const toggleSettingsSound = (checked) => {
        setSoundEnabled(checked);
        localStorage.setItem("ramadan-sound", checked.toString());
    };

    return (
        <>
            {/* Notification Bar */}
            <AnimatePresence>
                <div className="mt-4 flex flex-col gap-3">
                    {!notifEnabled && typeof window !== "undefined" && window.Notification?.permission !== "denied" && (
                        <div className="flex items-center justify-between bg-accent/20 border border-accent/30 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 bg-accent/30 rounded-full text-white">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Notifikasi Adzan</h4>
                                    <p className="text-xs text-white/80">Aktifkan pengingat 5 waktu</p>
                                </div>
                            </div>
                            <button onClick={handleNotifToggle} className="px-3 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95">
                                Aktifkan
                            </button>
                        </div>
                    )}

                    {notifEnabled && (
                        <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/15 transition-colors animate-in fade-in" onClick={() => setIsSettingsModalOpen(true)}>
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 bg-white/20 rounded-full text-white relative">
                                    {soundEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Pengingat Shalat Aktif</h4>
                                    <p className="text-xs text-white/70">Ketuk untuk mengatur notifikasi</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AnimatePresence>

            {/* Modal Settings Notifikasi */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.30 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-background w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto border border-border/50"
                        >
                            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="font-bold text-foreground text-md">Pengaturan Pengingat</h3>
                                </div>
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-muted-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-2 flex flex-col gap-1">
                                <div className="p-4 flex justify-between items-center hover:bg-secondary/20 transition-colors rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-foreground">Notifikasi Shalat</span>
                                        <span className="text-xs text-muted-foreground">Tampilkan saat masuk waktu shalat</span>
                                    </div>
                                    <Switch checked={notifEnabled} onCheckedChange={toggleSettingsNotif} />
                                </div>
                                <div className="p-4 flex justify-between items-center hover:bg-secondary/20 transition-colors rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-foreground">Suara Adzan</span>
                                        <span className="text-xs text-muted-foreground">Putar audio adzan otomatis</span>
                                    </div>
                                    <Switch checked={soundEnabled} onCheckedChange={toggleSettingsSound} disabled={!notifEnabled} />
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 pb-6 text-center text-[10px] text-muted-foreground">
                                Pengingat akan otomatis muncul sesuai dengan jadwal shalat dari wilayah yang anda pilih. Pastikan browser anda mendukung notifikasi.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
