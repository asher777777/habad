"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Server, Sparkles, CreditCard, Users, Settings, Home, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardLinks = [
  { name: "ראשי", href: "/dashboard", icon: LayoutDashboard },
  { name: "ניהול CRM", href: "/dashboard/crm", icon: Users },
  { name: "אנליטיקה", href: "/dashboard/crm/analytics", icon: TrendingUp },
  { name: "וואטסאפ", href: "/dashboard/whatsapp", icon: MessageSquare },
  { name: "קבלות ידניות", href: "/dashboard/receipts", icon: FileText },
  { name: "יצירת תוכן", href: "/dashboard/services", icon: Sparkles },
  { name: "הגדרות", href: "/dashboard/settings", icon: Settings },
];

interface DashboardShellProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  geminiActive: boolean;
  nedarimActive: boolean;
  dbActive: boolean;
}

export function DashboardShell({
  children,
  modal,
  geminiActive,
  nedarimActive,
  dbActive,
}: DashboardShellProps) {
  const pathname = usePathname();


  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full" dir="rtl">
      
      {/* Header & Status Indicator Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 print:hidden">
        <div className="space-y-1 text-right">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            מרכז בקרה ותפעול
          </h1>
          <p className="text-muted-foreground text-sm">
            מערכת חכמה לניהול בית חב״ד וניהול תוכן דינמי
          </p>
        </div>

        {/* Server & API Status Badges Container */}
        <div className="flex items-center self-start md:self-center gap-3 bg-white/70 backdrop-blur-md border border-slate-200/60 px-4 py-2 rounded-2xl shadow-sm text-xs font-semibold">
          {/* Database connection */}
          <div className="flex items-center gap-2" title={dbActive ? "בסיס הנתונים מחובר ותקין" : "שגיאה בחיבור לבסיס הנתונים"}>
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dbActive ? 'bg-emerald-400' : 'bg-rose-400')}></span>
              <span className={cn("relative inline-flex rounded-full h-2 w-2", dbActive ? 'bg-emerald-500' : 'bg-rose-500')}></span>
            </span>
            <span className="text-slate-600 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              Database
            </span>
          </div>

          <span className="w-px h-4 bg-slate-200" />

          {/* Gemini connection */}
          <div className="flex items-center gap-2" title={geminiActive ? "סוכן ה-AI (Gemini) מחובר ומפתח API מוגדר" : "מפתח API של Gemini AI לא הוגדר בהגדרות"}>
            <span className="relative flex h-2 w-2">
              {geminiActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", geminiActive ? 'bg-emerald-500' : 'bg-amber-500')}></span>
            </span>
            <span className="text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Gemini AI
            </span>
          </div>

          <span className="w-px h-4 bg-slate-200" />

          {/* Nedarim connection */}
          <div className="flex items-center gap-2" title={nedarimActive ? "מסוף נדרים פלוס מוגדר ותקין" : "פרטי מסוף נדרים פלוס חסרים (הכנסות לא יקלטו)"}>
            <span className="relative flex h-2 w-2">
              {nedarimActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", nedarimActive ? 'bg-emerald-500' : 'bg-amber-500')}></span>
            </span>
            <span className="text-slate-600 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              סליקה (נדרים)
            </span>
          </div>
        </div>
      </header>

      {/* Dashboard Navigation Bar */}
      <div className="w-full bg-slate-100/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 flex flex-wrap gap-1 items-center print:hidden">
        {dashboardLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                isActive
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              )}
            >
              <link.icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
              {link.name}
            </Link>
          );
        })}
        
        {/* Separator / Spacer */}
        <div className="flex-grow" />
        
        {/* Back to site button */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/40 transition-all duration-300"
        >
          <Home className="w-4 h-4 text-slate-400" />
          חזרה לאתר
        </Link>
      </div>

      {/* Main View */}
      <main className="w-full transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key="overview-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {modal}
    </div>
  );
}
