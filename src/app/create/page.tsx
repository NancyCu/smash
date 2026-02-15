"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateGameForm from '@/components/CreateGameForm';
import { ArrowLeft } from 'lucide-react';

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Protect the route
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0B0C15] flex flex-col items-center p-4 lg:p-8 relative overflow-hidden">
       
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
       </div>

       <div className="w-full max-w-4xl relative z-10 flex flex-col gap-8">
           
           {/* HEADER */}
           <div className="flex items-center justify-between">
               <div onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors group">
                   <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                   </div>
                   <span className="font-bold uppercase text-xs tracking-widest">Back to Home</span>
               </div>
               
               <div className="flex items-center gap-2">
                   <div className="relative h-10 w-auto rounded-lg overflow-hidden">
                      <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-10 w-auto object-contain" />
                   </div>
                   <span className="font-black text-white uppercase tracking-wider hidden sm:inline">Souper Bowl Squares</span>
               </div>
           </div>

           {/* FORM CONTAINER - No Props Needed Now */}
           <div className="w-full flex justify-center">
              <CreateGameForm />
           </div>

       </div>
    </main>
  );
}