"use client";

import { format } from "date-fns";
import { MapPin } from "lucide-react";

export default function Header() {
    const today = new Date();

    return (
        <header className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-primary-foreground/80 font-medium text-sm mb-1 uppercase tracking-wider">
                    Hari Ini
                </h2>
                <h1 className="text-3xl font-bold text-white">
                    Ramadan 1
                </h1>
                <p className="text-primary-foreground/70 text-sm mt-1">
                    {format(today, "EEEE, d MMM yyyy")}
                </p>
            </div>

            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 transition-colors border-white/20">
                <MapPin size={16} className="text-accent" />
                <span className="text-sm font-medium">Yogyakarta</span>
            </div>
        </header>
    );
}
