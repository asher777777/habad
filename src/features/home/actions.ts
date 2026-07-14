"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

import type { FormConfig } from "@/features/crm/components/CRMFormBuilder";

export interface ButtonConfig {
  text: string;
  link: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  imageSrc?: string;
  isVisible: boolean;
}

export interface HomePageConfig {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    layout: "fz" | "bento" | "modular" | "progressive" | "spatial" | "thumb";
    buttonsVisible?: boolean;
    primaryButton?: ButtonConfig;
    secondaryButton?: ButtonConfig;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  mainContent: {
    visible: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    layout: "fz" | "bento" | "modular" | "progressive" | "spatial" | "thumb";
    buttonsVisible?: boolean;
    primaryButton?: ButtonConfig;
    secondaryButton?: ButtonConfig;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  services: {
    title?: string;
    description?: string;
    layout: "grid" | "carousel" | "image-card" | "hover-card";
    effect?: "none" | "zoom" | "lift" | "glow";
    columns?: number;
    visible: boolean;
    items?: ServiceItem[];
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  community: {
    visible: boolean;
    title: string;
    subtitle: string;
    description: string;
    quote: string;
    imageSrc: string;
    badgeTitle: string;
    badgeSubtitle: string;
    buttonText: string;
    whatsappNumber: string;
    layout: "split-left" | "split-right" | "centered";
    badgeVisible: boolean;
    buttonVisible: boolean;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  livePosts: {
    visible: boolean;
    layout?: "grid" | "carousel" | "list" | "bento";
    customPages?: string[];
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  contact: {
    visible: boolean;
    title?: string;
    subtitle?: string;
    addressLabel?: string;
    addressVal?: string;
    phoneLabel?: string;
    phoneVal?: string;
    hoursLabel?: string;
    hoursVal?: string;
    form?: FormConfig;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  landingSection?: {
    visible: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    form: FormConfig;
    layout?: "split-left" | "split-right";
    formMode?: "visible" | "modal";
    buttonText?: string;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
    backgroundOpacity?: number;
  };
  richContent?: {
    visible: boolean;
    heading: string;
    body: string;
    layout: "center" | "two-column" | "grid";
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  timer?: {
    visible: boolean;
    title: string;
    subtitle: string;
    targetDate: string;
    layout: "classic" | "modern" | "compact";
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  mobileHiddenSections?: string[];
  sectionOrder: string[];
  seo?: {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
  };
}

const DEFAULT_FORM_CONFIG: FormConfig = {
  enabled: true,
  form_type: "standard",
  submit_button_text: "שלח פנייה",
  submit_button_bg_color: "#25D366",
  submit_button_text_color: "#ffffff",
  fields: [
    {
      label: "שם מלא",
      type: "text",
      map_to: "conta_name",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "מספר טלפון נייד",
      type: "tel",
      map_to: "conta_phone",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "כתובת אימייל",
      type: "email",
      map_to: "email",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    }
  ],
  save_to_crm: true,
  crm_owner_id: "1",
  standard_success_message: "הבקשה התקבלה בהצלחה! תודה רבה לך.",
  standard_redirect_url: "",
  standard_whatsapp_message: "שלום {שם מלא}, תודה על פנייתך. פרטייך התקבלו במערכת בית חב\"ד.",
  standard_whatsapp_image_url: "",
  payment_amount: 180,
  payment_amount_crm_map: "tg2",
  payment_pending_message: "שלום {שם מלא}, ההזמנה שלך ל{עמוד} בסך {סכום} ש\"ח נוצרה וממתינה לתשלום.",
  payment_pending_image_url: "",
  payment_success_message: "שלום {שם מלא}, תודה רבה! התשלום בסך {סכום} ש\"ח עבור {עמוד} התקבל בהצלחה.",
  payment_success_image_url: "",
  payment_group: "",
  payment_zeut_kupa: "",
  payment_receipt_type: "",
  payment_frequency: "one-time"
};


const DEFAULT_CONTACT_FORM_CONFIG: FormConfig = {
  enabled: true,
  form_type: "standard",
  submit_button_text: "שליחת הודעה",
  submit_button_bg_color: "#e28743",
  submit_button_text_color: "#ffffff",
  fields: [
    {
      label: "שם מלא",
      type: "text",
      map_to: "conta_name",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "טלפון",
      type: "tel",
      map_to: "conta_phone",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "דוא\"ל",
      type: "email",
      map_to: "email",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "איך נוכל לעזור?",
      type: "textarea",
      map_to: "notes",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    }
  ],
  save_to_crm: true,
  crm_owner_id: "1",
  standard_success_message: "ההודעה התקבלה בהצלחה! נחזור אליכם בהקדם.",
  standard_redirect_url: "",
  standard_whatsapp_message: "שלום {שם מלא}, תודה על פנייתך. ההודעה התקבלה במערכת בית חב\"ד.",
  standard_whatsapp_image_url: "",
  payment_amount: 180,
  payment_amount_crm_map: "tg2",
  payment_pending_message: "",
  payment_pending_image_url: "",
  payment_success_message: "",
  payment_success_image_url: "",
  payment_group: "",
  payment_zeut_kupa: "",
  payment_receipt_type: "",
  payment_frequency: "one-time"
};

const DEFAULT_HOME_CONFIG: HomePageConfig = {
  hero: {
    title: "בית חב\"ד שלך",
    subtitle: "ברוכים הבאים לבית שלנו",
    description: "המקום שבו כל יהודי מרגיש בבית. אנחנו כאן בשבילך לכל דבר ביהדות באהבה ובשמחה.",
    imageSrc: "/placeholder.png",
    layout: "fz",
    buttonsVisible: true,
    primaryButton: { text: "בדיקת תפילין ומזוזות", link: "/services" },
    secondaryButton: { text: "זמני שבת וחגים", link: "/shabbat" },
  },
  mainContent: {
    visible: true,
    title: "הפעילות שלנו בקהילה",
    subtitle: "יותר ממקום תפילה",
    description: "מרכז של חסד, עזרה הדדית, תוכניות לנוער ופעילויות סביב מעגל השנה. הכל מתוך אהבת ישראל אמיתית.",
    imageSrc: "/images/hero-shabbat.png",
    layout: "bento",
    buttonsVisible: true,
    primaryButton: { text: "בדיקת תפילין ומזוזות", link: "/services" },
    secondaryButton: { text: "זמני שבת וחגים", link: "/shabbat" },
  },
  services: {
    title: "שירותי דת וקהילה",
    description: "אנחנו כאן כדי להנגיש לכם את המסורת היהודית בצורה המודרנית והנוחה ביותר.",
    layout: "grid",
    visible: true,
    items: [
      { id: "1", title: "הכשרת המטבח", description: "ייעוץ וליווי אישי להכשרת המטבח הביתי שלכם בקלות ובנעימות.", icon: "UtensilsCrossed", url: "/service/kitchen-koshering", isVisible: true },
      { id: "2", title: "התקנת מזוזה", description: "בדיקת מזוזות קיימות והתקנת מזוזות חדשות בכל פתחי הבית.", icon: "DoorOpen", url: "/service/mazoza", isVisible: true },
      { id: "3", title: "בדיקת תפילין", description: "שירות בדיקה מוסמך לתפילין שלכם להבטחת כשרותם.", icon: "ScrollText", url: "/service/tefillin-checking", isVisible: true },
      { id: "4", title: "שיעורי תורה", description: "מגוון שיעורים וסדנאות בנושאים שונים - מהגות ועד הלכה.", icon: "BookOpen", url: "/service/torah-classes", isVisible: true },
      { id: "5", title: "ערבי נשים", description: "מפגשים חברתיים ותוכניות העשרה ייחודיות לנשים.", icon: "Users", url: "/service/womens-evenings", isVisible: true },
      { id: "6", title: "אירוח לשבת", description: "תמיד יש מקום בשולחן שלנו. מוזמנים לסעודות שבת חמות.", icon: "Home", url: "/service/shabbat-hosting", isVisible: true },
      { id: "7", title: "קפה ושיחה", description: "צריכים אוזן קשבת? בואו לקפה ושיחה פתוחה בגובה העיניים.", icon: "Coffee", url: "/service/coffee-chat", isVisible: true },
      { id: "8", title: "עזרה לנזקקים", description: "סיוע פיזי ורגשי לכל מי שזקוק, ללא שאלות מיותרות.", icon: "HeartHandshake", url: "/service/aid-for-needy", isVisible: true },
    ]
  },
  community: {
    visible: true,
    title: "קהילה שהיא <span class=\"text-secondary\">משפחה</span>",
    subtitle: "",
    description: "אנחנו כאן כדי להיות הבית שלכם באזור. המטרה שלנו היא ליצור מרחב בטוח, חם ומקבל לכל תושב ותושבת, ללא קשר לרקע או רמת דתיות.",
    quote: "\"כל יהודי הוא עולם ומלואו, ובבית חב\"ד כל אחד מרגיש שייך.\"",
    imageSrc: "/images/shaliach-family.png",
    badgeTitle: "הרב מענדי ומושקא",
    badgeSubtitle: "השליחים שלכם בקמפוס",
    buttonText: "דברו איתנו ב-WhatsApp",
    whatsappNumber: "972545947701",
    layout: "split-left",
    badgeVisible: true,
    buttonVisible: true,
  },
  livePosts: {
    visible: true,
    layout: "grid",
    customPages: [],
  },
  contact: {
    visible: true,
    title: "נשמח לשמוע ממך",
    subtitle: "יש לכם שאלה? צריכים עזרה במשהו? השאירו פרטים ונחזור אליכם בהקדם.",
    addressLabel: "כתובתנו",
    addressVal: "יצחק שדה 2, אזור",
    phoneLabel: "טלפון",
    phoneVal: "054-594-7701",
    hoursLabel: "שעות פעילות",
    hoursVal: "א'-ה' 09:00-21:00 | ו' עד כניסת שבת",
    form: DEFAULT_CONTACT_FORM_CONFIG,
  },
  landingSection: {
    visible: true,
    title: "זכות פינת הקפה: מחממים את הלב למתפללים!",
    subtitle: "תרומה קטנה של קפה וסוכר - זכות גדולה של תורה ותפילה.",
    description: "אנו מזמינים אתכם לקחת חלק באחזקת פינת הקפה של בית הכנסת. בעלות חודשית של 770 ש\"ח בלבד, תוכלו לזכות את הרבים ולהקדיש את התרומה לעילוי נשמת יקיריכם, להצלחה או למציאת זיווג הגון.",
    imageSrc: "/placeholder.png",
    form: DEFAULT_FORM_CONFIG,
    layout: "split-left",
    formMode: "visible",
    buttonText: "להקדשה ותרומה",
  },
  richContent: {
    visible: true,
    heading: "אירוע שכולו שמחה, קדושה ומשפחתיות",
    body: "אירוע בבית חב\"ד הוא הרבה יותר מעוד השכרת אולם; זוהי חוויה עוטפת של קדושה, חום ואווירה יהודית אותנטית. האולם שלנו תוכנן במיוחד כדי לארח התכנסויות משפחתיות וקהילתיות של עד 60 איש, מה שהופך אותו למקום האידיאלי ביותר עבור חגיגות בר מצווה מרגשות, אזכרות מכבדות ושבתות חתן מגבשות. מעבר לחלל הפנימי, תהנו מחצר נעימה המרחיבה את מרחב האירוע, ומציוד מלא לשבת הכולל פלטות שבת ומיחמים לנוחיותכם. צוות בית חב\"ד ישמח לעמוד לשירותכם, לסייע בכל פרט טכני ורוחני, ולהבטיח שהאירוע שלכם יהיה מרגש, מכבד ומוצלח. דלתנו פתוחה לכולם באהבה.",
    layout: "center",
  },
  timer: {
    visible: false,
    title: "הזמן אוזל!",
    subtitle: "מהרו להירשם לפני סיום ההרשמה",
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    layout: "classic",
  },
  mobileHiddenSections: [],
  sectionOrder: ["hero", "mainContent", "services", "community", "livePosts", "timer", "richContent", "contact", "landingSection"],
};

const DEFAULT_SERVICES_LANDING_CONFIG: HomePageConfig = {
  ...DEFAULT_HOME_CONFIG,
  hero: {
    ...DEFAULT_HOME_CONFIG.hero,
    title: "הנגשת המסורת במאור פנים",
    subtitle: "שירותי דת וקהילה",
    description: "בית חב\"ד אזור שמח להעניק לכם מגוון רחב של שירותי דת, תמיכה קהילתית, שיעורים ומפגשים. כל השירותים מוגשים באהבה, ללא שיפוטיות ובגובה העיניים.",
  },
  services: {
    title: "השירותים שלנו",
    description: "",
    layout: "grid",
    columns: 3,
    visible: true,
    items: []
  },
  mainContent: { ...DEFAULT_HOME_CONFIG.mainContent, visible: false },
  community: { ...DEFAULT_HOME_CONFIG.community, visible: false },
  livePosts: { ...DEFAULT_HOME_CONFIG.livePosts, visible: false },
  timer: { ...DEFAULT_HOME_CONFIG.timer!, visible: false },
  richContent: { ...DEFAULT_HOME_CONFIG.richContent!, visible: false },
  contact: { ...DEFAULT_HOME_CONFIG.contact, visible: false },
  landingSection: { 
    ...DEFAULT_HOME_CONFIG.landingSection!, 
    visible: true,
    title: "לא מצאתם את השירות שחיפשתם?",
    subtitle: "",
    description: "אנחנו כאן לכל עניין - גדול כקטן. נשמח לסייע לכם בכל בקשה, שאלה או צורך אישי או הלכתי שעולה. פנו אלינו ישירות ונשמח לעמוד לשירותכם.",
    buttonText: "יצירת קשר מהירה"
  },
  sectionOrder: ["hero", "services", "mainContent", "community", "livePosts", "timer", "richContent", "contact", "landingSection"],
};

function mergeWithDefaultConfig(data: any): HomePageConfig {
  if (!data) return DEFAULT_HOME_CONFIG;
  
  const rawSectionOrder = data.sectionOrder || DEFAULT_HOME_CONFIG.sectionOrder;
  let sectionOrder = rawSectionOrder.includes("landingSection") 
    ? rawSectionOrder 
    : [...rawSectionOrder, "landingSection"];
  if (!sectionOrder.includes("richContent")) {
    const contactIdx = sectionOrder.indexOf("contact");
    if (contactIdx !== -1) {
      sectionOrder = [
        ...sectionOrder.slice(0, contactIdx),
        "richContent",
        ...sectionOrder.slice(contactIdx)
      ];
    } else {
      sectionOrder = [...sectionOrder, "richContent"];
    }
  }

  if (!sectionOrder.includes("timer")) {
    const richContentIdx = sectionOrder.indexOf("richContent");
    if (richContentIdx !== -1) {
      sectionOrder = [
        ...sectionOrder.slice(0, richContentIdx),
        "timer",
        ...sectionOrder.slice(richContentIdx)
      ];
    } else {
      sectionOrder = [...sectionOrder, "timer"];
    }
  }

  return {
    hero: { ...DEFAULT_HOME_CONFIG.hero, ...data.hero },
    mainContent: { ...DEFAULT_HOME_CONFIG.mainContent, ...data.mainContent },
    services: { ...DEFAULT_HOME_CONFIG.services, ...data.services },
    community: { ...DEFAULT_HOME_CONFIG.community, ...data.community },
    livePosts: { ...DEFAULT_HOME_CONFIG.livePosts, ...data.livePosts },
    contact: { ...DEFAULT_HOME_CONFIG.contact, ...data.contact },
    landingSection: { ...DEFAULT_HOME_CONFIG.landingSection, ...data.landingSection },
    richContent: { ...DEFAULT_HOME_CONFIG.richContent, ...data.richContent },
    timer: { ...DEFAULT_HOME_CONFIG.timer, ...data.timer },
    mobileHiddenSections: data.mobileHiddenSections || DEFAULT_HOME_CONFIG.mobileHiddenSections || [],
    sectionOrder,
    seo: data.seo,
  } as HomePageConfig;
}

export async function getHomePageConfig(): Promise<HomePageConfig> {
  return getPageConfigWithDefault("pages", "home", DEFAULT_HOME_CONFIG);
}

export async function getServicesLandingConfig(): Promise<HomePageConfig> {
  return getPageConfigWithDefault("pages", "services-landing", DEFAULT_SERVICES_LANDING_CONFIG);
}

async function getPageConfigWithDefault(collectionName: string, docId: string, defaultConfig: HomePageConfig): Promise<HomePageConfig> {
  try {
    const docRef = adminDb.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      const mergedConfig = mergeWithDefaultConfig(data);
      // If it's services-landing, ensure the sectionOrder remains customized if not overridden by the user
      if (docId === "services-landing" && !data?.sectionOrder) {
        mergedConfig.sectionOrder = defaultConfig.sectionOrder;
      }
      return mergedConfig;
    }
    return defaultConfig;
  } catch (error) {
    console.warn(`Error fetching config for ${docId}:`, (error as Error).message);
    return defaultConfig;
  }
}

export async function saveHomePageConfig(content: Partial<HomePageConfig>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return savePageConfig("pages", "home", content);
}

export async function savePageConfig(collectionName: string, docId: string, content: Partial<HomePageConfig>) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const docRef = adminDb.collection(collectionName).doc(docId);
    await docRef.set({ ...content, updatedAt: new Date().toISOString() }, { merge: true });
    
    // Revalidate relevant paths
    if (collectionName === "pages" && docId === "home") revalidatePath("/");
    else if (collectionName === "services") revalidatePath(`/service/${docId}`);
    else if (collectionName === "landing") revalidatePath(`/landing/${docId}`);
    else if (collectionName === "posts") revalidatePath(`/post/${docId}`);
    
    return { success: true };
  } catch (error: any) {
    console.warn(`Error saving page config for ${collectionName}/${docId}:`, error.message);
    throw new Error(`Firebase save error: ${error.message}`);
  }
}

export async function getPageConfig(collectionName: string, docId: string): Promise<HomePageConfig | null> {
  try {
    const docRef = adminDb.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return mergeWithDefaultConfig(docSnap.data());
    }
    return null;
  } catch (error) {
    console.warn(`Error fetching page config for ${collectionName}/${docId}:`, (error as Error).message);
    return null;
  }
}

export async function getAllSitePages() {
  try {
    const [servicesSnap, postsSnap, landingSnap] = await Promise.all([
      adminDb.collection("services").get(),
      adminDb.collection("posts").get(),
      adminDb.collection("landing").get()
    ]);

    const allPages: Array<{id: string, title: string, description: string, url: string, icon: string, imageSrc: string}> = [];
    
    servicesSnap.docs.forEach(doc => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.hero?.title || data.seo?.title || doc.id,
        description: data.hero?.description || data.seo?.description || "",
        imageSrc: data.hero?.imageSrc || "",
        url: `/service/${doc.id}`,
        icon: "BookOpen"
      });
    });

    landingSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.hero?.title || data.seo?.title || doc.id,
        description: data.hero?.description || data.seo?.description || "",
        imageSrc: data.hero?.imageSrc || "",
        url: `/landing/${doc.id}`,
        icon: "Globe"
      });
    });

    postsSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.hero?.title || data.title || data.seo?.title || doc.id,
        description: data.hero?.description || data.summary || data.seo?.description || "",
        imageSrc: data.hero?.imageSrc || data.imageUrl || "",
        url: `/post/${doc.id}`,
        icon: "Newspaper"
      });
    });

    return JSON.parse(JSON.stringify(allPages));
  } catch (error) {
    console.error("Error fetching all site pages:", error);
    return [];
  }
}
