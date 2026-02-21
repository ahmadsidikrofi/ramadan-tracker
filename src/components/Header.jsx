"use client";

import { format } from "date-fns";
import { ChevronDown, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
    const [hijriDate, setHijriDate] = useState("Memuat...");
    const [masehiDate, setMasehiDate] = useState("");
    const [cityName, setCityName] = useState("Pilih Lokasi");

    useEffect(() => {
        const today = new Date();
        setMasehiDate(format(today, "EEEE, d MMM yyyy"));

        try {
            const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            }).formatToParts(today);

            const day = parts.find(p => p.type === 'day')?.value;
            const monthStr = parts.find(p => p.type === 'month')?.value;
            const yearStr = parts.find(p => p.type === 'year')?.value;

            const monthIndex = parseInt(monthStr, 10) - 1;
            const monthNames = [
                "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir",
                "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
                "Ramadan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
            ];

            // Extract the digits (some implementations return '1447 AH' instead of just '1447')
            const yearMatch = yearStr?.match(/\d+/);
            const year = yearMatch ? yearMatch[0] : "1447";

            if (day && monthIndex >= 0 && monthIndex < 12) {
                setHijriDate(`${day} ${monthNames[monthIndex]} ${year} H`);
            } else {
                setHijriDate("1 Ramadan 1447 H");
            }
        } catch (e) {
            setHijriDate("1 Ramadan 1447 H");
        }

        const loadCity = () => {
            const saved = localStorage.getItem("ramadan-location");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setCityName(parsed.name || "Pilih Lokasi");
                } catch (e) {
                    setCityName("Pilih Lokasi");
                }
            } else {
                setCityName("Kota Denpasar"); // default
            }
        };

        loadCity();

        window.addEventListener("location-changed", loadCity);
        return () => window.removeEventListener("location-changed", loadCity);
    }, []);

    const openModal = () => {
        window.dispatchEvent(new CustomEvent("open-location-modal"));
    };

    return (
        <header className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-md font-bold text-accent tracking-wide drop-shadow-sm">
                    {hijriDate}
                </h1>
                <p className="text-primary-foreground/70 text-sm mt-1">
                    {masehiDate}
                </p>
            </div>

            <button
                onClick={openModal}
                className="px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-white active:scale-95 hover:scale-110 transition-all duration-200 cursor-pointer"
            >
                <MapPin size={16} className="text-accent" />
                <span className="text-sm font-bold w-full text-left truncate max-w-[120px]">{cityName}</span>
                <ChevronDown size={16} className="text-accent" />
            </button>
        </header>
    );
}
