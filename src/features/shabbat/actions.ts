"use server";

import { adminDb } from "@/lib/firebase-admin";

export interface ShabbatTimesData {
  candleLighting: string;
  havdalah: string;
  parashaHebrew: string;
  parashaEnglish: string;
  dvarTorah: string;
  prayerTimes: {
    minchaErevShabbat: string;
    shacharitShabbat: string;
    minchaShabbat: string;
    arvitMotzeiShabbat: string;
  };
  updatedAt: string;
}

export async function getShabbatTimes(): Promise<ShabbatTimesData | null> {
  try {
    const docRef = adminDb.collection("configs").doc("shabbat");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return docSnap.data() as ShabbatTimesData;
    }
    return null;
  } catch (error) {
    console.warn("Error fetching Shabbat times:", (error as Error).message);
    return null;
  }
}

export async function saveShabbatTimes(data: ShabbatTimesData) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const docRef = adminDb.collection("configs").doc("shabbat");
    await docRef.set(data);
    return { success: true };
  } catch (error) {
    console.error("Error saving Shabbat times:", error);
    return { success: false, error: (error as Error).message };
  }
}
