"use server";

import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { getAiSettings } from "@/features/ai/actions";
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
    const docRef = adminDb.collection("services").doc(slug);
    await docRef.set({ ...content, updatedAt: new Date().toISOString() }, { merge: true });
    revalidatePath(`/service/${slug}`);
    revalidatePath(`/services/${slug}`);
    revalidatePath(`/landing/${slug}`);
    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (error) {
    console.warn(`Error saving service content for ${slug}:`, (error as Error).message);
    throw new Error("Failed to save to Firebase");
  }
}

export async function generatePageWithAI(prompt: string, slug: string, type: 'service' | 'landing' | 'post') {
  try {
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

    let systemPrompt = "";
    if (type === 'service') {
      systemPrompt = `You are a professional copywriter for a Chabad house website.
Your task is to generate the content for a new service page based on the user's prompt.
The response MUST be a valid JSON object matching exactly this structure:
{
  "seo": {
    "title": "SEO Title (50-60 chars)",
    "description": "SEO Description (150-160 chars)"
  },
  "hero": {
    "title": "Main Title (e.g. בדיקת מזוזות)",
    "subtitle": "Catchy Subtitle",
    "description": "2-3 sentences describing the service and its importance."
  },
  "features": [
    { "title": "Feature 1", "desc": "Short description", "iconName": "Star" },
    { "title": "Feature 2", "desc": "Short description", "iconName": "Heart" },
    { "title": "Feature 3", "desc": "Short description", "iconName": "Shield" },
    { "title": "Feature 4", "desc": "Short description", "iconName": "Zap" }
  ],
  "content": {
    "heading": "Why is this important?",
    "body": "Detailed paragraph about the service, why one should do it, and how Chabad helps. Use warm and welcoming tone."
  }
}
Choose iconNames from lucide-react standard names (e.g. Book, Calendar, ShieldCheck, Heart, Zap, Star, Users, Globe).
Return ONLY the JSON. No markdown, no comments.`;
    } else if (type === 'landing') {
      systemPrompt = `You are a professional conversion copywriter for a Chabad house website.
Your task is to generate the content for a conversion-focused landing page (e.g., event registration, holiday celebration, community project campaign) based on the user's prompt.
The response MUST be a valid JSON object matching exactly this structure:
{
  "seo": {
    "title": "SEO Title (50-60 chars)",
    "description": "SEO Description (150-160 chars)"
  },
  "hero": {
    "title": "High-conversion Heading (e.g., חוגגים יחד שבועות בקהילה!)",
    "subtitle": "Inspiring Subtitle urging action",
    "description": "Engaging description inviting the reader to participate, join, or support. Keep it warm and active."
  },
  "benefits": [
    { "title": "Benefit 1", "desc": "Why participate/what you gain", "iconName": "Gift" },
    { "title": "Benefit 2", "desc": "Event highlight or spiritual value", "iconName": "Calendar" },
    { "title": "Benefit 3", "desc": "Community impact/connection", "iconName": "Users" }
  ],
  "content": {
    "heading": "מתי ואיפה?",
    "body": "Detailed paragraph about the event or campaign: location, date, special guests, or schedule details. Use encouraging and warm language."
  },
  "testimonial": {
    "quote": "A warm and inspiring quote from a community member who attended a similar event or supported the project.",
    "author": "שם הממליץ (e.g., משה כהן)",
    "authorTitle": "חבר קהילה"
  },
  "cta": {
    "formTitle": "הבטח את מקומך / הצטרף אלינו",
    "buttonText": "להרשמה מהירה",
    "actionType": "lead_form",
    "suggestedDonations": [180, 360, 500]
  }
}
Choose iconNames from lucide-react standard names (e.g. Gift, Calendar, Users, MapPin, Star, Heart, Clock).
Return ONLY the JSON. No markdown, no comments.`;
    } else if (type === 'post') {
      systemPrompt = `You are a warm, welcoming Chabad Rabbi and community leader.
Your task is to write an engaging, inspiring, and beautiful Hebrew community post or update based on the user's prompt.
The tone must be friendly, supportive, and Jewishly rich (using warm expressions like "בס"ד", "שלום לכולם", "שבת שלום", etc. when appropriate).
The response MUST be a valid JSON object matching exactly this structure:
{
  "seo": {
    "title": "SEO Title (50-60 chars)",
    "description": "SEO Description (150-160 chars)"
  },
  "title": "A beautiful and catchy title in Hebrew",
  "summary": "A 1-2 sentence inviting summary/teaser of the post in Hebrew",
  "content": "The full detailed post content in Hebrew. You can use multiple paragraphs separated by \\n. Make it inspiring, friendly, and substantial (at least 3-4 paragraphs).",
  "category": "Choose exactly one category from: 'פרשת שבוע', 'חדשות הקהילה', 'הלכה יומית', 'חגים ומועדים', 'אירועים'",
  "tags": ["3-4 relevant Hebrew tags/keywords"],
  "imagePrompt": "A highly detailed, gorgeous, and specific English prompt for an image generator (like Imagen) to create a matching high-quality, photorealistic cover image for this post. Emphasize warm golden lighting and atmospheric details. Do not write text/letters inside the image."
}
Return ONLY the JSON. No markdown, no comments.`;
    }

    const result = await model.generateContent([systemPrompt, prompt]);
    const responseText = result.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim();
    
    const generatedData = JSON.parse(responseText);
    
    // Call AI Image Generator for all page types to generate a gorgeous cover image!
    let imageUrl = "/placeholder.png";
    let imagePrompt = "";
    if (type === 'post' && generatedData.imagePrompt) {
      imagePrompt = generatedData.imagePrompt;
    } else {
      const pageTitle = generatedData.hero?.title || generatedData.title || slug;
      imagePrompt = `Professional high quality warm photograph of ${pageTitle} for a Jewish Chabad house website, welcoming atmosphere, soft atmospheric lighting, photorealistic, 16:9 aspect ratio`;
    }

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

    if (type === 'post') {
      const { savePost } = await import("@/features/posts/actions");
      const postData = {
        id: slug,
        title: generatedData.title || generatedData.seo?.title || "פוסט חדש",
        summary: generatedData.summary || "",
        content: generatedData.content || "",
        category: generatedData.category || "חדשות הקהילה",
        tags: generatedData.tags || ["חב\"ד", "קהילה"],
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: imageUrl
      };
      await savePost(slug, postData);
      return { success: true, type: 'post', slug };
    } else {
      // For service or landing pages
      const pageContent = {
        type: type,
        theme: "navy",
        seo: generatedData.seo || { title: slug, description: "" },
        hero: {
          title: generatedData.hero?.title || slug,
          subtitle: generatedData.hero?.subtitle || "",
          description: generatedData.hero?.description || "",
          imageSrc: imageUrl,
          layout: "center"
        },
        features: generatedData.features || generatedData.benefits || [],
        content: generatedData.content || { heading: "", body: "", layout: "center" },
        testimonial: generatedData.testimonial || null,
        cta: generatedData.cta || null,
      };

      await saveServicePage(slug, pageContent);
      return { success: true, type, slug };
    }
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
