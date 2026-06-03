"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LiquidGlass } from "@/components/motion/LiquidGlass";
import { SquishyButton } from "@/components/motion/SquishyButton";
import { SquishyTabs } from "@/components/motion/SquishyTabs";

export default function MotionDemoPage() {
  const [activeTab, setActiveTab] = useState("button");

  const tabs = [
    { id: "button", label: "Squishy Button" },
    { id: "glass", label: "Liquid Glass" },
    { id: "motion", label: "Micro-Interactions" },
  ];

  return (
    <main className="min-h-screen bg-background p-8 flex flex-col items-center justify-center gap-12 overflow-hidden">
      <div className="max-w-2xl w-full text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          2026 UI Trends: Liquid & Squishy
        </h1>
        <p className="text-muted-foreground text-lg">
          Physics-based interactions and dynamic SVG distortions for the next generation of web interfaces.
        </p>
      </div>

      <SquishyTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="w-full max-w-4xl flex items-center justify-center min-h-[400px]">
        {activeTab === "button" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <SquishyButton className="text-xl px-12 py-6">
              Push Me
            </SquishyButton>
            <p className="text-sm text-muted-foreground">Organic spring dynamics (React Spring)</p>
          </motion.div>
        )}

        {activeTab === "glass" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex items-center justify-center"
          >
            <LiquidGlass className="w-80 h-80 flex items-center justify-center p-8 rounded-full border border-white/20">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">Refractive Glass</h3>
                <p className="text-white/80 mt-2">SVG Displacement Map</p>
              </div>
            </LiquidGlass>
          </motion.div>
        )}

        {activeTab === "motion" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-8"
          >
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-40 h-40 bg-accent/20 rounded-3xl flex items-center justify-center cursor-pointer border border-accent/30"
              >
                <div className="w-12 h-12 bg-accent rounded-full animate-pulse" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 flex justify-between text-xs text-muted-foreground uppercase tracking-widest font-semibold">
        <span>Hardware Accelerated</span>
        <span>Reduced Motion Compatible</span>
        <span>2026 UI TRENDS</span>
      </div>
    </main>
  );
}
