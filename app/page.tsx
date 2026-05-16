"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import NpvProfile from "@/components/NpvProfile";

export default function Home() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [triggerTimestamp, setTriggerTimestamp] = useState<number>(0);

  const handleDataChange = (data: any, triggerAi?: boolean) => {
    setAnalysisData(data);
    if (triggerAi) {
      setTriggerTimestamp(Date.now());
    }
  };

  return (
    <main className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        <NpvProfile onDataChange={handleDataChange} />
        <RightPanel analysisData={analysisData} triggerAi={triggerTimestamp} />
      </div>
    </main>
  );
}
