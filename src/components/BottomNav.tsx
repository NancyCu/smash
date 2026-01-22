"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home as HomeIcon, PlusCircle, LayoutGrid, Trophy, User, Sun, Moon, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const currentView = searchParams.get("view") || "home";
  
  // Helper to determine if a specific view is active
  const isActive = (targetView: string) => {
    if (pathname !== "/") return false;
    // Default to home if no view param
    if (!searchParams.get("view") && targetView === "home") return true;
    return currentView === targetView;
  };

  const isRouteActive = (route: string) => pathname === route;

  const navigateToView = (view: string) => {
    router.push(`/?view=${view}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-6 md:w-auto md:rounded-2xl md:border md:border-slate-200 md:dark:border-white/10 md:shadow-2xl md:min-w-[400px] bg-slate-100/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 md:border-t-0 px-6 py-3 md:px-8 md:py-4 z-50 transition-all duration-300">
      <div className="max-w-lg mx-auto md:w-full flex justify-between items-center gap-2 md:gap-8">
        
        {/* Home */}
        <button 
          onClick={() => navigateToView("home")}
          className={cn("flex flex-col items-center gap-1 transition-colors relative group min-w-[3rem]", isActive("home") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {isActive("home") && <span className="absolute -top-3 md:-top-4 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>

        {/* Create */}
        <button 
          onClick={() => navigateToView("create")}
          className={cn("flex flex-col items-center gap-1 transition-colors relative group", isActive("create") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {isActive("create") && <span className="absolute -top-3 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Create</span>
        </button>

        {/* Join */}
        <button 
          onClick={() => navigateToView("join")}
          className={cn("flex flex-col items-center gap-1 transition-colors relative group", isActive("join") || isActive("game") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {(isActive("join") || isActive("game")) && <span className="absolute -top-3 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Join</span>
        </button>

        {/* Props */}
        <button 
          onClick={() => navigateToView("props")}
          className={cn("flex flex-col items-center gap-1 transition-colors relative group", isActive("props") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {isActive("props") && <span className="absolute -top-3 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <Zap className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Props</span>
        </button>

        {/* Winners */}
        <Link
          href="/winners"
          className={cn("flex flex-col items-center gap-1 transition-colors relative group", isRouteActive("/winners") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {isRouteActive("/winners") && <span className="absolute -top-3 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Winners</span>
        </Link>

        {/* Rules */}
        <Link
          href="/rules"
          className={cn("flex flex-col items-center gap-1 transition-colors relative group", isRouteActive("/rules") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {isRouteActive("/rules") && <span className="absolute -top-3 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <BookOpen className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Rules</span>
        </Link>

        {/* Profile */}
        <Link 
          href="/profile"
          className={cn("flex flex-col items-center gap-1 transition-colors relative group", isRouteActive("/profile") ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300")}
        >
          {isRouteActive("/profile") && <span className="absolute -top-3 w-8 h-1 bg-cyan-500/50 rounded-b-full shadow-[0_0_10px_cyan]"></span>}
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
        </Link>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

      </div>
    </nav>
  );
}
