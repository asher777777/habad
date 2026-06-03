"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function getDonatePageContent() {
  try {
    const docRef = adminDb.collection("configs").doc("donate_page");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching donation content:", error);
    return null;
  }
}

export async function saveDonatePageContent(content: any) {
  try {
    // Strip non-serializable fields if any
    const docRef = adminDb.collection("configs").doc("donate_page");
    await docRef.set(content);
    return { success: true };
  } catch (error) {
    console.error("Error saving donation content:", error);
    throw new Error("Failed to save to Firebase");
  }
}
