import { Metadata } from "next";
import { getServicePage } from "@/features/services/actions";
import { CampRegistrationClient } from "./CampRegistrationClient";

export const metadata: Metadata = {
  title: "קייטנת חב״ד אזור - קיץ תשס״ו",
  description: "הרשמה לקייטנת חב״ד אזור, מסורת של חוויה! קיץ תשס״ו (2026).",
};

const defaultContent = {
  theme: "sky",
  seo: { title: "קייטנת חב״ד אזור - קיץ תשס״ו", description: "הרשמה לקייטנת חב״ד אזור, מסורת של חוויה! קיץ תשס״ו (2026)." },
  hero: {
    title: "קייטנת חב\"ד אזור",
    subtitle: "בית חב\"ד אזור | קיץ תשס\"ו",
    highlight: "מסורת של חוויה!",
    description: "גם השנה ילדי אזור נהנים מהקייטנה הכי חווייתית, מעשירה ובטוחה."
  },
  features: [
    { title: "3 טיולים חווייתיים", desc: "במהלך הקייטנה נצא לשלושה טיולים אטרקטיביים ברחבי הארץ באוטובוסים ממוזגים.", icon: "🚌", color: "sky" },
    { title: "ארוחות בוקר עשירות", desc: "כל יום נפתח בארוחת בוקר טעימה ומזינה, כריכים ושתייה כדי לתת כוח לכל הפעילויות.", icon: "🍔", color: "orange" },
    { title: "כולל ימי שישי", desc: "הקייטנה שלנו פועלת גם בימי שישי! שקט נפשי להורים והמשך חוויה רציפה לילדים.", icon: "📅", color: "green" }
  ],
  info: {
    dates: "ז' אב - כ\"ד אב",
    datesDesc: "22/07 עד 07/08",
    hours: "07:45 - 13:00",
    hoursDesc: "צהרון עד 16:00 בתוספת תשלום"
  }
};

import { auth } from "@/lib/auth";

export default async function CampRegistrationPage() {
  const data = await getServicePage("camp-registration");
  const initialData = data || defaultContent;
  const session = await auth();
  const isAdmin = !!session?.user;

  return <CampRegistrationClient initialData={initialData} isAdmin={isAdmin} />;
}
