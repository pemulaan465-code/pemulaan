import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "AI Clipper - Auto Viral Video Clips",
  description: "AI-powered video clipping, auto subtitle, and viral content generator.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
