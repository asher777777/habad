"use server";

import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { getAiSettings } from "@/features/ai/actions";
import { auth } from "@/lib/auth";
import { addMediaToLibrary } from "@/features/media/actions";


export async function getServicePage(slug: string) {
  try {
    const docRef = adminDb.collection("services").doc(slug);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return { slug: docSnap.id, ...docSnap.data() } as any;
    }
    return null;
  } catch (error) {
    console.warn(`Error fetching service content for ${slug}:`, (error as Error).message);
    return null;
  }
}

export async function getAllServices() {
  try {
    const snapshot = await adminDb.collection("services").get();
    return snapshot.docs.map(doc => ({
      slug: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error) {
    console.warn("Error fetching all services:", (error as Error).message);
    return [];
  }
}

export async function saveServicePage(slug: string, content: any) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    
    const cleanContent = JSON.parse(JSON.stringify(content));
    const docRef = adminDb.collection("services").doc(slug);
    await docRef.set({ ...cleanContent, updatedAt: new Date().toISOString() }, { merge: true });
    revalidatePath(`/service/${slug}`);
    revalidatePath(`/services/${slug}`);
    revalidatePath(`/landing/${slug}`);
    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (error: any) {
    console.error(`Error saving service content for ${slug}:`, error);
    throw new Error(error.message || "Failed to save to Firebase");
  }
}

export async function incrementPageView(slug: string) {
  try {
    const serviceRef = adminDb.collection("services").doc(slug);
    await serviceRef.set({
      views: FieldValue.increment(1)
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error(`Error incrementing views for ${slug}:`, error);
    return { success: false };
  }
}

export async function deleteServicePage(slug: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    
    await adminDb.collection("services").doc(slug).delete();
    revalidatePath(`/dashboard/services`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting service content for ${slug}:`, error);
    throw new Error(error.message || "Failed to delete from Firebase");
  }
}

export async function generatePageWithAI(prompt: string, slug: string, type: 'service' | 'landing' | 'post', tone: string = 'רגיל', audience: string = 'כולם') {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Try to get API key from env, then from Firebase settings
    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const aiSettings = await getAiSettings();
      apiKey = aiSettings?.googleAiKey || "";
    }
    
    if (!apiKey) {
      throw new Error("מפתח API של Google AI לא הוגדר. אנא הגדר אותו בדף ההגדרות בלוח הבקרה או בקובץ ה-env.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    let systemPrompt = `You are an expert Jewish/Chabad copywriter and web designer.
Task: Generate the JSON content for a new page based on the user's prompt.
Target Audience: ${audience}
Tone of Voice: ${tone}
Page Type: ${type}

CRITICAL RULES FOR REGIONS & LAYOUTS BASED ON PAGE TYPE:
1. "service" page:
   - hero: layout "spatial" or "fz". Include main title, short desc, primaryButton linking to "#contact".
   - richContent: visible=true, layout "two-column". Detailed explanation.
   - services: visible=true, layout "grid". Features/stages of the service.
   - contact: visible=true. Includes a custom FormConfig tailored to the service.
   - Hidden (visible=false): landingSection, community, livePosts, mainContent.
2. "landing" page:
   - hero: layout "progressive". High conversion title (AIDA model). No buttons.
   - mainContent: visible=true, layout "bento". Core benefits.
   - community: visible=true, layout "centered". Social proof/testimonial.
   - landingSection: visible=true, layout "split-left", formMode "visible". The main form (FormConfig).
   - Hidden (visible=false): contact, services, richContent, livePosts.
3. "post" page:
   - hero: layout "thumb". Article title and subtitle.
   - richContent: visible=true, layout "center". The main article body in HTML.
   - livePosts: visible=true, layout "grid".
   - contact: visible=true. Simple newsletter/whatsapp form.
   - Hidden (visible=false): landingSection, services, community, mainContent.

SECTION ORDER RULE (CRITICAL):
You MUST provide a "sectionOrder" array containing exactly these section keys: "hero", "mainContent", "services", "community", "livePosts", "contact", "landingSection", "richContent".
You MUST order this array so that ALL sections with visible=true appear first, and ALL sections with visible=false appear AT THE VERY BOTTOM of the array.

FORM CONFIG RULE:
For sections with forms (contact or landingSection) that are visible, provide a custom "form" object. Set submit_button_text, submit_button_bg_color, and fields (label, type, map_to, required).

JSON Structure:
{
  "seo": { "title": "SEO Title", "description": "SEO Description" },
  "hero": { "title": "...", "subtitle": "...", "description": "...", "layout": "...", "buttonsVisible": true, "primaryButton": { "text": "...", "link": "..." } },
  "mainContent": { "visible": true, "title": "...", "description": "...", "layout": "..." },
  "services": { "visible": true, "title": "...", "layout": "...", "items": [{"id":"1", "title":"...", "description":"...", "icon":"Star", "url":"#", "isVisible":true}] },
  "community": { "visible": true, "title": "...", "description": "...", "quote": "...", "layout": "...", "badgeVisible": false, "buttonVisible": false },
  "livePosts": { "visible": true, "layout": "grid" },
  "contact": { "visible": true, "title": "...", "form": { "enabled": true, "submit_button_text": "שלח", "fields": [...] } },
  "landingSection": { "visible": true, "title": "...", "description": "...", "layout": "split-left", "formMode": "visible", "form": { "enabled": true, "submit_button_text": "הירשם", "fields": [...] } },
  "richContent": { "visible": true, "heading": "...", "body": "<p>...</p>", "layout": "center" },
  "sectionOrder": ["hero", "richContent", "services", "contact", "mainContent", "community", "landingSection", "livePosts"],
  "imagePrompt": "English prompt for cover image."
}
Return ONLY the JSON. No markdown, no comments.`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const responseText = result.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim();
    
    const generatedData = JSON.parse(responseText);
    
    let imageUrl = "/placeholder.png";
    let imagePrompt = generatedData.imagePrompt || `Professional high quality warm photograph of ${generatedData.hero?.title || slug} for a Jewish Chabad house website, welcoming atmosphere, soft atmospheric lighting, photorealistic, 16:9 aspect ratio`;

    if (imagePrompt) {
      try {
        const imageResult = await generateHeroImageWithAI(imagePrompt);
        if (imageResult.success && imageResult.url) {
          imageUrl = imageResult.url;
        }
      } catch (err) {
        console.warn("Failed to generate custom image, falling back to placeholder.", err);
      }
    }

    if (generatedData.hero) {
      generatedData.hero.imageSrc = imageUrl;
    }

    const collectionMap = {
      'service': 'services',
      'landing': 'landing',
      'post': 'posts'
    };
    
    const collectionName = collectionMap[type] || 'pages';

    const { savePageConfig } = await import("@/features/home/actions");
    await savePageConfig(collectionName, slug, generatedData);
    
    return { success: true, type, slug };
  } catch (error: any) {
    console.warn("AI Page Generation failed:", error.message);
    return { success: false, error: error.message };
  }
}

export async function generateServiceWithAI(prompt: string, slug: string) {
  return generatePageWithAI(prompt, slug, 'service');
}

export async function generateHeroImageWithAI(prompt: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const aiSettings = await getAiSettings();
      apiKey = aiSettings?.googleAiKey || "";
    }
    
    if (!apiKey) {
      throw new Error("מפתח API של Google AI לא הוגדר. אנא הגדר אותו בדף ההגדרות בלוח הבקרה.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            outputMimeType: "image/jpeg",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      throw new Error(`שגיאה ממחולל התמונות של גוגל: ${errorMsg}`);
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      throw new Error("לא התקבלה תמונה תקינה מהשרת.");
    }

    // Save to firebase admin storage
    const bucket = adminStorage.bucket();
    const fileName = `generated_${Date.now()}.jpg`;
    const file = bucket.file(`media/${fileName}`);
    const buffer = Buffer.from(base64Image, "base64");

    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    // Get signed URL with long expiration (essentially a permanent public download link)
    const urls = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // far-future date
    });
    const imageUrl = urls[0];

    // Add to the media library so it is visible in the gallery
    await addMediaToLibrary(imageUrl, `AI Hero: ${prompt.slice(0, 30)}`);

    return { success: true, url: imageUrl };
  } catch (error: any) {
    console.error("Image generation action failed:", error);
    return { success: false, error: error.message || "שגיאה לא ידועה" };
  }
}
