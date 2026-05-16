"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Settings, 
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "260px" }}
      className="h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-border)] flex flex-col relative transition-all duration-300 ease-in-out"
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp className="text-white w-5 h-5" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl tracking-tight">FinCalc</span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <div className={cn(
          "sidebar-item sidebar-item-active",
          isCollapsed && "justify-center px-0"
        )}>
          <BarChart3 size={20} />
          {!isCollapsed && <span>NPV Profile</span>}
        </div>
      </nav>

      <div className="p-4 border-t border-[var(--color-border)] space-y-2">
        <div className={cn(
          "sidebar-item",
          isCollapsed && "justify-center px-0"
        )}>
          <Settings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </div>
        <div className={cn(
          "sidebar-item",
          isCollapsed && "justify-center px-0"
        )}>
          <HelpCircle size={20} />
          {!isCollapsed && <span>Help</span>}
        </div>
      </div>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-[var(--color-secondary)] transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.div>
  );
}
