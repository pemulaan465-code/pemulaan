"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HeroSection from "@/components/HeroSection";
import MoodCarousel from "@/components/MoodCarousel";
import ClipsPanel from "@/components/ClipsPanel";
import AIVideosPanel from "@/components/AIVideosPanel";
import { uploadVideo } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadVideo(file);
      setActiveTab("clips");
    } catch (e: any) {
      alert(e.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0c0c0e]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="ml-64 flex-1">
        <TopBar />
        <main className="p-6">
          {activeTab === "home" && (
            <div className="space-y-6">
              <HeroSection onUpload={handleUpload} uploading={uploading} />
              <MoodCarousel />
            </div>
          )}
          {activeTab === "clips" && <ClipsPanel />}
          {activeTab === "ai-videos" && <AIVideosPanel />}
        </main>
      </div>
    </div>
  );
}