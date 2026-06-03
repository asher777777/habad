import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getShabbatTimes } from "@/features/shabbat/actions";
import { Clock, BookOpen, Flame, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "זמני שבת ותפילה - בית חב\"ד אזור",
  description: "זמני כניסת ויציאת שבת, זמני תפילות בבית חב\"ד אזור ודבר תורה חסידי שבועי לפרשת השבוע. מעודכן לפי לוח חב\"ד אזור זמן תל אביב.",
};

export default async function ShabbatPage() {
  const shabbatData = await getShabbatTimes();
  
  // Fallbacks if data is not loaded yet
  const candleLighting = shabbatData?.candleLighting || "19:10";
  const havdalah = shabbatData?.havdalah || "20:31";
  const parasha = shabbatData?.parashaHebrew || "פרשת השבוע";
  const dvarTorah = shabbatData?.dvarTorah || `בס"ד\n\nשבת שלום לכל הקהילה החמה שלנו באזור!\n\nהשבוע אנו קוראים את פרשת השבוע. אנו מזמינים אתכם להצטרף אלינו לתפילות ולסעודות השבת בבית חב"ד באווירה משפחתית, שירה ודברי תורה.\n\nשתהיה שבת שלום ומבורכת, מלאה באור, שמחה וברכה לכם ולכל בני ביתכם!`;
  
  const prayerTimes = shabbatData?.prayerTimes || {
    minchaErevShabbat: "19:10",
    shacharitShabbat: "10:00",
    minchaShabbat: "18:30",
    arvitMotzeiShabbat: "20:31"
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-24 relative overflow-hidden">
        {/* Ambient lighting glows */}
        <div className="absolute right-[-100px] top-[10%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-[-100px] bottom-[15%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-pattern opacity-5 bg-repeat bg-center pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 space-y-16 relative z-10">
          
          {/* Header Block */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>שבת שלום באזור</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
              זמני שבת <span className="text-amber-400">ותפילות</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              זמני כניסת ויציאת שבת ולוח התפילות בבית חב"ד אזור (לפי אופק תל אביב ולוח חב"ד), בתוספת דבר תורה שבועי מעורר השראה.
            </p>
          </div>

          {/* Time & Prayer grids */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Candle Lighting Card */}
            <div className="md:col-span-5 bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between text-center space-y-8 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
              <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-400">פרשת השבוע</h3>
                <h2 className="text-3xl md:text-4xl font-black text-amber-400 tracking-wide">{parasha}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/80">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 block">הדלקת נרות (30 דק')</span>
                  <span className="text-3xl font-black text-white">{candleLighting}</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 block">מוצאי שבת (50 דק')</span>
                  <span className="text-3xl font-black text-white">{havdalah}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>זמני חב"ד - אופק תל אביב</span>
              </div>
            </div>

            {/* Prayer Times Card */}
            <div className="md:col-span-7 bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-8 space-y-6 flex flex-col justify-between hover:border-amber-500/20 transition-all duration-500">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  לוח זמני התפילות בבית חב"ד
                </h3>
                <p className="text-slate-400 text-xs">התפילות מתקיימות במניין ובאווירה חמה ושמחה</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "מנחה וקבלת שבת (ערב שבת)", time: prayerTimes.minchaErevShabbat, desc: "בזמן הדלקת נרות" },
                  { label: "שחרית שבת (בוקר)", time: prayerTimes.shacharitShabbat, desc: "לאחר שיעור חסידות ב-09:00" },
                  { label: "מנחה שבת (אחה\"צ)", time: prayerTimes.minchaShabbat, desc: "אחריה סעודה שלישית ודא\"ח" },
                  { label: "ערבית ומוצאי שבת", time: prayerTimes.arvitMotzeiShabbat, desc: "בזמן יציאת שבת" }
                ].map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/40 transition-colors">
                    <div>
                      <p className="font-bold text-sm md:text-base text-slate-200">{p.label}</p>
                      <p className="text-[10px] text-slate-500">{p.desc}</p>
                    </div>
                    <span className="text-lg font-black text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-xl border border-amber-500/20">
                      {p.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dvar Torah Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-6 h-6 text-amber-400" />
              דבר תורה חסידי לפרשת {parasha}
            </h3>

            <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/60 rounded-[3rem] p-8 md:p-12 space-y-6 relative">
              <div className="absolute right-6 top-6 text-6xl text-slate-800 font-serif select-none pointer-events-none">״</div>
              <div className="prose prose-invert max-w-none text-slate-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap relative z-10 font-medium">
                {dvarTorah}
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
