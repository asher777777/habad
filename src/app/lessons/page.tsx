import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getAllPosts } from "@/features/posts/actions";
import Link from "next/link";
import { 
  Clock, 
  User, 
  MapPin, 
  ArrowLeft, 
  GraduationCap, 
  Users, 
  HeartHandshake
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שיעורי תורה והרצאות - בית חב\"ד אזור",
  description: "לוח שיעורי תורה השבועי והרצאות מרתקות בבית חב\"ד אזור. מגוון שיעורים בנושאי הלכה, גמרא, חסידות, קבלה ופרשת שבוע לנשים וגברים באווירה פתוחה ומזמינה.",
};

const weeklyClasses = [
  {
    day: "יום ראשון",
    time: "20:00 - 21:00",
    subject: "הלכה למעשה בחיי היום-יום",
    audience: "גברים ונשים",
    location: "בית חב\"ד",
    teacher: "הרב שלמה גולדשטיין"
  },
  {
    day: "יום שני",
    time: "10:30 - 11:30",
    subject: "נפלאות החסידות ופרשת שבוע",
    audience: "נשים",
    location: "אולם הסדנאות",
    teacher: "הרבנית שירה גולדשטיין"
  },
  {
    day: "יום שלישי",
    time: "20:30 - 22:00",
    subject: "תלמוד וגמרא בעיון מעמיק",
    audience: "גברים",
    location: "בית המדרש",
    teacher: "הרב מנחם מענדל"
  },
  {
    day: "יום רביעי",
    time: "20:00 - 21:15",
    subject: "פרשת השבוע ואקטואליה לאור הקבלה",
    audience: "כולם מוזמנים",
    location: "בית חב\"ד",
    teacher: "הרב שלמה גולדשטיין"
  },
  {
    day: "יום חמישי",
    time: "20:30 - 21:30",
    subject: "חסידות ועיון בדבר מלכות",
    audience: "גברים",
    location: "בית המדרש",
    teacher: "הרב לוי יצחק"
  }
];

export default async function LessonsPage() {
  const posts = await getAllPosts();
  const torahPosts = posts.filter(
    (p) => p.published && (p.category === "פרשת שבוע" || p.category === "הלכה יומית" || p.category === "חגים ומועדים")
  ).slice(0, 3); // Take the top 3 Torah-related posts

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-24">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 space-y-20">
          
          {/* Header Block */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <GraduationCap className="w-3.5 h-3.5 text-secondary" />
              <span>לימוד והעשרה</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight">
              שיעורי תורה <span className="text-primary">והשראה</span>
            </h1>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              הצטרפו לקהילת הלימוד של בית חב"ד. השיעורים מתקיימים באווירה נעימה ומאירת פנים, המאפשרת לכל אחד ואחת להתחבר לחוכמת הדורות בגובה העיניים.
            </p>
          </div>

          {/* Timetable Section */}
          <div className="space-y-8">
            <div className="text-right space-y-2">
              <h2 className="text-3xl font-black text-slate-800">מערכת השיעורים השבועית</h2>
              <p className="text-slate-500 text-sm">הכניסה חופשית לכל השיעורים, אין צורך בידע מקדים!</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-sm font-bold border-b border-slate-800">
                      <th className="p-6">יום בשבוע</th>
                      <th className="p-6">שעות</th>
                      <th className="p-6">נושא הלימוד</th>
                      <th className="p-6">קהל יעד</th>
                      <th className="p-6">מיקום</th>
                      <th className="p-6">מרצה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {weeklyClasses.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-6 font-bold text-primary">{item.day}</td>
                        <td className="p-6">
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-100 text-slate-800 py-1 px-3 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {item.time}
                          </span>
                        </td>
                        <td className="p-6 font-extrabold text-slate-800 text-base">{item.subject}</td>
                        <td className="p-6">
                          <span className="inline-flex items-center gap-1 bg-primary/5 text-primary text-xs font-bold py-1 px-2.5 rounded-md">
                            <Users className="w-3.5 h-3.5" />
                            {item.audience}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-secondary" />
                            {item.location}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {item.teacher}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dynamic Blog Feed for Torah / Parasha */}
          {torahPosts.length > 0 && (
            <div className="space-y-8">
              <div className="text-right space-y-2">
                <h2 className="text-3xl font-black text-slate-800">תובנות לפרשה ופרשנות אישית</h2>
                <p className="text-slate-500 text-sm">מאמרים, רעיונות לפרשת שבוע והלכות שנכתבו על ידי ה-AI של בית חב"ד</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {torahPosts.map((post) => {
                  const isGradient = post.imageUrl?.startsWith("linear-gradient");
                  const imageStyle = isGradient 
                    ? { background: post.imageUrl } 
                    : { backgroundImage: `url(${post.imageUrl})` };

                  return (
                    <div 
                      key={post.id} 
                      className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full text-right"
                    >
                      <div 
                        className="h-44 w-full bg-cover bg-center relative flex flex-col justify-end p-5 text-white"
                        style={imageStyle}
                      >
                        {!isGradient && <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 transition-colors z-0" />}
                        <div className="relative z-10">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col justify-between flex-grow gap-5">
                        <div className="space-y-2">
                          <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">
                            {post.summary}
                          </p>
                        </div>
                        <div className="border-t pt-4">
                          <Link 
                            href={`/post/${post.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors"
                          >
                            <span>למאמר המלא</span>
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chavrusa Call-To-Action */}
          <div className="bg-[#1e293b] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl text-center md:text-right flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="absolute inset-0 bg-pattern opacity-5 bg-repeat bg-center" />
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-xs font-bold">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>לימוד בהתאמה אישית</span>
              </div>
              <h3 className="text-3xl font-black">רוצים ללמוד בחברותא?</h3>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                השעות של השיעורים לא מסתדרות לכם? מעוניינים להעמיק בנושא ספציפי שמעניין רק אתכם (גמרא, תניא, חסידות, הלכה)? אנו נשמח לתאם לכם לימוד אישי (חברותא) אחד-על-אחד עם הרב או הרבנית בזמן ובמקום שנוח לכם.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-secondary-foreground hover:bg-secondary/95 transition-colors rounded-2xl font-black text-base shadow-lg"
              >
                תיאום לימוד אישי
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
