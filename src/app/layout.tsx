import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { GameProvider } from "@/context/GameContext";
import { ThemeProvider } from "@/context/ThemeContext";
import BottomNav from "@/components/BottomNav";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Squares Royale",
  description: "The ultimate squares game for sports fans",
};

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="en" className="dark">  {/* <--- ADD IT HERE */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
     <body className="antialiased bg-[#0B0C15] text-white">
        <ThemeProvider>
          <AuthProvider>
            <GameProvider>
              <div className="min-h-screen w-full relative flex flex-col">
                {children}
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
              </div>
            </GameProvider>
          </AuthProvider>
        </ThemeProvider>
       <SpeedInsights />
      </body>
    </html>
  );
}