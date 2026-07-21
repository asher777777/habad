"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getCustomFields } from "@/features/crm/actions";
import { Contact } from "./types";

async function getUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {}
  return "1";
}

export async function getCRMAnalytics(params: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const ownerId = await getUserId();
    const contactsRef = adminDb.collection("contacts");
    
    // We only want active contacts
    let query: any = contactsRef
      .where("ownerId", "==", ownerId)
      .where("status", "==", "active");
      
    // Firestore range queries on createdAt/updatedAt can be tricky if we also filter by ownerId and status without a composite index. 
    // Usually it's better to fetch all and filter in memory if the dataset is small to medium.
    
    const snapshot = await query.get();
    let contacts: Contact[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by date range
    if (params.startDate || params.endDate) {
      contacts = contacts.filter((c) => {
        const dStr = c.createdAt || c.updatedAt;
        if (!dStr) return true; // Include if no date
        const date = new Date(dStr);
        if (params.startDate && new Date(params.startDate) > date) return false;
        // Need to add 1 day to endDate to include the whole end date
        if (params.endDate) {
          const end = new Date(params.endDate);
          end.setHours(23, 59, 59, 999);
          if (end < date) return false;
        }
        return true;
      });
    }

    // Initialize aggregations
    let totalContacts = contacts.length;
    let totalSpent = 0;
    
    const tagsCount: Record<string, number> = {};
    const leadSourcesCount: Record<string, number> = {};
    const formsCount: Record<string, number> = {};
    
    const numericFieldsAgg: Record<string, { 
      sum: number; 
      count: number; 
      entries: Array<{
        contactId: string;
        parentName: string;
        phone: string;
        childName?: string;
        totalSpent: number;
        hasPaid: boolean;
        value: number;
      }>;
    }> = {};
    const textFieldsAgg: Record<string, Record<string, number>> = {};

    contacts.forEach(c => {
      // Basic sums
      totalSpent += (c.total_spent || 0);

      // Tags
      [c.tg1, c.tg2, c.tg3].forEach(t => {
        if (t && t.trim()) {
          tagsCount[t] = (tagsCount[t] || 0) + 1;
        }
      });

      // Lead Source / Arrival
      if (c.lead_source && c.lead_source.trim()) {
        leadSourcesCount[c.lead_source] = (leadSourcesCount[c.lead_source] || 0) + 1;
      }
      if (c.mh_crm_city && c.mh_crm_city.trim()) {
        const cityKey = `עיר: ${c.mh_crm_city}`;
        leadSourcesCount[cityKey] = (leadSourcesCount[cityKey] || 0) + 1;
      }

      // Forms
      if (c.last_form_name && c.last_form_name.trim()) {
        formsCount[c.last_form_name] = (formsCount[c.last_form_name] || 0) + 1;
      }
      if (c.form_submissions && Array.isArray(c.form_submissions)) {
        c.form_submissions.forEach(fs => {
          if (fs.name) {
            formsCount[fs.name] = (formsCount[fs.name] || 0) + 1;
          }
        });
      }

      // Children counting
      if (c.children && Array.isArray(c.children) && c.children.length > 0) {
        if (!numericFieldsAgg["סה״כ ילדים"]) numericFieldsAgg["סה״כ ילדים"] = { sum: 0, count: 0, entries: [] };
        numericFieldsAgg["סה״כ ילדים"].sum += c.children.length;
        numericFieldsAgg["סה״כ ילדים"].count += 1;
        
        c.children.forEach(child => {
          numericFieldsAgg["סה״כ ילדים"].entries.push({
            contactId: c.id || "",
            parentName: `${c.conta_name} ${c.f_m || ""}`.trim(),
            phone: c.conta_phone || "",
            childName: `${child.first_name || ""} ${child.last_name || ""}`.trim(),
            totalSpent: c.total_spent || 0,
            hasPaid: (c.total_spent || 0) > 0,
            value: 1
          });
        });
      }

      // Dynamic custom fields iteration
      const knownKeys = new Set([
        "id", "ownerId", "status", "conta_name", "f_m", "conta_phone", "email", "gender",
        "mh_crm_city", "mh_crm_street", "tg1", "tg2", "tg3", "company_name", "job_title",
        "lead_source", "work_phone", "website", "birth_date", "notes", "events", "form_submissions",
        "last_form_name", "last_form_page", "last_form_submission_date", "last_message_read_status",
        "total_spent", "order_count", "last_order_date", "children", "child_first_name", "child_last_name",
        "child_grade", "child_id_number", "allergies_has", "allergies_details", "father_name", "mother_name",
        "father_phone", "mother_phone", "createdAt", "updatedAt"
      ]);

      Object.entries(c).forEach(([key, val]) => {
        if (knownKeys.has(key)) return;
        if (val === null || val === undefined || val === "") return;

        const numVal = Number(val);
        if (!isNaN(numVal) && typeof val !== "boolean" && String(val).trim() !== "") {
          if (!numericFieldsAgg[key]) numericFieldsAgg[key] = { sum: 0, count: 0, entries: [] };
          numericFieldsAgg[key].sum += numVal;
          numericFieldsAgg[key].count += 1;
          numericFieldsAgg[key].entries.push({
            contactId: c.id || "",
            parentName: `${c.conta_name} ${c.f_m || ""}`.trim(),
            phone: c.conta_phone || "",
            totalSpent: c.total_spent || 0,
            hasPaid: (c.total_spent || 0) > 0,
            value: numVal
          });
        } else if (typeof val === "string") {
          if (!textFieldsAgg[key]) textFieldsAgg[key] = {};
          textFieldsAgg[key][val] = (textFieldsAgg[key][val] || 0) + 1;
        }
      });
    });

    const customFields = await getCustomFields();

    return {
      totalContacts,
      totalSpent,
      tagsCount,
      leadSourcesCount,
      formsCount,
      numericFieldsAgg,
      textFieldsAgg,
      contacts, // Added so client can build a dynamic table
      customFields
    };

  } catch (error: any) {
    console.error("Error in getCRMAnalytics server action:", error);
    return {
      error: error.message || String(error)
    };
  }
}

export async function getFormSubmissionsAnalytics(params: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const ownerId = await getUserId();
    const formsRef = adminDb.collection("form_submissions");
    
    let query: any = formsRef.where("ownerId", "==", ownerId);
      
    const snapshot = await query.get();
    let submissions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by date range
    if (params.startDate || params.endDate) {
      submissions = submissions.filter((s: any) => {
        const dStr = s.submissionDate;
        if (!dStr) return true;
        const date = new Date(dStr);
        if (params.startDate && new Date(params.startDate) > date) return false;
        if (params.endDate) {
          const end = new Date(params.endDate);
          end.setHours(23, 59, 59, 999);
          if (end < date) return false;
        }
        return true;
      });
    }

    // Flatten payload into top-level properties so the table can render them natively
    const flattenedSubmissions = submissions.map((s: any) => {
      const { payload, ...rest } = s;
      return {
        ...rest,
        ...(payload || {})
      };
    });

    const safeSubmissions = JSON.parse(JSON.stringify(flattenedSubmissions));

    return {
      totalSubmissions: safeSubmissions.length,
      formsCount: safeSubmissions.reduce((acc: Record<string, number>, s: any) => {
        const formName = s.formName || "לא ידוע";
        acc[formName] = (acc[formName] || 0) + 1;
        return acc;
      }, {}),
      submissions: safeSubmissions,
    };

  } catch (error: any) {
    console.error("Error in getFormSubmissionsAnalytics server action:", error);
    return {
      error: error.message || String(error)
    };
  }
}
