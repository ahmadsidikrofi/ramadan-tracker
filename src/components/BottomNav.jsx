"use client";

import { Home, BookOpen, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "quran", label: "Quran", icon: BookOpen, path: "/quran" },
    { id: "qibla", label: "Qibla", icon: Compass, path: "/qibla" }, // Placeholder for now
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 w-full glass z-50 border-t border-white/60 pb-safe pt-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center max-w-md mx-auto h-16">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path;

                    // Use Link for navigation
                    if (item.path) {
                        return (
                            <Link
                                href={item.path}
                                key={item.id}
                                className={cn(
                                    "flex flex-col items-center gap-1 transition-all duration-300 relative px-4 py-1 rounded-xl",
                                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    size={24}
                                    className={cn("transition-transform", isActive && "scale-110 stroke-[2.5]")}
                                />
                                <span className="text-[10px] font-medium tracking-wide">
                                    {item.label}
                                </span>
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </Link>
                        );
                    }

                    // Fallback to button if no path (though all current items have paths)
                    return (
                        <button
                            key={item.id}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all duration-300 relative px-4 py-1 rounded-xl",
                                isActive ? "text-primary bg-primary/10 px-3 py-2" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon
                                size={24}
                                className={cn("transition-transform", isActive && "scale-110 stroke-[2.5]")}
                            />
                            <span className="text-[10px] font-medium tracking-wide">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
