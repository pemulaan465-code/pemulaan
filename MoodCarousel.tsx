"use client";

const moods = [
  { icon: "🏠", label: "Rumah", badge: null },
  { icon: "🍴", label: "Kuliner", badge: "New!" },
  { icon: "😎", label: "Santai", badge: null },
  { icon: "🔥", label: "Viral", badge: "Hot!" },
  { icon: "🎮", label: "Gaming", badge: null },
  { icon: "✈️", label: "Travel", badge: null },
];

export default function MoodCarousel() {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-thin">
        {moods.map((m, i) => (
          <div
            key={i}
            className="group relative flex min-w-[100px] cursor-pointer flex-col items-center gap-2 rounded-2xl border border-white/5 bg-[#141416] p-4 transition hover:-translate-y-1 hover:border-yellow-500/30 hover:bg-[#1a1a1d]"
          >
            {m.badge && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg">
                {m.badge}
              </span>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-2xl transition group-hover:scale-110">
              {m.icon}
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
