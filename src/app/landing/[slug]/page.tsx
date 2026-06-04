import { getGlobalSettings } from "@/features/settings/actions";
import { getPageConfig } from "@/features/home/actions";
import { HomeClient } from "@/app/HomeClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageViewTracker } from "@/components/ui/PageViewTracker";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await getPageConfig("landing", resolvedParams.slug);
  
  if (!page) return { title: "דף נחיתה לא נמצא" };
  
  return {
    title: page.seo?.title || page.hero?.title || "דף נחיתה",
    description: page.seo?.description || page.hero?.description || "דף נחיתה שיווקי",
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await getPageConfig("landing", resolvedParams.slug);
  const globalSettings = await getGlobalSettings();
  
  if (!page) {
    notFound();
  }

  return (
    <>
      <PageViewTracker slug={resolvedParams.slug} />
      <HomeClient initialConfig={page} initialGlobalSettings={globalSettings} collectionName="landing" pageId={resolvedParams.slug} />
    </>
  );
}
