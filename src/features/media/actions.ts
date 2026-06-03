"use server";

import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function getMediaLibrary() {
  try {
    const snapshot = await adminDb.collection("media").orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      url: doc.data().url,
      name: doc.data().name,
      description: doc.data().description || "",
      alt: doc.data().alt || "",
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.warn("Error fetching media library:", (error as Error).message);
    return [];
  }
}

export async function addMediaToLibrary(url: string, name: string, description = "", alt = "") {
  try {
    await adminDb.collection("media").add({
      url,
      name,
      description,
      alt,
      createdAt: new Date(),
    });
    revalidatePath("/donate");
    return { success: true };
  } catch (error) {
    console.warn("Error adding to media library:", (error as Error).message);
    return { error: "Failed to update library" };
  }
}

function getStoragePathFromUrl(url: string): string | null {
  try {
    if (!url.includes("firebasestorage.googleapis.com")) return null;
    const parts = url.split("/o/");
    if (parts.length < 2) return null;
    const pathWithToken = parts[1];
    const encodedPath = pathWithToken.split("?")[0];
    return decodeURIComponent(encodedPath);
  } catch (e) {
    return null;
  }
}

export async function deleteMediaItem(id: string) {
  try {
    const docRef = adminDb.collection("media").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return { error: "Media not found" };
    }
    const url = doc.data()?.url;
    if (url) {
      const storagePath = getStoragePathFromUrl(url);
      if (storagePath) {
        try {
          await adminStorage.bucket().file(storagePath).delete();
        } catch (e) {
          console.warn("Storage file deletion failed or file did not exist:", e);
        }
      }
    }
    await docRef.delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting media item:", error);
    return { error: (error as Error).message };
  }
}

export async function updateMediaMetadata(id: string, description: string, alt: string) {
  try {
    await adminDb.collection("media").doc(id).update({
      description,
      alt,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating media metadata:", error);
    return { error: (error as Error).message };
  }
}

export async function updateMediaFile(id: string, url: string, name: string) {
  try {
    await adminDb.collection("media").doc(id).update({
      url,
      name,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating media file:", error);
    return { error: (error as Error).message };
  }
}

export async function fetchImageAsBase64(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch image");
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return { base64, contentType };
  } catch (error) {
    console.error("Error fetching image as base64:", error);
    return { error: (error as Error).message };
  }
}

export async function getMediaFileMetadata(url: string) {
  try {
    const storagePath = getStoragePathFromUrl(url);
    if (!storagePath) return { error: "Invalid storage URL" };
    const [metadata] = await adminStorage.bucket().file(storagePath).getMetadata();
    const size = typeof metadata.size === "string" ? parseInt(metadata.size, 10) : (typeof metadata.size === "number" ? metadata.size : 0);
    return {
      size,
      contentType: metadata.contentType
    };
  } catch (error) {
    console.error("Error getting file metadata:", error);
    return { error: (error as Error).message };
  }
}
