"use client";

import Header from "@/components/Header";
import PrayerTimes from "@/components/PrayerTimes";
import MenuGrid from "@/components/MenuGrid";
import DailyTracker from "@/components/DailyTracker";
import ReadingCard from "@/components/ReadingCard";
import JournalCard from "@/components/JournalCard";
import ConsistencyCard from "@/components/ConsistencyCard";
import InspirationCard from "@/components/InspirationCard";
import StreakBadges from "@/components/StreakBadges";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-8 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="fixed top-[-50px] left-[-50px] w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-[100px] right-[-50px] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="relative z-10 w-full max-w-xl mx-auto flex flex-col mb-12">
        {/* Unified Hero Section */}
        <section className="bg-gradient-to-br from-primary to-secondary rounded-b-[5rem] p-6 shadow-xl relative overflow-hidden text-primary-foreground">
          <Header />
          <PrayerTimes />
        </section>
        {/* Quick Menu */}
        <section className="px-4 py-0">
          <MenuGrid />
        </section>

        <div className="px-4 flex flex-col">
          {/* Daily Progress */}
          <section>
            <DailyTracker />
          </section>

          {/* Streaks & Badges */}
          <section>
            <StreakBadges />
          </section>

          {/* Continue Reading */}
          <section>
            <ReadingCard />
          </section>

          {/* Consistency */}
          <section>
            <ConsistencyCard />
          </section>

          {/* Inspiration */}
          <section>
            <InspirationCard />
          </section>

          {/* Journal */}
          <section>
            <JournalCard />
          </section>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
