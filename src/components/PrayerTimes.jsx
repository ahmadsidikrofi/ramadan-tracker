"use client";

import { useState } from "react";
import { Moon } from "lucide-react";

// Mock data for prayer times (Yogyakarta approx)
const prayerSchedule = {
    imsak: "04:13",
    fajr: "04:23",
    dhuhr: "11:52",
    asr: "15:01",
    maghrib: "18:02",
    isha: "19:13"
};

export default function PrayerTimes() {
    const [nextPrayer] = useState({ name: "Imsak", time: "04:13", timeLeft: "3h 24m" });

    return (
        <div className="relative w-full">
            {/* Background Decoration - shifted up to cover header area visually if needed */}
            <div className="absolute -right-10 -top-24 opacity-10 pointer-events-none">
                <Moon size={200} fill="currentColor" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center mt-2">
                <span className="text-primary-foreground/80 text-sm font-medium tracking-wide mb-1">
                    Waktu Berikutnya
                </span>
                <h2 className="text-5xl font-bold tracking-tight mb-2 text-white">
                    {nextPrayer.name} <span className="text-3xl font-light opacity-80">{nextPrayer.time}</span>
                </h2>

                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                    <span className="text-sm font-medium text-white">{nextPrayer.timeLeft} lagi</span>
                </div>
            </div>

            {/* Prayer List */}
            <div className="mt-8 grid grid-cols-6 gap-2 text-center text-white">
                {Object.entries(prayerSchedule).map(([key, time]) => (
                    <div key={key} className="flex flex-col items-center gap-1 group">
                        <span className="text-[10px] uppercase font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                            {key}
                        </span>
                        <span className="text-xs font-bold sm:text-sm">
                            {time}
                        </span>
                        {key === "imsak" && (
                            <div className="w-1 h-1 bg-accent rounded-full mt-1"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
