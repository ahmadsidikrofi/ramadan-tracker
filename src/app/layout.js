import { Geist, Geist_Mono } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ramadan Tracker",
  description: "Aplikasi Jurnal dan Tracker Ibadah Ramadan Harian",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Amal.in"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#064e3b"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex justify-center bg-gray-50`}
      >
        <main className="w-full max-w-md bg-background shadow-2xl min-h-screen relative overflow-hidden">
          {children}
          <InstallPrompt />
        </main>
      </body>
    </html>
  );
}
