import { getAllServices } from "@/features/services/actions";
import { ServiceForm } from "./ServiceForm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Edit, Layout, Sparkles } from "lucide-react";

export default async function ServicesDashboardPage() {
  const services = await getAllServices();

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800">ניהול עמודים ודפי נחיתה (CMS)</h2>
          <p className="text-muted-foreground text-sm mt-1">נהל וערוך באופן דינמי את עמודי השירות ודפי הנחיתה המנוהלים בינה מלאכותית באתר.</p>
        </div>
      </div>

      <ServiceForm />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {services.map((service) => {
          const isLanding = service.type === "landing";
          const pagePath = isLanding ? `/landing/${service.slug}` : `/service/${service.slug}`;
          
          return (
            <div key={service.slug} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    isLanding 
                      ? "bg-purple-50 text-purple-600 border border-purple-100" 
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}>
                    {isLanding ? (
                      <>
                        <Sparkles className="w-3 h-3" />
                        דף נחיתה
                      </>
                    ) : (
                      <>
                        <Layout className="w-3 h-3" />
                        עמוד שירות
                      </>
                    )}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">
                  {service.hero?.title || service.slug}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {service.hero?.description || "ללא תיאור מוגדר לעמוד."}
                </p>
              </div>
              
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                  {isLanding ? `/landing/` : `/service/`}{service.slug}
                </span>
                <div className="flex gap-2">
                  <Link href={pagePath} target="_blank">
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl" title="צפה בעמוד הציבורי">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </Button>
                  </Link>
                  <Link href={pagePath}>
                    <Button variant="primary" size="sm" className="h-9 w-9 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700" title="ערוך תוכן בדף">
                      <Edit className="w-4 h-4 text-white" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-muted-foreground bg-white">
            <Layout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            עדיין לא נוצרו עמודי שירות או דפי נחיתה. השתמש במחולל ה-AI שלמעלה כדי להתחיל בקלות!
          </div>
        )}
      </div>
    </div>
  );
}
