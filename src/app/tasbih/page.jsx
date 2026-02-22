import TasbihView from "@/components/TasbihView";

export const metadata = {
    title: "Tasbih Digital - Ramadan Tracker",
    description: "Berdzikir dengan modern dan interaktif",
};

export default function TasbihPage() {
    return (
        <main className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-emerald-100 text-emerald-950 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-200">
            <TasbihView />
        </main>
    );
}
