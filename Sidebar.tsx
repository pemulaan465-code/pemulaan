"use client";

import { Home, Film, Sparkles, Camera, MessageCircle, Zap, MessageSquare, Crown } from "lucide-react";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "clips", label: "Clips", icon: Film },
  { id: "ai-videos", label: "AI Videos", icon: Sparkles },
];

export default function Sidebar({ activeTab, onTabChange }: Props) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-[#0f0f11] p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-amber-900/30">
          <Crown className="h-6 w-6 text-black" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Mager Klip</span>
            <span className="rounded-md bg-gradient-to-r from-yellow-500 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">v0.10.0</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Powered by <span className="font-semibold text-yellow-500">Mager AI</span>
          </span>
        </div>
      </div>

      {/* Menu */}
      <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Menu</div>
      <nav className="mb-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 text-yellow-400"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Social buttons */}
      <div className="mb-6 space-y-2">
        <button className="flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-900/20 transition hover:opacity-90">
          <Camera className="h-4 w-4" /> Follow Instagram
        </button>
        <button className="flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:opacity-90">
          <MessageCircle className="h-4 w-4" /> Gabung Community
        </button>
      </div>

      {/* Moods */}
      <div className="mb-4 rounded-2xl border border-white/5 bg-[#141416] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-300">Moods Tersedia</span>
          <span className="text-lg">😎</span>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
          <span>Moods terpakai</span>
          <span className="font-bold text-white">0 moods</span>
        </div>
        <div className="mb-4 text-[11px] text-zinc-500">
          Gratis <span className="font-semibold text-yellow-500">1x Generate</span> (10 Clips)
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-900/30 transition hover:brightness-110">
          <Zap className="h-4 w-4" /> Beli Moods
        </button>
      </div>

      <button className="mt-auto flex w-full items-center gap-2 rounded-xl border border-white/5 px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200">
        <MessageSquare className="h-4 w-4" /> Berikan Saran
      </button>
    </aside>
  );
}
