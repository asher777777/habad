import { getShabbatTimes } from "@/features/shabbat/actions";
import { ShabbatClient } from "./ShabbatClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "זמני שבת ותפילה - בית חב\"ד אזור",
  description: "זמני כניסת ויציאת שבת, זמני תפילות בבית חב\"ד אזור ודבר תורה חסידי שבועי לפרשת השבוע. מעודכן לפי לוח חב\"ד אזור זמן תל אביב.",
};

export default async function ShabbatPage() {
  const shabbatData = await getShabbatTimes();
  
  return <ShabbatClient initialData={shabbatData} />;
}
