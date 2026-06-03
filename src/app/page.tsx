import { getHomePageConfig } from "@/features/home/actions";
import { getGlobalSettings } from "@/features/settings/actions";
import { HomeClient } from "./HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "בית חב\"ד",
  description: "הלב הפועם של הקהילה. מקום של חסד, לימוד וחיבור.",
};

export default async function Home() {
  const config = await getHomePageConfig();
  const globalSettings = await getGlobalSettings();

  return <HomeClient initialConfig={config} initialGlobalSettings={globalSettings} />;
}

