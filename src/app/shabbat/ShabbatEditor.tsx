"use client";

import { useState } from "react";
import { 
  Save, X, Loader2, CloudDownload, MapPin, Sparkles, Wand2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShabbatTimesData, saveShabbatTimes, fetchShabbatTimesFromAPI } from "@/features/shabbat/actions";
import { rephraseTextWithAI } from "@/features/ai/actions";

interface ShabbatEditorProps {
  initialData: ShabbatTimesData | null;
  setIsEditing: (val: boolean) => void;
  onSave: (data: ShabbatTimesData) => void;
}

export function ShabbatEditor({ initialData, setIsEditing, onSave }: ShabbatEditorProps) {
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const [data, setData] = useState<ShabbatTimesData>(initialData || {
    candleLighting: "19:10",
    havdalah: "20:31",
    parashaHebrew: "פרשת השבוע",
    parashaEnglish: "Parashat Hashavua",
    dvarTorah: "בס\"ד\n\nשבת שלום לכל הקהילה החמה שלנו באזור!\n\nהשבוע אנו קוראים את פרשת השבוע. אנו מזמינים אתכם להצטרף אלינו לתפילות ולסעודות השבת בבית חב\"ד באווירה משפחתית, שירה ודברי תורה.\n\nשתהיה שבת שלום ומבורכת, מלאה באור, שמחה וברכה לכם ולכל בני ביתכם!",
    prayerTimes: {
      minchaErevShabbat: "19:10",
      shacharitShabbat: "10:00",
      minchaShabbat: "18:30",
      arvitMotzeiShabbat: "20:31"
    },
    weekdayPrayerTimes: {
      shacharit: "07:45",
      mincha: "בזמן הדלקת נרות (של שבת שעברה)",
      arvit: "צאת הכוכבים"
    },
    titles: {
      prayerTitle: "לוח זמני התפילות בבית חב\"ד",
      prayerSubtitle: "התפילות מתקיימות במניין ובאווירה חמה ושמחה",
      shabbatTitle: "זמני תפילות בשבת",
      weekdayTitle: "זמני תפילות ימות השבוע"
    },
    updatedAt: ""
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveShabbatTimes(data);
      if (res.success) {
        onSave(data);
        setIsEditing(false);
      } else {
        alert("שגיאה בשמירה: " + res.error);
      }
    } catch (e) {
      console.error(e);
      alert("שגיאה בשמירה.");
    } finally {
      setSaving(false);
    }
  };

  const handleFetchAPI = async () => {
    setFetching(true);
    try {
      const res = await fetchShabbatTimesFromAPI();
      if (res.success && res.data) {
        setData({
          ...data,
          candleLighting: res.data.candleLighting || data.candleLighting,
          havdalah: res.data.havdalah || data.havdalah,
          parashaHebrew: res.data.parashaHebrew || data.parashaHebrew,
          parashaEnglish: res.data.parashaEnglish || data.parashaEnglish
        });
      } else {
        alert("שגיאה בשליפת נתונים מ-Hebcal: " + res.error);
      }
    } catch (e) {
      console.error(e);
      alert("שגיאה בשליפת נתונים.");
    } finally {
      setFetching(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!data.parashaHebrew) {
      alert("יש להזין פרשת שבוע תחילה.");
      return;
    }
    setGeneratingAi(true);
    try {
      const promptText = `כתוב דבר תורה קצר, מחמם לב ומרגש ל${data.parashaHebrew}. הדגש מסר של אהבת ישראל, שמחה והתחברות. בסוף הוסף איחולי שבת שלום לקהילת חב"ד אזור.`;
      const res = await rephraseTextWithAI(promptText, "storytelling");
      if (res.success && res.text) {
        setData({ ...data, dvarTorah: res.text });
      } else {
        alert("שגיאה ביצירת תוכן AI: " + res.error);
      }
    } catch (e) {
      console.error(e);
      alert("שגיאה ביצירת תוכן.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const updatePrayerTime = (field: keyof typeof data.prayerTimes, value: string) => {
    setData({
      ...data,
      prayerTimes: {
        ...data.prayerTimes,
        [field]: value
      }
    });
  };

  const updateWeekdayPrayerTime = (field: "shacharit" | "mincha" | "arvit", value: string) => {
    setData({
      ...data,
      weekdayPrayerTimes: {
        ...(data.weekdayPrayerTimes || { shacharit: "", mincha: "", arvit: "" }),
        [field]: value
      }
    });
  };

  const updateTitle = (field: "prayerTitle" | "prayerSubtitle" | "shabbatTitle" | "weekdayTitle", value: string) => {
    setData({
      ...data,
      titles: {
        ...(data.titles || {}),
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50" dir="rtl">
      {/* Top Editor Bar */}
      <div className="sticky top-0 z-[100] bg-white border-b shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800">עריכת עמוד שבת</h1>
          <Button 
            onClick={handleFetchAPI} 
            disabled={fetching}
            variant="outline"
            className="flex items-center gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
            משוך זמנים אוטומטית (ת"א)
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsEditing(false)} 
            variant="ghost" 
            className="text-slate-500 hover:bg-slate-100 rounded-full w-10 h-10 p-0 flex items-center justify-center"
            title="ביטול"
          >
            <X className="w-5 h-5" />
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור שינויים
          </Button>
        </div>
      </div>

      <main className="flex-grow p-6 max-w-5xl mx-auto w-full space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Times */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              זמני שבת
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">פרשת השבוע</label>
                <input 
                  type="text" 
                  value={data.parashaHebrew}
                  onChange={(e) => setData({...data, parashaHebrew: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">הדלקת נרות</label>
                <input 
                  type="text" 
                  value={data.candleLighting}
                  onChange={(e) => setData({...data, candleLighting: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">מוצאי שבת / הבדלה</label>
                <input 
                  type="text" 
                  value={data.havdalah}
                  onChange={(e) => setData({...data, havdalah: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Prayer Times */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              זמני תפילות (חב"ד אזור)
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">מנחה ערב שבת (שישי)</label>
                <input 
                  type="text" 
                  value={data.prayerTimes.minchaErevShabbat}
                  onChange={(e) => updatePrayerTime("minchaErevShabbat", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">שחרית שבת (בוקר)</label>
                <input 
                  type="text" 
                  value={data.prayerTimes.shacharitShabbat}
                  onChange={(e) => updatePrayerTime("shacharitShabbat", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">מנחה שבת (אחה"צ)</label>
                <input 
                  type="text" 
                  value={data.prayerTimes.minchaShabbat}
                  onChange={(e) => updatePrayerTime("minchaShabbat", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ערבית מוצ"ש</label>
                <input 
                  type="text" 
                  value={data.prayerTimes.arvitMotzeiShabbat}
                  onChange={(e) => updatePrayerTime("arvitMotzeiShabbat", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-blue-500 pt-4 border-t mt-4">עריכת כותרות (אופציונלי)</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">כותרת זמני שבת</label>
                <input 
                  type="text" 
                  value={data.titles?.shabbatTitle || ""}
                  onChange={(e) => updateTitle("shabbatTitle", e.target.value)}
                  placeholder="זמני תפילות בשבת"
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">כותרת ימי חול</label>
                <input 
                  type="text" 
                  value={data.titles?.weekdayTitle || ""}
                  onChange={(e) => updateTitle("weekdayTitle", e.target.value)}
                  placeholder="זמני תפילות ימות השבוע"
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-blue-500 pt-4 border-t mt-4">ימות השבוע</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">שחרית</label>
                <input 
                  type="text" 
                  value={data.weekdayPrayerTimes?.shacharit || ""}
                  onChange={(e) => updateWeekdayPrayerTime("shacharit", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">מנחה</label>
                <input 
                  type="text" 
                  value={data.weekdayPrayerTimes?.mincha || ""}
                  onChange={(e) => updateWeekdayPrayerTime("mincha", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ערבית</label>
                <input 
                  type="text" 
                  value={data.weekdayPrayerTimes?.arvit || ""}
                  onChange={(e) => updateWeekdayPrayerTime("arvit", e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-black text-left bg-slate-50 focus:bg-white"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dvar Torah */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              דבר תורה
            </h2>
            <Button 
              onClick={handleAiGenerate}
              disabled={generatingAi}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm h-9"
            >
              {generatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              כתוב לי בעזרת AI
            </Button>
          </div>
          
          <textarea 
            value={data.dvarTorah}
            onChange={(e) => setData({...data, dvarTorah: e.target.value})}
            className="w-full px-4 py-4 border rounded-xl text-base bg-slate-50 focus:bg-white min-h-[300px] whitespace-pre-wrap leading-relaxed"
            placeholder="כתוב כאן את דבר התורה השבועי..."
          />
        </div>

      </main>
    </div>
  );
}
