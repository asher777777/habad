"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export interface SavedView {
  id?: string;
  name: string;
  ownerId: string;
  config: {
    dataSource: "contacts" | "forms";
    activeTabFilter: string | null;
    filterForm: string;
    selectedColumns: string[];
    sortConfig: { key: string; direction: "asc" | "desc" } | null;
    showSummaries: boolean;
    showRowNumbering: boolean;
    showRowCheckboxes: boolean;
    splitChildrenRows: boolean;
    columnDataFilters: Record<string, "all" | "has_data" | "no_data">;
  };
  createdAt: string;
}

async function getUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {}
  return "1";
}

export async function getSavedViews(): Promise<SavedView[]> {
  try {
    const ownerId = await getUserId();
    const snap = await adminDb.collection("saved_views").where("ownerId", "==", ownerId).get();
    const views = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedView));
    return views.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting saved views:", error);
    return [];
  }
}

export async function saveView(name: string, config: SavedView["config"]): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("saved_views").doc();
    const view: SavedView = {
      name,
      ownerId,
      config,
      createdAt: new Date().toISOString()
    };
    await docRef.set(view);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error saving view:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSavedView(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("saved_views").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.ownerId !== ownerId) {
      throw new Error("Not authorized");
    }
    await docRef.delete();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting view:", error);
    return { success: false, error: error.message };
  }
}
