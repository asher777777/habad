import { getHomePageConfig } from "@/features/home/actions";
import { getGlobalSettings } from "@/features/settings/actions";
import { HomeClient } from "./HomeClient";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getHomePageConfig();
  
  const title = config.seo?.title || "בית חב\"ד אזור";
  const description = config.seo?.description || "בית חב\"ד אזור - הלב הפועם של הקהילה. מקום של חסד, לימוד וחיבור.";
  const image = config.seo?.image || "";
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    }
  };
}

export default async function Home() {
  const config = await getHomePageConfig();
  const globalSettings = await getGlobalSettings();

  return <HomeClient initialConfig={config} initialGlobalSettings={globalSettings} />;
}

