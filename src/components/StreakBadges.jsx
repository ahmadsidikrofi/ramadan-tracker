"use client";

import { useEffect, useState } from "react";
import { calculateStreaks, getBadges } from "@/lib/streaks";
import { cn } from "@/lib/utils";
import { Flame, Star, Award } from "lucide-react";

export default function StreakBadges() {
    const [streaks, setStreaks] = useState({ fasting: 0, prayer: 0, tarawih: 0 });
    const [fastingBadge, setFastingBadge] = useState(getBadges(0));

    useEffect(() => {
        // Initial load
        updateStreaks();

        // Listen for custom event or just interval? 
        // Since DailyTracker writes to local storage, we can't easily subscribe to storage events within the same window 
        // unless we dispatch a custom event.
        // For now, we will just update on mount and interval, or hope the parent re-renders.

        const interval = setInterval(updateStreaks, 2000); // Poll every 2s for simplicity
        return () => clearInterval(interval);
    }, []);

    const updateStreaks = () => {
        const current = calculateStreaks();
        setStreaks(current);
        setFastingBadge(getBadges(current.fasting));
    }

    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Main Badge Card */}
            <div className={cn(
                "col-span-2 glass rounded-2xl p-4 flex items-center gap-4 border-l-4",
                "border-l-primary" // Use primary color for main border
            )}>
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm", fastingBadge.bg)}>
                    {fastingBadge.icon}
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-lg">{fastingBadge.label}</h3>
                    <p className="text-secondary text-sm font-medium">Streak Puasa: {streaks.fasting} Hari</p>
                </div>
            </div>

            {/* Mini Stats */}
            <div className="glass rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group transition-all hover:-translate-y-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
                    <Star size={16} />
                </div>
                <span className="text-xl font-bold">{streaks.prayer}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak Shalat</span>
            </div>

            <div className="glass rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group transition-all hover:-translate-y-1">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-1">
                    <Award size={16} />
                </div>
                <span className="text-xl font-bold">{streaks.tarawih}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak Tarawih</span>
            </div>
        </div>
    );
}
