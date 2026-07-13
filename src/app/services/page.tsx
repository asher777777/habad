import { getServicesLandingConfig } from "@/features/home/actions";
import { getGlobalSettings } from "@/features/settings/actions";
import { getAllServices } from "@/features/services/actions";
import { HomeClient } from "@/app/HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שירותי דת וקהילה - בית חב\"ד אזור",
  description: "מרכז שירותי הדת והקהילה של בית חב\"ד אזור. בדיקת מזוזות ותפילין, הכשרת מטבחים, שיעורי תורה, ערבי נשים, עזרה לנזקקים ואירוח לשבת באהבה ובמאור פנים.",
};

const IconMapNames: Record<string, string> = {
  "kitchen-koshering": "UtensilsCrossed",
  "mazoza": "DoorOpen",
  "tefillin-checking": "ScrollText",
  "torah-classes": "BookOpen",
  "womens-evenings": "Users",
  "shabbat-hosting": "Home",
  "coffee-chat": "Coffee",
  "aid-for-needy": "HeartHandshake",
};

export default async function ServicesPage() {
  const config = await getServicesLandingConfig();
  const globalSettings = await getGlobalSettings();
  
  // Fetch dynamic services
  const services = await getAllServices();
  const servicePages = services.filter(s => s.type === "service" || s.slug === "mazoza");

  const dynamicItems = servicePages.map(s => ({
    id: s.slug,
    title: s.hero?.title || s.title || "שירות",
    description: s.hero?.description || s.description || "",
    icon: IconMapNames[s.slug] || "Star",
    url: `/service/${s.slug}`,
    isVisible: true
  }));

  // Merge dynamic items with existing config items (to preserve order and visibility settings)
  const existingItems = config.services.items || [];
  
  // Map existing items to keep their properties but update with fresh data if needed,
  // or just trust the config if they manually edited the text.
  // To allow users to edit text in the editor, we should prioritize the config's text if it exists.
  const mergedItems = existingItems.map(existing => {
    const matchingDb = dynamicItems.find(d => d.id === existing.id);
    if (!matchingDb) return existing; // If it was removed from DB, it might be a custom item
    return {
      ...matchingDb,
      ...existing, // Overwrite with user's configured changes
      url: matchingDb.url // Always keep the real URL
    };
  });

  const newItems = dynamicItems.filter(d => !existingItems.find(e => e.id === d.id));
  
  config.services.items = [...mergedItems, ...newItems];

  return (
    <HomeClient 
      initialConfig={config} 
      initialGlobalSettings={globalSettings} 
      pageId="services-landing" 
      collectionName="pages" 
    />
  );
}
