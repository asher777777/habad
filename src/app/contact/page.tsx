import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactSection } from "@/components/sections/ContactSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "צור קשר - בית חב\"ד אזור",
  description: "צרו קשר עם בית חב\"ד אזור לכל שאלה, עזרה, בדיקת תפילין ומזוזות, הרשמה לאירועים או ייעוץ אישי. אנו זמינים בטלפון, דוא\"ל או דרך טופס הפנייה באתר.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-20">
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
