import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, Moon, Sparkles, MessageCircleWarning, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, isToday, isFuture, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import ShareProgress from "./ShareProgress";

const TASKS = [
    { id: "subuh", label: "Shalat Subuh", points: 10 },
    { id: "zuhur", label: "Shalat Zuhur", points: 10 },
    { id: "ashar", label: "Shalat Ashar", points: 10 },
    { id: "maghrib", label: "Shalat Maghrib", points: 10 },
    { id: "isya", label: "Shalat Isya", points: 10 },
    { id: "tarawih", label: "Shalat Tarawih", points: 15 },
    { id: "tadarus", label: "Tadarus Al-Qur'an", points: 15 },
];

export default function DailyTracker() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isOpen, setIsOpen] = useState(true);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [isFasting, setIsFasting] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const dateKey = format(selectedDate, "yyyy-MM-dd");

    // Load from Local Storage when selectedDate changes
    useEffect(() => {
        const storedTasks = localStorage.getItem(`ramadan-tracker-${dateKey}`);
        const storedFasting = localStorage.getItem(`ramadan-fasting-${dateKey}`);

        setCompletedTasks(storedTasks ? JSON.parse(storedTasks) : []);
        setIsFasting(storedFasting === "true");
    }, [dateKey]);

    // Save tasks
    const saveTasks = (tasks) => {
        localStorage.setItem(`ramadan-tracker-${dateKey}`, JSON.stringify(tasks));
        window.dispatchEvent(new Event("ramadan-tracker-update"));
    };

    // Save fasting
    const saveFasting = (val) => {
        localStorage.setItem(`ramadan-fasting-${dateKey}`, val.toString());
        window.dispatchEvent(new Event("ramadan-tracker-update"));
    };

    const toggleTask = (id) => {
        const newTasks = completedTasks.includes(id)
            ? completedTasks.filter(t => t !== id)
            : [...completedTasks, id];
        setCompletedTasks(newTasks);
        saveTasks(newTasks);
    };

    const toggleFasting = () => {
        const newVal = !isFasting;
        setIsFasting(newVal);
        saveFasting(newVal);
    };

    const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDay = () => {
        if (!isToday(selectedDate)) {
            setSelectedDate(prev => addDays(prev, 1));
        }
    }

    const progress = useMemo(() => {
        const totalPoints = TASKS.reduce((acc, t) => acc + t.points, 0) + 20; // 20 for fasting
        const earnedPoints = TASKS
            .filter(t => completedTasks.includes(t.id))
            .reduce((acc, t) => acc + t.points, 0) + (isFasting ? 20 : 0);

        return Math.round((earnedPoints / totalPoints) * 100);
    }, [completedTasks, isFasting]);

    return (
        <div className="flex flex-col gap-6 my-4 relative">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-2xl font-bold text-slate-800">Sembahyang Harian</h2>
                <button
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-xs font-bold uppercase tracking-wider"
                >
                    <Share2 size={14} />
                    <span>Share</span>
                </button>
            </div>

            {/* Other Activities Accordion */}
            <div className="glass rounded-3xl overflow-hidden border border-white/40 shadow-sm">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/20 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle2 size={20} />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-slate-700">Daftar Kegiatan</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                                {completedTasks.length} / {TASKS.length} Kegiatan Selesai
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                            <p className="text-xs font-bold text-primary">{progress}%</p>
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                <div
                                    className="h-full bg-primary transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                </button>


                <div className={cn(
                    "transition-all duration-500 ease-in-out overflow-hidden",
                    isOpen ? "max-h-[800px]" : "max-h-0"
                )}>
                    {/* Date Navigator */}
                    <div className="glass rounded-3xl p-2 flex items-center justify-between shadow-sm border border-white/40">
                        <button
                            onClick={handlePrevDay}
                            className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-500"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-secondary" />
                            <span className="font-bold text-slate-700">
                                {format(selectedDate, "EEEE, d MMM", { locale: id })}
                            </span>
                            {isToday(selectedDate) && (
                                <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Hari Ini
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleNextDay}
                            disabled={isToday(selectedDate)}
                            className={cn(
                                "p-3 rounded-2xl transition-colors",
                                isToday(selectedDate) ? "text-slate-200 cursor-not-allowed" : "text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Fasting Card (Prominent) */}
                    <div className="p-4">
                        <div className={cn(
                            "relative overflow-hidden rounded-3xl p-6 transition-all duration-500 border shadow-md",
                            isFasting
                                ? "bg-linear-to-br from-amber-50 to-orange-100 border-orange-200"
                                : "bg-white/60 border-white/40"
                        )}>
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-amber-900">Puasa Harian</h3>
                                    <p className="text-sm text-amber-800/60">
                                        {isFasting ? "Barakallah! Puasa sedang berjalan." : "Apakah kamu berpuasa hari ini?"}
                                    </p>
                                    {!isFasting && (
                                        <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-100 border-orange-200 flex items-center gap-4 mt-4">
                                            <p className="text-xs text-amber-800/70 italic"><MessageCircleWarning size={18} /> </p>
                                            <p className="text-sm text-amber-800/70 italic">Sedang tidak berpuasa hari ini</p>
                                        </div>
                                    )}
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isFasting}
                                        onChange={toggleFasting}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            {isFasting && (
                                <div className="relative z-10 flex items-center gap-4 bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Moon size={24} className="fill-current" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-amber-900 leading-none mb-1 text-sm">Puasa Dilaksanakan</p>
                                        <p className="text-xs text-amber-800/70 italic">Semoga Allah menerima puasamu.</p>
                                    </div>
                                    <Sparkles className="ml-auto text-amber-400 opacity-60" size={16} />
                                </div>
                            )}

                            {/* Decorative element */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-400/10 blur-3xl rounded-full"></div>
                        </div>
                    </div>

                    <div className="p-4 grid gap-3">
                        {TASKS.map((task) => {
                            const isCompleted = completedTasks.includes(task.id);
                            return (
                                <button
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border text-left",
                                        isCompleted
                                            ? "bg-primary/5 border-primary/20 shadow-inner"
                                            : "bg-white/40 border-transparent hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                                            isCompleted ? "bg-primary text-white scale-110" : "border-2 border-slate-200 text-transparent"
                                        )}>
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className={cn(
                                            "font-semibold text-sm transition-all",
                                            isCompleted ? "text-slate-500 line-through" : "text-slate-700"
                                        )}>
                                            {task.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-lg">
                                            +{task.points} XP
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Share Progress Modal */}
            <ShareProgress
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                selectedDate={selectedDate}
                completedTasks={completedTasks}
                isFasting={isFasting}
            />
        </div>
    );
}
