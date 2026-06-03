import { getServicePage } from "@/features/services/actions";
import { ServicePageClient } from "./ServicePageClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const service = await getServicePage(resolvedParams.slug);
  
  if (!service) return { title: "Service Not Found" };
  
  return {
    title: service.seo?.title || service.hero?.title || "Service",
    description: service.seo?.description || service.hero?.description || "Service Description",
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const service = await getServicePage(resolvedParams.slug);
  
  if (!service) {
    notFound();
  }

  return <ServicePageClient initialData={service} slug={resolvedParams.slug} />;
}
