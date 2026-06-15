"use client";

import { Bell, User } from "lucide-react";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0c0c0e]/80 px-6 backdrop-blur-xl">
      <h1 className="text-lg font-bold text-white">Home</h1>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-white/5 bg-[#141416] py-1 pl-1 pr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">pemulaaan</span>
          </div>
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">FREE</span>
        </div>
      </div>
    </header>
  );
}
