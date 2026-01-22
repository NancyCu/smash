"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { UserCircle } from "lucide-react";

export default function AuthModal() {
  const { signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      setSubmitting(false);
      return;
    }
    if (!password) {
      setError("Password is required.");
      setSubmitting(false);
      return;
    }
    if (mode === "signup") {
      const safeName = displayName.trim();
      if (!safeName) {
        setError("Display name is required.");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (mode === "signin") {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password, displayName);
      }
    } catch (err) {
      console.error(err);
      setError(mode === "signin" ? "Failed to sign in. Please try again." : "Failed to create account. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md md:max-w-lg lg:max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-pink-600 via-indigo-600 to-cyan-600 p-0 text-white text-center relative overflow-hidden h-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative w-full h-full">
             <Image
                src="/SouperBowlBanner.png"
                alt="Beef Noodle Souper Bowl Squares"
                fill
                className="object-cover"
                priority
              />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={
                  mode === "signin"
                    ? "flex-1 py-2 rounded-xl bg-cyan-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/30 transition-all"
                    : "flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 font-black text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all"
                }
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={
                  mode === "signup"
                    ? "flex-1 py-2 rounded-xl bg-pink-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-500/30 transition-all"
                    : "flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 font-black text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all"
                }
              >
                Sign Up
              </button>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <UserCircle className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                  Display Name
                </label>
                <input
                  required
                  name="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  type="text"
                  placeholder="Pick a handle"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                />
                <p className="text-[9px] uppercase tracking-widest text-cyan-600 dark:text-cyan-500 font-bold ml-1">
                  This is how you'll appear on the grid.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <input
                required
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                required
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>

            {error && (
              <p className="text-pink-500 text-xs font-bold text-center animate-pulse bg-pink-950/30 p-2 rounded-lg border border-pink-500/20">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            {submitting ? (mode === "signin" ? "Signing in..." : "Creating account...") : (mode === "signin" ? "Sign In" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}
