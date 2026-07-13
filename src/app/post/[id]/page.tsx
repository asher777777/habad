import { getGlobalSettings } from "@/features/settings/actions";
import { getPageConfig } from "@/features/home/actions";
import { HomeClient } from "@/app/HomeClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await getPageConfig("posts", resolvedParams.id);
  
  if (!page) return { title: "פוסט לא נמצא" };
  
  const title = page.seo?.title || page.hero?.title || "פוסט בבלוג";
  const description = page.seo?.description || page.hero?.description || "קראו את הפוסט בבלוג";
  const image = page.seo?.image || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
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

export default async function PublicPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const page = await getPageConfig("posts", resolvedParams.id);
  const globalSettings = await getGlobalSettings();
  
  if (!page) {
    notFound();
  }

  return <HomeClient initialConfig={page} initialGlobalSettings={globalSettings} collectionName="posts" pageId={resolvedParams.id} />;
}
