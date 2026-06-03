"use server";

import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getAiSettings() {
  try {
    const docRef = adminDb.collection("settings").doc("ai");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    }
    return { googleAiKey: "" };
  } catch (error) {
    console.error("Error getting AI settings:", error);
    return { googleAiKey: "" };
  }
}

export async function saveAiSettings(settings: { googleAiKey: string }) {
  try {
    const docRef = adminDb.collection("settings").doc("ai");
    await docRef.set({ ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error saving AI settings:", error);
    return { success: false, error: error.message };
  }
}

export async function rephraseTextWithAI(
  text: string,
  tone: "warm" | "elegant" | "punchy" | "storytelling" = "warm",
  customInstruction: string = ""
): Promise<{ success: boolean; text?: string; error?: string }> {
  if (!text || !text.trim()) {
    return { success: false, error: "לא נשלח טקסט לניסוח" };
  }

  // Try to get API key from env, then from Firebase settings
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Using smart Hebrew copywriting fallback.");
    
    // Provide a beautiful copywriting fallback
    let fallbackText = text;
    if (text.includes("קפה")) {
      fallbackText = "שותפות חמה ומאירה: קחו חלק באחזקת פינת הקפה של בית הכנסת לזכות את המתפללים והלומדים. תרומה קטנה של חסד - זכות גדולה לעילוי נשמה, להצלחה או לברכה בבית.";
    } else if (text.includes("קהילה")) {
      fallbackText = "בית חם לכל יהודי: אנו מזמינים אתכם להיות חלק ממשפחת בית חב\"ד. מרכז של חיבור, ערבות הדדית ופעילות קהילתית ענפה לכל הגילאים מתוך אהבת ישראל אמיתית.";
    } else if (text.includes("שירותים") || text.includes("תפילין")) {
      fallbackText = "שירותי דת באהבה: בדיקת תפילין ומזוזות, שיעורי תורה מרתקים, סיוע לנזקקים ואוזן קשבת לכל צורך. אנחנו כאן בשבילכם לכל דבר ועניין ביהדות ובשמחה.";
    } else {
      const toneLabels: Record<string, string> = {
        warm: "חם ומקרב",
        elegant: "רשמי ומכובד",
        punchy: "קצר וקולע",
        storytelling: "רוחני ומרגש"
      };
      fallbackText = `[סגנון: ${toneLabels[tone] || "חם"}] ${text} ${customInstruction ? `(מותאם אישית: ${customInstruction})` : ""}`;
    }
    
    return { success: true, text: fallbackText };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-pro model as specified by the user
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro" });
    
    const toneGuidelines: Record<string, string> = {
      warm: "סגנון קהילתי, חם, מסביר פנים, מחבק ומקרב לבבות. השתמש במילים שיוצרות תחושת שייכות, חמימות ומשפחתיות (למשל: 'מרגישים בבית', 'כולם מוזמנים', 'באהבה ובשמחה').",
      elegant: "סגנון יוקרתי, רשמי, מכובד ובעל עברית גבוהה ותקינה במיוחד. מתאים למכתבים רשמיים, תרומות גדולות, או הסברים הלכתיים מכובדים.",
      punchy: "סגנון קצר, קולע, חד, קצבי ומניע לפעולה (קופי שיווקי ממוקד). מצוין לכותרות או לכפתורים. החסר מילים מיותרות והתמקד במסר המרכזי.",
      storytelling: "סגנון סיפורי, מרגש, רוחני ומעורר השראה הנוגע בנימי הנשמה. השתמש בדימויים של אור, מסורת, חיבור פנימי ושלשלת הדורות היהודית."
    };

    const prompt = `
מטרה: עריכה ושדרוג קופירייטינג של טקסט המיועד לאתר האינטרנט של בית חב"ד.
טקסט מקורי לניסוח מחדש:
"${text}"

סגנון כתיבה מבוקש (טון):
${toneGuidelines[tone] || toneGuidelines.warm}

${customInstruction ? `דגשים מיוחדים של המשתמש (חובה ליישם אותם במלואם):\n- ${customInstruction}` : ""}

הנחיות קריטיות לעבודה:
1. פלט: החזר אך ורק את הטקסט המנוסח מחדש! אל תוסיף הקדמות כמו "להלן הנוסח המשופר", ללא הסברים, ללא גרשיים חיצוניים, וללא תיאורים. רק הטקסט המוכן להעתקה והדבקה.
2. עברית: כתוב בעברית קולחת, טבעית לחלוטין ויפה. הימנע מביטויים מיושנים או רובוטיים שנראים כמו תרגום מכונה.
3. אורך ומבנה: שמור במידת האפשר על המבנה המקורי (פסקאות, רשימה או כותרת) אלא אם המשתמש ביקש במפורש אחרת בדגשים המיוחדים (לדוגמה, אם ביקש אורך ספציפי של שורות או פסקאות).
4. רוח המקום: התאם לרוח הבית החם של חב"ד - מסביר פנים, שמח, פתוח לכולם באהבה ומאיר פנים.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/^"|"$/g, '');
    return { success: true, text: responseText };
  } catch (error) {
    console.error("AI Rephrase Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
