"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TASKS = [
    { id: "puasa", label: "Puasa", points: 20 },
    { id: "subuh", label: "Shalat Subuh", points: 10 },
    { id: "zuhur", label: "Shalat Zuhur", points: 10 },
    { id: "ashar", label: "Shalat Ashar", points: 10 },
    { id: "maghrib", label: "Shalat Maghrib", points: 10 },
    { id: "isya", label: "Shalat Isya", points: 10 },
    { id: "tarawih", label: "Shalat Tarawih", points: 15 },
    { id: "tadarus", label: "Tadarus Al-Qur'an", points: 15 },
];

export default function DailyTracker() {
    const [isOpen, setIsOpen] = useState(false);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [progress, setProgress] = useState(0);

    // Load from Local Storage on Mount
    useEffect(() => {
        const todayKey = format(new Date(), "yyyy-MM-dd");
        const stored = localStorage.getItem(`ramadan-tracker-${todayKey}`);
        if (stored) {
            setCompletedTasks(JSON.parse(stored));
        }
    }, []);

    // Calculate Progress & Save
    useEffect(() => {
        const totalPoints = TASKS.reduce((acc, t) => acc + t.points, 0);
        const earnedPoints = TASKS
            .filter(t => completedTasks.includes(t.id))
            .reduce((acc, t) => acc + t.points, 0);

        // Calculate percentage (0-100)
        const newProgress = Math.round((earnedPoints / totalPoints) * 100);
        setProgress(newProgress);

        // Save to Local Storage
        const todayKey = format(new Date(), "yyyy-MM-dd");
        if (completedTasks.length > 0) {
            localStorage.setItem(`ramadan-tracker-${todayKey}`, JSON.stringify(completedTasks));
        }
    }, [completedTasks]);

    const toggleTask = (id) => {
        setCompletedTasks(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    return (
        <div className="glass rounded-2xl p-4 mb-6 transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        {/* Circular Progress (Simple SVG) */}
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="text-primary transition-all duration-500 ease-out"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-primary">{progress}%</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Ibadah Harian</h3>
                        <p className="text-xs text-muted-foreground">
                            {completedTasks.length} dari {TASKS.length} selesai
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors flex items-center gap-1"
                >
                    {isOpen ? "Tutup" : "Buka"}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Accordion / Content */}
            <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
            )}>
                <div className="grid gap-2">
                    {TASKS.map((task) => {
                        const isCompleted = completedTasks.includes(task.id);
                        return (
                            <div
                                key={task.id}
                                onClick={() => toggleTask(task.id)}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/80 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "transition-colors duration-300",
                                        isCompleted ? "text-primary" : "text-gray-300"
                                    )}>
                                        {isCompleted ? <CheckCircle2 size={24} className="fill-current" /> : <Circle size={24} />}
                                    </div>
                                    <span className={cn(
                                        "font-medium transition-all",
                                        isCompleted ? "text-foreground line-through opacity-70" : "text-foreground"
                                    )}>
                                        {task.label}
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded-md">
                                    +{task.points}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
