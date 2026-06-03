"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

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
  };
  services: {
    layout: "grid" | "carousel" | "list" | "fz" | "bento" | "modular" | "progressive" | "spatial" | "thumb";
    visible: boolean;
    items?: ServiceItem[];
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
  };
  livePosts: {
    visible: boolean;
    layout?: "grid" | "carousel" | "list" | "bento";
    customPages?: string[];
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
  };
  richContent?: {
    visible: boolean;
    heading: string;
    body: string;
    layout: "center" | "two-column" | "grid";
  };
  mobileHiddenSections?: string[];
  sectionOrder: string[];
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
  mobileHiddenSections: [],
  sectionOrder: ["hero", "mainContent", "services", "community", "livePosts", "richContent", "contact", "landingSection"],
};

export async function getHomePageConfig(): Promise<HomePageConfig> {
  try {
    const docRef = adminDb.collection("pages").doc("home");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
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

      return {
        hero: {
          title: data.hero?.title || DEFAULT_HOME_CONFIG.hero.title,
          subtitle: data.hero?.subtitle || DEFAULT_HOME_CONFIG.hero.subtitle,
          description: data.hero?.description || DEFAULT_HOME_CONFIG.hero.description,
          imageSrc: data.hero?.imageSrc || DEFAULT_HOME_CONFIG.hero.imageSrc,
          layout: data.hero?.layout || DEFAULT_HOME_CONFIG.hero.layout,
          buttonsVisible: data.hero?.buttonsVisible ?? DEFAULT_HOME_CONFIG.hero.buttonsVisible,
          primaryButton: data.hero?.primaryButton || DEFAULT_HOME_CONFIG.hero.primaryButton,
          secondaryButton: data.hero?.secondaryButton || DEFAULT_HOME_CONFIG.hero.secondaryButton,
        },
        mainContent: {
          visible: data.mainContent?.visible ?? DEFAULT_HOME_CONFIG.mainContent.visible,
          title: data.mainContent?.title || DEFAULT_HOME_CONFIG.mainContent.title,
          subtitle: data.mainContent?.subtitle || DEFAULT_HOME_CONFIG.mainContent.subtitle,
          description: data.mainContent?.description || DEFAULT_HOME_CONFIG.mainContent.description,
          imageSrc: data.mainContent?.imageSrc || DEFAULT_HOME_CONFIG.mainContent.imageSrc,
          layout: data.mainContent?.layout || DEFAULT_HOME_CONFIG.mainContent.layout,
          buttonsVisible: data.mainContent?.buttonsVisible ?? DEFAULT_HOME_CONFIG.mainContent.buttonsVisible,
          primaryButton: data.mainContent?.primaryButton || DEFAULT_HOME_CONFIG.mainContent.primaryButton,
          secondaryButton: data.mainContent?.secondaryButton || DEFAULT_HOME_CONFIG.mainContent.secondaryButton,
        },
        services: {
          layout: data.services?.layout || DEFAULT_HOME_CONFIG.services.layout,
          visible: data.services?.visible ?? DEFAULT_HOME_CONFIG.services.visible,
          items: data.services?.items || DEFAULT_HOME_CONFIG.services.items,
        },
        community: {
          visible: data.community?.visible ?? DEFAULT_HOME_CONFIG.community.visible,
          title: data.community?.title ?? DEFAULT_HOME_CONFIG.community.title,
          subtitle: data.community?.subtitle ?? DEFAULT_HOME_CONFIG.community.subtitle,
          description: data.community?.description ?? DEFAULT_HOME_CONFIG.community.description,
          quote: data.community?.quote ?? DEFAULT_HOME_CONFIG.community.quote,
          imageSrc: data.community?.imageSrc ?? DEFAULT_HOME_CONFIG.community.imageSrc,
          badgeTitle: data.community?.badgeTitle ?? DEFAULT_HOME_CONFIG.community.badgeTitle,
          badgeSubtitle: data.community?.badgeSubtitle ?? DEFAULT_HOME_CONFIG.community.badgeSubtitle,
          buttonText: data.community?.buttonText ?? DEFAULT_HOME_CONFIG.community.buttonText,
          whatsappNumber: data.community?.whatsappNumber ?? DEFAULT_HOME_CONFIG.community.whatsappNumber,
          layout: data.community?.layout ?? DEFAULT_HOME_CONFIG.community.layout,
          badgeVisible: data.community?.badgeVisible ?? DEFAULT_HOME_CONFIG.community.badgeVisible,
          buttonVisible: data.community?.buttonVisible ?? DEFAULT_HOME_CONFIG.community.buttonVisible,
        },
        livePosts: {
          visible: data.livePosts?.visible ?? DEFAULT_HOME_CONFIG.livePosts.visible,
          layout: data.livePosts?.layout || DEFAULT_HOME_CONFIG.livePosts.layout,
          customPages: data.livePosts?.customPages || DEFAULT_HOME_CONFIG.livePosts.customPages,
        },
        contact: {
          visible: data.contact?.visible ?? DEFAULT_HOME_CONFIG.contact.visible,
          title: data.contact?.title || DEFAULT_HOME_CONFIG.contact.title,
          subtitle: data.contact?.subtitle || DEFAULT_HOME_CONFIG.contact.subtitle,
          addressLabel: data.contact?.addressLabel || DEFAULT_HOME_CONFIG.contact.addressLabel,
          addressVal: data.contact?.addressVal || DEFAULT_HOME_CONFIG.contact.addressVal,
          phoneLabel: data.contact?.phoneLabel || DEFAULT_HOME_CONFIG.contact.phoneLabel,
          phoneVal: data.contact?.phoneVal || DEFAULT_HOME_CONFIG.contact.phoneVal,
          hoursLabel: data.contact?.hoursLabel || DEFAULT_HOME_CONFIG.contact.hoursLabel,
          hoursVal: data.contact?.hoursVal || DEFAULT_HOME_CONFIG.contact.hoursVal,
          form: data.contact?.form || DEFAULT_HOME_CONFIG.contact.form || DEFAULT_CONTACT_FORM_CONFIG,
        },
        landingSection: {
          visible: data.landingSection?.visible ?? DEFAULT_HOME_CONFIG.landingSection?.visible ?? true,
          title: data.landingSection?.title || DEFAULT_HOME_CONFIG.landingSection?.title || "",
          subtitle: data.landingSection?.subtitle || DEFAULT_HOME_CONFIG.landingSection?.subtitle || "",
          description: data.landingSection?.description || DEFAULT_HOME_CONFIG.landingSection?.description || "",
          imageSrc: data.landingSection?.imageSrc || DEFAULT_HOME_CONFIG.landingSection?.imageSrc || "",
          form: data.landingSection?.form || DEFAULT_HOME_CONFIG.landingSection?.form || DEFAULT_FORM_CONFIG,
          layout: data.landingSection?.layout || DEFAULT_HOME_CONFIG.landingSection?.layout || "split-left",
          formMode: data.landingSection?.formMode || DEFAULT_HOME_CONFIG.landingSection?.formMode || "visible",
          buttonText: data.landingSection?.buttonText || DEFAULT_HOME_CONFIG.landingSection?.buttonText || "להקדשה ותרומה",
        },
        richContent: {
          visible: data.richContent?.visible ?? DEFAULT_HOME_CONFIG.richContent?.visible ?? true,
          heading: data.richContent?.heading || DEFAULT_HOME_CONFIG.richContent?.heading || "",
          body: data.richContent?.body || DEFAULT_HOME_CONFIG.richContent?.body || "",
          layout: data.richContent?.layout || DEFAULT_HOME_CONFIG.richContent?.layout || "center",
        },
        mobileHiddenSections: data.mobileHiddenSections || DEFAULT_HOME_CONFIG.mobileHiddenSections || [],
        sectionOrder,
      } as HomePageConfig;
    }
    return DEFAULT_HOME_CONFIG;
  } catch (error) {
    console.warn(`Error fetching home page config:`, (error as Error).message);
    return DEFAULT_HOME_CONFIG;
  }
}

export async function saveHomePageConfig(content: Partial<HomePageConfig>) {
  try {
    const docRef = adminDb.collection("pages").doc("home");
    await docRef.set({ ...content, updatedAt: new Date().toISOString() }, { merge: true });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.warn(`Error saving home page config:`, (error as Error).message);
    throw new Error("Failed to save to Firebase");
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

    landingSnap.docs.forEach(doc => {
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

    postsSnap.docs.forEach(doc => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.title || doc.id,
        description: data.summary || "",
        imageSrc: data.imageUrl || "",
        url: `/post/${doc.id}`,
        icon: "Newspaper"
      });
    });

    return allPages;
  } catch (error) {
    console.error("Error fetching all site pages:", error);
    return [];
  }
}
