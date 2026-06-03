import { getServicePage } from "@/features/services/actions";
import { LandingPageClient } from "./LandingPageClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await getServicePage(resolvedParams.slug);
  
  if (!page || page.type !== "landing") return { title: "דף נחיתה לא נמצא" };
  
  return {
    title: page.seo?.title || page.hero?.title || "דף נחיתה",
    description: page.seo?.description || page.hero?.description || "דף נחיתה שיווקי",
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await getServicePage(resolvedParams.slug);
  
  if (!page || page.type !== "landing") {
    notFound();
  }

  return <LandingPageClient initialData={page} slug={resolvedParams.slug} />;
}
