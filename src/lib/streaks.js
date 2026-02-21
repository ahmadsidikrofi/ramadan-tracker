import { format, subDays, isSameDay } from "date-fns";

export function calculateStreaks() {
    const today = new Date();

    const fastingStreak = getStreak(today, (key, tasks) => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(`ramadan-fasting-${key}`) === "true";
    });
    const tarawihStreak = getStreak(today, (key, tasks) => tasks.includes("tarawih"));
    const prayerStreak = getStreak(today, (key, tasks) => {
        const required = ["subuh", "zuhur", "ashar", "maghrib", "isya"];
        return required.every(r => tasks.includes(r));
    });

    return {
        fasting: fastingStreak,
        prayer: prayerStreak,
        tarawih: tarawihStreak
    };
}

function getStreak(today, predicate) {
    let streak = 0;

    // Check Today
    const todayKey = format(today, "yyyy-MM-dd");
    const todayData = loadTasks(todayKey);
    const todayDone = predicate(todayKey, todayData);

    if (todayDone) {
        streak++;
    }

    // Check previous days
    let pointer = subDays(today, 1);
    while (true) {
        const key = format(pointer, "yyyy-MM-dd");
        if (predicate(key, loadTasks(key))) {
            streak++;
            pointer = subDays(pointer, 1);
        } else {
            break;
        }
    }

    return streak;
}

function loadTasks(dateKey) {
    if (typeof window === "undefined") return [];
    try {
        const item = window.localStorage.getItem(`ramadan-tracker-${dateKey}`);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        return [];
    }
}

export function getBadges(fastingStreak) {
    if (fastingStreak >= 30) return { label: "30 Hari Kemenangan", icon: "🏆", color: "text-yellow-500", bg: "bg-yellow-100" };
    if (fastingStreak >= 21) return { label: "21 Hari Konsisten", icon: "🔥", color: "text-orange-500", bg: "bg-orange-100" };
    if (fastingStreak >= 14) return { label: "14 Hari Berkah", icon: "✨", color: "text-purple-500", bg: "bg-purple-100" };
    if (fastingStreak >= 7) return { label: "7 Hari Semangat", icon: "⭐", color: "text-blue-500", bg: "bg-blue-100" };
    if (fastingStreak >= 3) return { label: "3 Hari Awal", icon: "🌱", color: "text-emerald-500", bg: "bg-emerald-100" };
    return { label: "Pejuang Ramadan", icon: "🤲", color: "text-gray-500", bg: "bg-gray-100" };
}
