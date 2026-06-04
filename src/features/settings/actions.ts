"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export interface NavLink {
  name: string;
  href: string;
}

export interface GlobalSettings {
  siteLogoUrl: string;
  headerLayout: "classic" | "center" | "left";
  theme: "navy" | "emerald" | "rose" | "violet" | "charcoal";
  navLinks: NavLink[];
  contactPhone?: string;
  contactEmail?: string;
  contactFacebook?: string;
  contactAddress?: string;
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  siteLogoUrl: "", // Empty means use default Heart icon
  headerLayout: "classic",
  theme: "navy",
  navLinks: [
    { name: "בית", href: "/" },
    { name: "שירותי דת", href: "/services" },
    { name: "שיעורי תורה", href: "/lessons" },
    { name: "קהילה", href: "/community" },
    { name: "צור קשר", href: "/contact" },
  ],
  contactPhone: "0545947701",
  contactEmail: "chabadazor1@gmail.com",
  contactFacebook: "https://www.facebook.com/profile.php?id=100064735515777",
  contactAddress: "יצחק שדה 2, אזור",
};

export async function getGlobalSettings(): Promise<GlobalSettings> {
  try {
    const docRef = adminDb.collection("settings").doc("global");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        siteLogoUrl: data?.siteLogoUrl || "",
        headerLayout: data?.headerLayout || "classic",
        theme: data?.theme || "navy",
        navLinks: data?.navLinks || DEFAULT_GLOBAL_SETTINGS.navLinks,
        contactPhone: data?.contactPhone || DEFAULT_GLOBAL_SETTINGS.contactPhone,
        contactEmail: data?.contactEmail || DEFAULT_GLOBAL_SETTINGS.contactEmail,
        contactFacebook: data?.contactFacebook || DEFAULT_GLOBAL_SETTINGS.contactFacebook,
        contactAddress: data?.contactAddress || DEFAULT_GLOBAL_SETTINGS.contactAddress,
      } as GlobalSettings;
    }
    return DEFAULT_GLOBAL_SETTINGS;
  } catch (error) {
    console.warn(`Error fetching global settings:`, (error as Error).message);
    return DEFAULT_GLOBAL_SETTINGS;
  }
}

export async function saveGlobalSettings(settings: Partial<GlobalSettings>) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const docRef = adminDb.collection("settings").doc("global");
    await docRef.set({ ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.warn(`Error saving global settings:`, (error as Error).message);
    throw new Error("Failed to save to Firebase");
  }
}
