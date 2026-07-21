"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

async function getUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {}
  return "1";
}

export async function updateRecordField(
  dataSource: "contacts" | "forms",
  recordId: string,
  field: string,
  value: any
) {
  try {
    const ownerId = await getUserId();
    
    if (dataSource === "contacts") {
      const docRef = adminDb.collection("contacts").doc(recordId);
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.ownerId !== ownerId) {
        throw new Error("Record not found or unauthorized");
      }
      await docRef.update({ [field]: value });
    } else {
      const docRef = adminDb.collection("form_submissions").doc(recordId);
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.ownerId !== ownerId) {
        throw new Error("Record not found or unauthorized");
      }
      
      // Determine if field is top-level or payload-level
      const topLevelFields = ["contactId", "ownerId", "formName", "formPage", "submissionDate", "isMigrated"];
      if (topLevelFields.includes(field)) {
        await docRef.update({ [field]: value });
      } else {
        await docRef.update({ [`payload.${field}`]: value });
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error updating record field:", error);
    return { success: false, error: error.message || String(error) };
  }
}
