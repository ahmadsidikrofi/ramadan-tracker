"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConsistencyCard() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Generate last 30 days status
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateKey = format(date, "yyyy-MM-dd");
            const data = localStorage.getItem(`ramadan-tracker-${dateKey}`);
            let intensity = 0; // 0: none, 1: low, 2: medium, 3: high

            if (data) {
                const tasks = JSON.parse(data);
                const count = tasks.length;
                if (count > 0) intensity = 1;
                if (count > 4) intensity = 2;
                if (count >= 8) intensity = 3;
            }
            days.push({ date: dateKey, intensity });
        }
        setHistory(days);
    }, []);

    return (
        <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm">Konsistensi Ramadan</h3>
                <span className="text-xs text-muted-foreground">30 Hari Terakhir</span>
            </div>

            <div className="grid grid-cols-10 gap-2">
                {history.map((day, i) => (
                    <div
                        key={i}
                        title={day.date}
                        className={cn(
                            "w-full aspect-square rounded-sm transition-all hover:scale-110",
                            day.intensity === 0 && "bg-gray-200/50",
                            day.intensity === 1 && "bg-primary/30",
                            day.intensity === 2 && "bg-primary/60",
                            day.intensity === 3 && "bg-primary"
                        )}
                    />
                ))}
            </div>

            <div className="flex justify-end items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                <span>Kurang</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-sm bg-gray-200/50" />
                    <div className="w-2 h-2 rounded-sm bg-primary/30" />
                    <div className="w-2 h-2 rounded-sm bg-primary/60" />
                    <div className="w-2 h-2 rounded-sm bg-primary" />
                </div>
                <span>Lebih</span>
            </div>
        </div>
    );
}
