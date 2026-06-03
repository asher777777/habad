"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getNedarimSettings, saveNedarimSettings } from "./actions";

export function NedarimSettingsForm() {
  const [settings, setSettings] = useState({ mosadid: "", apivalid: "", group: "", apipassword: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getNedarimSettings().then((data) => {
      if (data) setSettings(data as any);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveNedarimSettings(settings);
      if (res.success) {
        alert("ההגדרות נשמרו בהצלחה!");
      } else {
        alert("שגיאה בשמירת ההגדרות: " + res.error);
      }
    } catch (e) {
      alert("שגיאה בתקשורת עם השרת");
    }
    setIsSaving(false);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl bg-card border rounded-2xl p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium mb-2">Mosad ID (מספר מוסד)</label>
        <input 
          type="text" 
          value={settings.mosadid} 
          onChange={(e) => setSettings({...settings, mosadid: e.target.value})} 
          className="w-full h-12 px-4 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">API Valid (טוקן)</label>
        <input 
          type="text" 
          value={settings.apivalid} 
          onChange={(e) => setSettings({...settings, apivalid: e.target.value})} 
          className="w-full h-12 px-4 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">API Password (סיסמת דוחות / משיכת נתונים)</label>
        <p className="text-[11px] text-muted-foreground mb-2">
          דרוש לשם הפקת קבלות ידניות (יש לבקש מחברת נדרים פלוס).
        </p>
        <input 
          type="text" 
          value={settings.apipassword || ""} 
          onChange={(e) => setSettings({...settings, apipassword: e.target.value})} 
          className="w-full h-12 px-4 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      <Button type="submit" disabled={isSaving} className="w-full h-12">
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
