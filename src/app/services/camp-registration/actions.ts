"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function registerCampLead(data: any) {
  try {
    const contactsRef = adminDb.collection("contacts");
    const ownerId = "1"; // Defaulting to 1 for this use case (or get from session if needed)

    // Using mother as the primary identifier, fallback to father
    const phone = data.mother_phone || data.father_phone;
    
    if (!phone) {
      throw new Error("חובה להזין לפחות מספר טלפון אחד (אם או אב)");
    }

    // Try finding existing contact
    let existingDocId = "";
    const phoneSnap = await contactsRef
      .where("ownerId", "==", ownerId)
      .where("conta_phone", "==", phone)
      .limit(1)
      .get();

    if (!phoneSnap.empty) {
      existingDocId = phoneSnap.docs[0].id;
    }

    const contactName = data.mother_name || data.father_name || `${data.child_first_name} ${data.child_last_name} (הורה)`;

    const dbData: any = {
      ownerId,
      status: "active",
      conta_name: contactName,
      conta_phone: phone,
      child_first_name: data.child_first_name,
      child_last_name: data.child_last_name,
      child_grade: data.child_grade,
      child_id_number: data.child_id_number,
      allergies_has: data.allergies_has,
      allergies_details: data.allergies_details,
      father_name: data.father_name,
      mother_name: data.mother_name,
      father_phone: data.father_phone,
      mother_phone: data.mother_phone,
      gender: data.gender || "",
      tg1: "קייטנה_תשסו",
      tg2: "ממתין לתשלום קייטנה",
      updatedAt: new Date().toISOString(),
    };

    const newEvent = {
      time: new Date().toISOString(),
      title: "רישום לקייטנה",
      text: "התקבל טופס רישום. ממתין לתשלום.",
    };

    if (existingDocId) {
      const doc = phoneSnap.docs[0];
      const existingData = doc.data();
      const updatedEvents = [...(existingData?.events || []), newEvent];
      await contactsRef.doc(existingDocId).update({
        ...dbData,
        events: updatedEvents,
      });
      return { success: true, contactId: existingDocId };
    } else {
      const docRef = await contactsRef.add({
        ...dbData,
        createdAt: new Date().toISOString(),
        events: [newEvent],
      });
      return { success: true, contactId: docRef.id };
    }
  } catch (error: any) {
    console.error("Error in registerCampLead:", error);
    return { success: false, error: error.message };
  }
}

export async function markCampPaymentSuccess(contactId: string, amount: number) {
  try {
    const contactsRef = adminDb.collection("contacts");
    const docRef = contactsRef.doc(contactId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("איש הקשר לא נמצא");
    }

    const existingData = docSnap.data();
    const newEvent = {
      time: new Date().toISOString(),
      title: "תשלום קייטנה התקבל",
      text: `התקבל תשלום בהצלחה על סך ${amount} ש"ח`,
    };

    const updatedEvents = [...(existingData?.events || []), newEvent];

    await docRef.update({
      tg2: "שולם קייטנה",
      updatedAt: new Date().toISOString(),
      events: updatedEvents,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in markCampPaymentSuccess:", error);
    return { success: false, error: error.message };
  }
}
