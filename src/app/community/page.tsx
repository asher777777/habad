import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getAllPosts } from "@/features/posts/actions";
import Link from "next/link";
import { 
  Users, 
  ArrowLeft, 
  Award, 
  MessageCircle, 
  Gift
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "קהילה וחדשות - בית חב\"ד אזור",
  description: "הבית החם של הקהילה היהודית באזור. גלו את הפעילויות החברתיות, אירועי החגים, הכירו את השלוחים (הרב והרבנית), קראו עדכונים שוטפים והצטרפו להתנדבות ועשייה.",
};

export default async function CommunityPage() {
  const posts = await getAllPosts();
  const communityPosts = posts.filter(
    (p) => p.published && (p.category === "חדשות הקהילה" || p.category === "אירועים" || p.category === "חגים ומועדים")
  ).slice(0, 3); // Top 3 community posts

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-24">
        {/* Decorative ambient lighting */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute left-0 bottom-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 space-y-24 relative z-10">
          
          {/* Hero Segment */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Users className="w-3.5 h-3.5 text-secondary" />
              <span>המשפחה שלנו באזור</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight">
              קהילה תומכת <span className="text-primary">ומחברת</span>
            </h1>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              בית חב"ד אזור הוא הלב הפועם של הקהילה. אנו פועלים יום-יום כדי לחבר בין לבבות, להושיט יד תומכת, ולחגוג יחד את יופייה של המסורת היהודית.
            </p>
          </div>

          {/* Shluchim Section (Meet the family) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-100/40">
            {/* Portrait Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-2xl bg-slate-100">
                <img 
                  src="/images/shaliach-family.png" 
                  alt="משפחת גולדשטיין - השלוחים באזור" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 right-6 text-white text-right">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">שלוחי הרבי באזור</p>
                  <h3 className="text-xl font-black">משפחת גולדשטיין</h3>
                </div>
              </div>
            </div>

            {/* Description Column */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-800">הכירו את השלוחים שלכם</h2>
                <div className="w-16 h-1 bg-secondary rounded-full" />
              </div>
              
              <p className="text-slate-600 text-base leading-relaxed">
                הרב שלמה והרבנית שירה גולדשטיין, יחד עם ילדיהם, הגיעו לאזור מתוך שליחות ואהבה גדולה, במטרה להקים בית יהודי חם הפתוח לרווחת כל תושבי המקום.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                "החזון שלנו הוא שכל יהודי באזור, ללא קשר לרקע או להגדרות דתיות, ירגיש בבית חב"ד כמו בבית שלו. אנחנו כאן בשבילכם לכל דבר - החל מסיוע בענייני דת ומסורת, דרך ייעוץ והקשבה רגשית, ועד לעזרה גשמית ופיזית למי שזקוק. הדלת והלב שלנו פתוחים בפניכם 24 שעות ביממה."
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
                  <Award className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">הרב שלמה גולדשטיין</h4>
                    <p className="text-xs text-slate-500">שיעורים, בדיקות סת"ם וייעוץ</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
                  <MessageCircle className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">הרבנית שירה גולדשטיין</h4>
                    <p className="text-xs text-slate-500">פעילות נשים, הדרכה וליווי</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community Updates / Blog Grid */}
          {communityPosts.length > 0 && (
            <div className="space-y-8">
              <div className="text-right space-y-2">
                <h2 className="text-3xl font-black text-slate-800">עדכונים ואירועים אחרונים</h2>
                <p className="text-slate-500 text-sm">כל מה שקורה בקהילה שלנו באזור</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {communityPosts.map((post) => {
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
                        <div className="relative z-10 flex items-center justify-between w-full">
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
                            <span>לכתבה המלאה</span>
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

          {/* Volunteering CTA */}
          <div className="bg-[#0f172a] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl text-center md:text-right flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="absolute inset-0 bg-pattern opacity-5 bg-repeat bg-center" />
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-xs font-bold">
                <Gift className="w-3.5 h-3.5" />
                <span>ערבות הדדית בעשייה</span>
              </div>
              <h3 className="text-3xl font-black">רוצים להצטרף לעשייה שלנו?</h3>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                הכוח של בית חב"ד נובע מהמתנדבים הנפלאים שלנו. בין אם זה אריזת סלי מזון לנזקקים, סיוע לקשישים, עזרה בארגון אירועי החגים או ליווי ילדים - הזמן והלב שלכם יכולים לעשות הבדל ענק בחייה של משפחה באזור. הצטרפו אלינו עוד היום!
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-secondary-foreground hover:bg-secondary/95 transition-colors rounded-2xl font-black text-base shadow-lg"
              >
                הצטרפו כמתנדבים
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
