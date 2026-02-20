"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TASKS = [
    { id: "subuh", points: 10 },
    { id: "zuhur", points: 10 },
    { id: "ashar", points: 10 },
    { id: "maghrib", points: 10 },
    { id: "isya", points: 10 },
    { id: "tarawih", points: 15 },
    { id: "tadarus", points: 15 },
];

export default function ConsistencyCard() {
    const [history, setHistory] = useState([]);

    const fetchHistory = useCallback(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateKey = format(date, "yyyy-MM-dd");
            const storedTasks = localStorage.getItem(`ramadan-tracker-${dateKey}`);
            const storedFasting = localStorage.getItem(`ramadan-fasting-${dateKey}`);

            let percentage = 0;

            if (storedTasks || storedFasting === "true") {
                const tasks = storedTasks ? JSON.parse(storedTasks) : [];
                const isFasting = storedFasting === "true";

                const earnedPoints = TASKS
                    .filter(t => tasks.includes(t.id))
                    .reduce((acc, t) => acc + t.points, 0) + (isFasting ? 20 : 0);

                percentage = Math.min(earnedPoints, 100);
            }

            let intensity = 0;
            if (percentage > 0) intensity = 1;
            if (percentage >= 40) intensity = 2;
            if (percentage >= 70) intensity = 3;
            if (percentage >= 95) intensity = 4;

            days.push({
                date: date,
                dateDisplay: format(date, "d MMM", { locale: id }).toUpperCase(),
                percentage,
                intensity
            });
        }
        setHistory(days);
    }, []);

    useEffect(() => {
        fetchHistory();

        window.addEventListener("ramadan-tracker-update", fetchHistory);
        return () => window.removeEventListener("ramadan-tracker-update", fetchHistory);
    }, [fetchHistory]);

    return (
        <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-slate-700 font-outfit uppercase tracking-tight">Konsistensi Ramadan</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">30 Hari Terakhir</span>
            </div>

            <div className="grid grid-cols-10 gap-2">
                {history.map((day, i) => (
                    <div
                        key={i}
                        className="group relative"
                    >
                        <div
                            className={cn(
                                "w-full aspect-square rounded-lg transition-all duration-100 hover:scale-120 cursor-pointer shadow-sm border border-black/5",
                                day.intensity === 0 && "bg-slate-200/40",
                                day.intensity === 1 && "bg-primary/20",
                                day.intensity === 2 && "bg-primary/40",
                                day.intensity === 3 && "bg-primary/70",
                                day.intensity === 4 && "bg-primary"
                            )}
                        />
                        {/* Tooltip implementation */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-bold shadow-xl">
                            {day.dateDisplay}: {day.percentage}%
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-slate-800" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end items-center gap-3 mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Santai</span>
                <div className="flex gap-1.5 p-1 bg-slate-50 rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-sm bg-slate-200/40" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary/70" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                </div>
                <span>Disiplin</span>
            </div>
        </div>
    );
}
