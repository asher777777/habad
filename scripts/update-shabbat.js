const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!admin.apps.length) {
  const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
  let privateKey = "";
  if (privateKeyB64) {
    privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = getFirestore(admin.app(), "default");

async function updateShabbat() {
  console.log("Starting Shabbat times update cron job...");
  
  // 1. Fetch from Hebcal
  console.log("Fetching Tel Aviv times from Hebcal...");
  const hebcalRes = await fetch("https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&b=30&m=50");
  if (!hebcalRes.ok) {
    throw new Error(`Failed to fetch from Hebcal: ${hebcalRes.statusText}`);
  }
  const hebcalData = await hebcalRes.json();
  
  // Parse Hebcal items
  const candlesItem = hebcalData.items.find(item => item.category === "candles");
  const parashaItem = hebcalData.items.find(item => item.category === "parashat");
  const havdalahItem = hebcalData.items.find(item => item.category === "havdalah");
  
  if (!candlesItem || !havdalahItem || !parashaItem) {
    throw new Error("Missing required candle lighting, havdalah, or parashat data from Hebcal.");
  }
  
  const candleLighting = candlesItem.title.match(/\d+:\d+/)?.[0] || "";
  const havdalah = havdalahItem.title.match(/\d+:\d+/)?.[0] || "";
  const parashaHebrew = parashaItem.hebrew || "";
  const parashaEnglish = parashaItem.title || "";
  
  console.log(`Parsed Hebcal data:`);
  console.log(`- Candle lighting: ${candleLighting}`);
  console.log(`- Havdalah: ${havdalah}`);
  console.log(`- Parasha: ${parashaHebrew} (${parashaEnglish})`);
  
  // Calculate prayer times based on candle lighting
  const prayerTimes = {
    minchaErevShabbat: candleLighting,
    shacharitShabbat: "10:00",
    minchaShabbat: "18:30",
    arvitMotzeiShabbat: havdalah
  };

  // 2. Load API Key and call Gemini for Chassidic Dvar Torah
  console.log("Retrieving Gemini API Key...");
  const aiSettingsDoc = await db.collection("configs").doc("ai_settings").get();
  const apiKey = process.env.GEMINI_API_KEY || (aiSettingsDoc.exists ? aiSettingsDoc.data().googleAiKey : "");
  
  let dvarTorah = "";
  if (!apiKey) {
    console.warn("No Gemini API key found. Using fallback Dvar Torah.");
    dvarTorah = `שבת שלום לכל הקהילה החמה שלנו באזור!\n\nהשבוע אנו קוראים את ${parashaHebrew}. אנו מזמינים אתכם להצטרף אלינו לתפילות ולסעודות השבת בבית חב"ד באווירה משפחתית, שירה ודברי תורה.\n\nשתהיה שבת שלום ומבורכת, מלאה באור, שמחה וברכה לכם ולכל בני ביתכם!`;
  } else {
    try {
      console.log(`Calling Gemini API to generate Dvar Torah for ${parashaHebrew}...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
      
      const prompt = `You are a warm, welcoming Chabad Rabbi. Write an inspiring, beautiful Chassidic Dvar Torah in Hebrew for the upcoming Torah portion: ${parashaHebrew}.
The Dvar Torah must start with "בס"ד" and a warm greeting to the community.
It should explain a central message of the Parasha based on Chassidut (incorporating teachings of the Lubavitcher Rebbe) in a warm, friendly and inspiring tone.
Format the output with paragraphs separated by newlines. The length should be around 3-4 paragraphs.
Write only the Hebrew text, without any markdown layout (plain text Hebrew only).`;
      
      const result = await model.generateContent([prompt]);
      dvarTorah = result.response.text().trim();
      console.log("Successfully generated Dvar Torah with Gemini!");
    } catch (err) {
      console.error("Failed to generate Dvar Torah with Gemini:", err);
      dvarTorah = `שבת שלום לכל הקהילה החמה שלנו באזור!\n\nהשבוע אנו קוראים את ${parashaHebrew}. אנו מזמינים אתכם להצטרף אלינו לתפילות ולסעודות השבת בבית חב"ד באווירה משפחתית, שירה ודברי תורה.\n\nשתהיה שבת שלום ומבורכת, מלאה באור, שמחה וברכה לכם ולכל בני ביתכם!`;
    }
  }
  
  // 3. Save to Firestore configs/shabbat
  console.log("Saving Shabbat data to configs/shabbat in Firestore...");
  await db.collection("configs").doc("shabbat").set({
    candleLighting,
    havdalah,
    parashaHebrew,
    parashaEnglish,
    prayerTimes,
    dvarTorah,
    updatedAt: new Date().toISOString()
  });
  
  console.log("Shabbat times update successfully completed!");
}

updateShabbat().catch(err => {
  console.error("Cron job failed:", err);
  process.exit(1);
});
