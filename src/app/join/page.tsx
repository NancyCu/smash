"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import JoinGameForm from '@/components/JoinGameForm';
import { ArrowLeft, Search } from 'lucide-react';

export default function JoinPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0B0C15] flex flex-col items-center p-4 lg:p-8 relative overflow-hidden">
       
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px]" />
       </div>

       <div className="w-full max-w-md relative z-10 flex flex-col gap-8 mt-10">
           
           {/* HEADER */}
           <div className="flex items-center justify-between">
               <div onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors group">
                   <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                   </div>
                   <span className="font-bold uppercase text-xs tracking-widest">Back</span>
               </div>
               
               <div className="flex items-center gap-2">
                   <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-10 w-auto object-contain rounded-lg" />
               </div>
           </div>

           <div className="bg-[#151725] border border-white/10 p-8 rounded-3xl shadow-2xl">
               <div className="text-center mb-6">
                   <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 text-indigo-400">
                       <Search className="w-6 h-6" />
                   </div>
                   <h1 className="text-2xl font-black text-white uppercase tracking-wider">Join A Game</h1>
                   <p className="text-slate-400 text-sm mt-1">Enter the game code shared by your host.</p>
               </div>

               {/* The Form handles navigation automatically now */}
               <JoinGameForm />
           </div>

       </div>
    </main>
  );
}