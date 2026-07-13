import { getGlobalSettings } from "@/features/settings/actions";
import { getPageConfig } from "@/features/home/actions";
import { HomeClient } from "@/app/HomeClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageViewTracker } from "@/components/ui/PageViewTracker";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const service = await getPageConfig("services", resolvedParams.slug);
  
  if (!service) return { title: "Service Not Found" };
  
  const title = service.seo?.title || service.hero?.title || "Service";
  const description = service.seo?.description || service.hero?.description || "Service Description";
  const image = service.seo?.image || "";

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

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const service = await getPageConfig("services", resolvedParams.slug);
  const globalSettings = await getGlobalSettings();
  
  if (!service) {
    notFound();
  }

  return (
    <>
      <PageViewTracker slug={resolvedParams.slug} />
      <HomeClient initialConfig={service} initialGlobalSettings={globalSettings} collectionName="services" pageId={resolvedParams.slug} />
    </>
  );
}
