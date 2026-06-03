"use client";

import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useOnlineStatus, useWindowSize } from "@/hooks/useBrowserSync";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { SquishyButton } from "@/components/motion/SquishyButton";


export default function StateDemoPage() {
  const { theme, setTheme, toggleSidebar, isSidebarOpen } = useUIStore();
  const { user, setUser, logout } = useAuthStore();
  const isOnline = useOnlineStatus();
  const { width, height } = useWindowSize();

  return (
    <main className="min-h-screen bg-background p-8 space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client State Architecture</h1>
          <p className="text-muted-foreground">Minimal footprint, ultra-performant state management.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm font-mono">{width}x{height}</span>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="p-6 bg-card border rounded-2xl space-y-4">
            <h2 className="text-xl font-semibold">Global UI Store (Zustand)</h2>
            <div className="flex gap-2">
              {["light", "dark", "system"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t as any)}
                  className={`px-3 py-1 rounded-md border text-sm capitalize ${
                    theme === t ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <SquishyButton onClick={toggleSidebar}>
              Toggle Sidebar: {isSidebarOpen ? "OPEN" : "CLOSED"}
            </SquishyButton>
          </div>

          <div className="p-6 bg-card border rounded-2xl space-y-4">
            <h2 className="text-xl font-semibold">Auth Store (Zustand)</h2>
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <button onClick={logout} className="text-destructive text-sm font-medium">Logout</button>
              </div>
            ) : (
              <SquishyButton
                onClick={() => setUser({ id: "1", name: "John Doe", email: "john@example.com", role: "USER" })}
              >
                Mock Login
              </SquishyButton>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Complex Local State (useReducer)</h2>
            <OnboardingWizard />
          </div>
        </section>
      </div>

      <div className="fixed bottom-8 left-8 p-4 bg-primary text-primary-foreground rounded-xl shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest">State Syncing</p>
        <p className="text-lg">Zustand + useSyncExternalStore</p>
      </div>
    </main>
  );
}
