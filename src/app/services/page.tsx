import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getAllServices } from "@/features/services/actions";
import Link from "next/link";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { 
  UtensilsCrossed, 
  DoorOpen, 
  ScrollText, 
  BookOpen, 
  Users, 
  Home, 
  Coffee, 
  HeartHandshake, 
  Star,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שירותי דת וקהילה - בית חב\"ד אזור",
  description: "מרכז שירותי הדת והקהילה של בית חב\"ד אזור. בדיקת מזוזות ותפילין, הכשרת מטבחים, שיעורי תורה, ערבי נשים, עזרה לנזקקים ואירוח לשבת באהבה ובמאור פנים.",
};

const IconMap: Record<string, any> = {
  "kitchen-koshering": UtensilsCrossed,
  "mazoza": DoorOpen,
  "tefillin-checking": ScrollText,
  "torah-classes": BookOpen,
  "womens-evenings": Users,
  "shabbat-hosting": Home,
  "coffee-chat": Coffee,
  "aid-for-needy": HeartHandshake,
};

export default async function ServicesPage() {
  const services = await getAllServices();
  
  // Filter only services (not landing pages or posts) and sort them to match the grid order if possible
  const servicePages = services.filter(s => s.type === "service" || s.slug === "mazoza");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-24">
        {/* Decorative background elements */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute left-0 top-1/3 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>שירותי דת וקהילה</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight">
              הנגשת המסורת <span className="text-primary">במאור פנים</span>
            </h1>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              בית חב"ד אזור שמח להעניק לכם מגוון רחב של שירותי דת, תמיכה קהילתית, שיעורים ומפגשים. כל השירותים מוגשים באהבה, ללא שיפוטיות ובגובה העיניים.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicePages.map((service) => {
              const Icon = IconMap[service.slug] || Star;
              return (
                <Link
                  key={service.slug}
                  href={`/service/${service.slug}`}
                  className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-2 flex flex-col justify-between h-full min-h-[320px] text-right"
                >
                  <div className="space-y-6">
                    {/* Icon Container */}
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-secondary/10 transition-colors duration-300">
                      <BrandIcon icon={Icon} size={36} />
                    </div>
                    
                    {/* Texts */}
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors duration-300">
                        {service.hero?.title || service.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                        {service.hero?.description || service.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* CTA link */}
                  <div className="pt-6 border-t border-slate-100/60 flex items-center gap-1.5 text-sm font-bold text-secondary">
                    <span>לפרטים נוספים ותיאום</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-300" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Banner */}
          <div className="bg-primary rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-xl text-center space-y-6">
            <div className="absolute inset-0 bg-pattern opacity-10 bg-repeat bg-center" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h3 className="text-3xl font-black">לא מצאתם את השירות שחיפשתם?</h3>
              <p className="text-white/80 leading-relaxed text-base">
                אנחנו כאן לכל עניין - גדול כקטן. נשמח לסייע לכם בכל בקשה, שאלה או צורך אישי או הלכתי שעולה. פנו אלינו ישירות ונשמח לעמוד לשירותכם.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-secondary-foreground hover:bg-secondary/95 transition-colors rounded-2xl font-black text-base shadow-lg"
                >
                  יצירת קשר מהירה
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
