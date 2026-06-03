"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Edit3, Save, X, Star, Heart, Shield, Zap, Book, Calendar, ShieldCheck, 
  Users, Globe, Loader2, Wand2, Sparkles, Image as ImageIcon, Gift, MapPin, 
  Flame, GraduationCap, Coins, FileText, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { saveServicePage, generateHeroImageWithAI } from "@/features/services/actions";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { CRMFormBuilder, FormConfig } from "@/features/crm/components/CRMFormBuilder";
import { CRMFormRenderer } from "@/features/crm/components/CRMFormRenderer";
import { Modal } from "@/components/ui/Modal";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => m.RichTextEditor),
  { 
    ssr: false, 
    loading: () => <div className="h-40 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">טוען עורך תוכן...</div> 
  }
);

const DEFAULT_FORM_CONFIG: FormConfig = {
  enabled: false,
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
    }
  ],
  save_to_crm: true,
  crm_owner_id: "1",
  standard_success_message: "הטופס נשלח בהצלחה!",
  standard_redirect_url: "",
  standard_whatsapp_message: "שלום {שם מלא}, תודה על פנייתך לעמוד {עמוד}. פרטייך התקבלו במערכת בית חב\"ד.",
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

const IconMap: Record<string, any> = {
  Star, Heart, Shield, Zap, Book, Calendar, ShieldCheck, Users, Globe, Gift, MapPin, Flame, GraduationCap, Coins
};

const themePresets: Record<string, { bg: string; text: string; accent: string; accentHover: string; iconBg: string; iconText: string; }> = {
  navy: {
    bg: "bg-slate-900",
    text: "text-slate-100",
    accent: "text-amber-500",
    accentHover: "group-hover:text-amber-500",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500"
  },
  emerald: {
    bg: "bg-emerald-950",
    text: "text-emerald-50",
    accent: "text-yellow-400",
    accentHover: "group-hover:text-yellow-400",
    iconBg: "bg-yellow-400/10",
    iconText: "text-yellow-400"
  },
  rose: {
    bg: "bg-rose-950",
    text: "text-rose-50",
    accent: "text-rose-300",
    accentHover: "group-hover:text-rose-300",
    iconBg: "bg-rose-300/10",
    iconText: "text-rose-300"
  },
  violet: {
    bg: "bg-violet-950",
    text: "text-violet-50",
    accent: "text-amber-300",
    accentHover: "group-hover:text-amber-300",
    iconBg: "bg-amber-300/10",
    iconText: "text-amber-300"
  },
  charcoal: {
    bg: "bg-zinc-950",
    text: "text-zinc-100",
    accent: "text-teal-400",
    accentHover: "group-hover:text-teal-400",
    iconBg: "bg-teal-400/10",
    iconText: "text-teal-400"
  }
};

export function ServicePageClient({ initialData, slug }: { initialData: any, slug: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialData);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (content.hero?.title && !aiPrompt) {
      setAiPrompt(`צילום מקצועי וחם של ${content.hero.title}, סגנון מזמין, תאורה רכה, איכות גבוהה, HDR`);
    }
  }, [content.hero?.title, isEditing]);

  const handleGenerateImage = async () => {
    if (!aiPrompt) return;
    setGeneratingImage(true);
    setAiError("");
    try {
      const res = await generateHeroImageWithAI(aiPrompt);
      if (res.success && res.url) {
        handleHeroChange("imageSrc", res.url);
      } else {
        setAiError(res.error || "שגיאה ביצירת התמונה.");
      }
    } catch (e: any) {
      setAiError(e.message || "שגיאה בתקשורת עם השרת.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleSave = async () => {
    try {
      await saveServicePage(slug, content);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save to Firestore", e);
      alert("שגיאה בשמירה ל-Firebase.");
    }
  };

  const handleHeroChange = (field: string, value: string) => {
    setContent({ ...content, hero: { ...content.hero, [field]: value } });
  };

  const handleSeoChange = (field: string, value: string) => {
    setContent({ ...content, seo: { ...content.seo, [field]: value } });
  };

  const handleContentChange = (field: string, value: string) => {
    setContent({ ...content, content: { ...content.content, [field]: value } });
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...(content.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  };

  const handleLayoutChange = (section: 'hero' | 'content', layout: string) => {
    setContent({
      ...content,
      [section]: {
        ...content[section],
        layout: layout
      }
    });
  };

  const activeTheme = themePresets[content.theme || "navy"] || themePresets.navy;
  const heroLayout = content.hero?.layout || "center";
  const contentLayout = content.content?.layout || "center";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      {/* Admin Edit Trigger */}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2">
        {isEditing ? (
          <>
            <Button 
              variant="primary" 
              size="lg" 
              className="rounded-full shadow-2xl bg-green-600 hover:bg-green-700 h-14 w-14 p-0"
              onClick={handleSave}
            >
              <Save />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full shadow-2xl bg-white h-14 w-14 p-0"
              onClick={() => {
                setContent(initialData);
                setIsEditing(false);
              }}
            >
              <X />
            </Button>
          </>
        ) : (
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-full shadow-2xl bg-secondary h-14 w-14 p-0"
            onClick={toggleEdit}
          >
            <Edit3 />
          </Button>
        )}
      </div>

      <main className="flex-grow pt-20">
        {/* SEO & Theme Design Panel */}
        {isEditing && (
          <div className="max-w-7xl mx-auto px-6 py-6 bg-muted/30 rounded-3xl mb-8 border border-dashed text-right grid grid-cols-1 lg:grid-cols-2 gap-8" dir="rtl">
            {/* SEO Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-primary" />
                הגדרות קידום אתרים (SEO)
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">כותרת עמוד (Title)</label>
                <input 
                  value={content.seo?.title || ""} 
                  onChange={(e) => handleSeoChange("title", e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תיאור עמוד (Description)</label>
                <textarea 
                  value={content.seo?.description || ""} 
                  onChange={(e) => handleSeoChange("description", e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none bg-white focus:ring-2 focus:ring-primary/20 min-h-[90px]"
                />
              </div>
            </div>

            {/* Design & Theme Selector */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                עיצוב וצבעי העמוד (Color Theme)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                בחר את פלטת הצבעים המרכזית עבור עמוד שירות זה:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(themePresets).map((presetKey) => {
                  const preset = themePresets[presetKey];
                  const isSelected = (content.theme || "navy") === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => setContent({ ...content, theme: presetKey })}
                      className={`flex items-center gap-2 p-3 rounded-2xl border text-right transition-all duration-300 ${
                        isSelected 
                          ? "border-primary bg-white shadow-md ring-2 ring-primary/20 scale-102 font-bold" 
                          : "border-slate-100 bg-white/50 hover:bg-white"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${preset.bg} border border-black/10`} />
                      <span className="text-xs">
                        {presetKey === "navy" && "כחול נייבי (חב\"ד)"}
                        {presetKey === "emerald" && "ירוק ברקת"}
                        {presetKey === "rose" && "אדום ורד"}
                        {presetKey === "violet" && "סגול מלכותי"}
                        {presetKey === "charcoal" && "פחם אלגנטי"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Form Enable Toggle */}
              <div className="pt-4 border-t border-slate-200 mt-4 col-span-full">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={content.form?.enabled || false}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setContent({
                        ...content,
                        form: content.form 
                          ? { ...content.form, enabled } 
                          : { ...DEFAULT_FORM_CONFIG, enabled }
                      });
                    }}
                    className="w-4 h-4 text-primary rounded border-slate-300 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-750">הפעל והצג טופס רישום / תשלום מחובר CRM בעמוד זה</span>
                </label>
                <p className="text-[10px] text-muted-foreground mt-1">
                  הפעלת אפשרות זו תוסיף אזור טופס בתחתית העמוד. תוכל להוסיף שדות, למפותם ל-CRM ולבחור סוג טופס (פנייה רגילה או תשלום אשראי/ביט) בחלק התחתון של העמוד.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className={`relative pt-20 pb-32 overflow-hidden ${activeTheme.bg} ${activeTheme.text} min-h-[60vh] flex items-center`}>
          <div className="absolute inset-0 z-0">
            {content.hero?.imageSrc && content.hero.imageSrc !== "/placeholder.png" && (
              <>
                {heroLayout === "center" ? (
                  <>
                    <img 
                      src={content.hero.imageSrc} 
                      alt={content.hero.title || "רקע"} 
                      className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                    />
                    <div className={`absolute inset-0 ${activeTheme.bg}/80 mix-blend-multiply`} />
                  </>
                ) : (
                  <>
                    <img 
                      src={content.hero.imageSrc} 
                      alt="Glow" 
                      className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-110"
                    />
                  </>
                )}
              </>
            )}
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-pattern opacity-10 bg-repeat bg-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          </div>
          
          <div className={`max-w-7xl mx-auto px-6 relative z-10 w-full ${heroLayout === "center" ? "text-center" : "text-right"}`}>
            {heroLayout === "center" && (
              isEditing ? (
                <div className="space-y-6 max-w-3xl mx-auto text-center">
                  <input
                    value={content.hero?.subtitle || ""}
                    onChange={(e) => handleHeroChange("subtitle", e.target.value)}
                    className={`w-full text-xl md:text-2xl font-medium ${activeTheme.accent} bg-white/10 border-b border-white/20 outline-none text-center rounded px-2 py-1`}
                    placeholder="כותרת משנה"
                  />
                  <input
                    value={content.hero?.title || ""}
                    onChange={(e) => handleHeroChange("title", e.target.value)}
                    className="w-full text-4xl md:text-7xl font-black bg-white/10 border-b border-white/20 outline-none text-center rounded px-2 py-1 text-white"
                    placeholder="כותרת ראשית"
                  />
                  <textarea
                    value={content.hero?.description || ""}
                    onChange={(e) => handleHeroChange("description", e.target.value)}
                    className="w-full text-lg md:text-2xl text-white/95 bg-white/10 border border-white/20 outline-none text-center rounded-lg p-4 min-h-[120px] focus:border-white/40"
                    placeholder="תיאור העמוד"
                  />
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                  <h2 className={`text-xl md:text-2xl font-medium ${activeTheme.accent} animate-fade-in`}>
                    {content.hero?.subtitle}
                  </h2>
                  <h1 className="text-4xl md:text-7xl font-black tracking-tight animate-fade-in animation-delay-200">
                    {content.hero?.title}
                  </h1>
                  <p className="text-lg md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto animate-fade-in animation-delay-300">
                    {content.hero?.description}
                  </p>
                </div>
              )
            )}

            {heroLayout === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-right w-full">
                <div className="lg:col-span-7 space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        value={content.hero?.subtitle || ""}
                        onChange={(e) => handleHeroChange("subtitle", e.target.value)}
                        className={`w-full text-lg font-medium ${activeTheme.accent} bg-white/10 border-b border-white/20 outline-none rounded px-2 py-1`}
                        placeholder="כותרת משנה"
                      />
                      <input
                        value={content.hero?.title || ""}
                        onChange={(e) => handleHeroChange("title", e.target.value)}
                        className="w-full text-3xl md:text-5xl font-black bg-white/10 border-b border-white/20 outline-none text-white rounded px-2 py-1"
                        placeholder="כותרת ראשית"
                      />
                      <textarea
                        value={content.hero?.description || ""}
                        onChange={(e) => handleHeroChange("description", e.target.value)}
                        className="w-full text-base text-white/90 bg-white/10 border border-white/20 outline-none rounded-lg p-3 min-h-[100px] focus:border-white/40"
                        placeholder="תיאור העמוד"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h2 className={`text-xl font-bold ${activeTheme.accent} animate-fade-in`}>
                        {content.hero?.subtitle}
                      </h2>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white animate-fade-in animation-delay-200">
                        {content.hero?.title}
                      </h1>
                      <p className="text-lg text-white/90 leading-relaxed animate-fade-in animation-delay-300">
                        {content.hero?.description}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-[450px] aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl bg-white/5 backdrop-blur-md p-3 group hover:scale-102 transition-all duration-500">
                    <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden">
                      <img 
                        src={content.hero?.imageSrc || "/placeholder.png"} 
                        alt={content.hero?.title || "שירות"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {heroLayout === "half-bleed" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-right w-full">
                <div className="lg:col-span-6 space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        value={content.hero?.subtitle || ""}
                        onChange={(e) => handleHeroChange("subtitle", e.target.value)}
                        className={`w-full text-lg font-medium ${activeTheme.accent} bg-white/10 border-b border-white/20 outline-none rounded px-2 py-1`}
                        placeholder="כותרת משנה"
                      />
                      <input
                        value={content.hero?.title || ""}
                        onChange={(e) => handleHeroChange("title", e.target.value)}
                        className="w-full text-3xl md:text-5xl font-black bg-white/10 border-b border-white/20 outline-none text-white rounded px-2 py-1"
                        placeholder="כותרת ראשית"
                      />
                      <textarea
                        value={content.hero?.description || ""}
                        onChange={(e) => handleHeroChange("description", e.target.value)}
                        className="w-full text-base text-white/90 bg-white/10 border border-white/20 outline-none rounded-lg p-3 min-h-[100px] focus:border-white/40"
                        placeholder="תיאור העמוד"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h2 className={`text-xl font-bold ${activeTheme.accent} animate-fade-in`}>
                        {content.hero?.subtitle}
                      </h2>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white animate-fade-in animation-delay-200">
                        {content.hero?.title}
                      </h1>
                      <p className="text-lg text-white/90 leading-relaxed animate-fade-in animation-delay-300">
                        {content.hero?.description}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="lg:col-span-6 relative w-full aspect-[16/9] lg:aspect-square rounded-[3rem] overflow-hidden border border-white/20 shadow-2xl group">
                  <img 
                    src={content.hero?.imageSrc || "/placeholder.png"} 
                    alt={content.hero?.title || "רקע"}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-950/40 lg:via-transparent lg:to-transparent" />
                </div>
              </div>
            )}

            {/* Layout selector and Background generator (always visible in Edit Mode at the bottom of Hero) */}
            {isEditing && (
              <div className="space-y-6 mt-12 w-full max-w-4xl mx-auto">
                {/* Layout Theme Selector */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6 text-right" dir="rtl">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                    ערכת עיצוב ופריסת העמוד (Layouts)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hero Layout Options */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-white">מבנה אזור ההירו (Hero Layout)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "center", label: "מרכז קלאסי" },
                          { id: "split", label: "כרטיס מפוצל" },
                          { id: "half-bleed", label: "חצי פריסה" }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleLayoutChange("hero", opt.id)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                              heroLayout === opt.id
                                ? "bg-secondary border-secondary text-white shadow-lg animate-pulse"
                                : "bg-primary/20 border-white/20 text-primary-foreground hover:bg-primary/30"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Content Layout Options */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-white">מבנה אזור התוכן (Content Layout)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "center", label: "קלאסי ממורכז" },
                          { id: "two-column", label: "כתבה עיתונאית" },
                          { id: "grid", label: "כרטיסיות מודרניות" }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleLayoutChange("content", opt.id)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                              contentLayout === opt.id
                                ? "bg-secondary border-secondary text-white shadow-lg animate-pulse"
                                : "bg-primary/20 border-white/20 text-primary-foreground hover:bg-primary/30"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background upload & AI Generation */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6 text-right" dir="rtl">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <ImageIcon className="w-5 h-5 text-secondary" />
                    רקע ההירו (תמונה מהמכשיר או גלריה)
                  </h4>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <ImageUpload 
                        currentImage={content.hero?.imageSrc}
                        onSelect={(url) => handleHeroChange("imageSrc", url)}
                      />
                    </div>
                    
                    {/* Banna Pro Image Generator */}
                    <div className="flex-1 w-full border-t md:border-t-0 md:border-r border-white/10 pt-6 md:pt-0 md:pr-6 space-y-4 text-right">
                      <h5 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                        מחולל תמונות Google AI (Banna Pro)
                      </h5>
                      <p className="text-xs text-primary-foreground/75 leading-relaxed">
                        צור תמונת רקע ייחודית ומרהיבה המותאמת בדיוק לשירות שלך באמצעות בינה מלאכותית.
                      </p>
                      
                      <div className="space-y-3">
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="תאר את התמונה שברצונך ליצור..."
                          className="w-full text-sm bg-primary/30 border border-white/20 rounded-xl p-3 outline-none text-white focus:border-secondary min-h-[80px] resize-none"
                        />
                        
                        {aiError && (
                          <p className="text-xs font-medium text-red-300 bg-red-950/40 p-2 rounded-lg border border-red-500/20">
                            {aiError}
                          </p>
                        )}
                        
                        <Button
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={generatingImage || !aiPrompt}
                          className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl gap-2 font-bold text-sm shadow-lg shadow-purple-950/50"
                        >
                          {generatingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              מייצר תמונה...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              ייצר תמונת רקע
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <section className="py-24 bg-white relative z-20">
          <div className="max-w-5xl mx-auto px-6">
            <>
              {contentLayout === "center" && (
                <div className="space-y-6 text-center">
                  {isEditing ? (
                    <div className="max-w-3xl mx-auto space-y-4">
                      <label className="block text-sm font-bold text-slate-700 text-right">כותרת התוכן (קלאסי ממורכז)</label>
                      <input
                        value={content.content?.heading || ""}
                        onChange={(e) => handleContentChange("heading", e.target.value)}
                        className="w-full text-center text-2xl font-bold text-primary bg-muted/30 outline-none rounded-xl p-3 border focus:border-primary"
                        placeholder="כותרת תוכן"
                      />
                      <label className="block text-sm font-bold text-slate-700 text-right">גוף התוכן</label>
                      <RichTextEditor
                        value={content.content?.body || ""}
                        onChange={(val) => handleContentChange("body", val)}
                        className="text-center"
                        placeholder="תוכן מרכזי..."
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                        {content.content?.heading}
                      </h2>
                      <div 
                        className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto rich-content"
                        dangerouslySetInnerHTML={{ __html: content.content?.body || "" }}
                      />
                    </>
                  )}
                </div>
              )}

              {contentLayout === "two-column" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-right items-start" dir="rtl">
                  <div className="lg:col-span-4 border-r-4 border-secondary pr-6 flex flex-col justify-center py-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">כותרת התוכן (טור ימני)</label>
                        <input
                          value={content.content?.heading || ""}
                          onChange={(e) => handleContentChange("heading", e.target.value)}
                          className="w-full text-2xl md:text-3xl font-black text-primary bg-muted/30 outline-none rounded-xl p-3 border focus:border-primary"
                          placeholder="כותרת תוכן"
                        />
                      </div>
                    ) : (
                      <h3 className="text-2xl md:text-3xl font-black text-primary leading-tight">
                        {content.content?.heading}
                      </h3>
                    )}
                    <div className="w-12 h-1 bg-secondary mt-4 animate-pulse" />
                  </div>
                  <div className="lg:col-span-8">
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">גוף התוכן (טור שמאלי)</label>
                        <RichTextEditor
                          value={content.content?.body || ""}
                          onChange={(val) => handleContentChange("body", val)}
                          placeholder="תוכן מרכזי..."
                        />
                      </div>
                    ) : (
                      <div 
                        className="text-lg text-muted-foreground leading-relaxed rich-content"
                        dangerouslySetInnerHTML={{ __html: content.content?.body || "" }}
                      />
                    )}
                  </div>
                </div>
              )}

              {contentLayout === "grid" && (
                <div className="space-y-12" dir="rtl">
                  {isEditing ? (
                    <div className="max-w-3xl mx-auto space-y-2">
                      <label className="block text-sm font-bold text-slate-700 text-center">כותרת התוכן (כרטיסיות)</label>
                      <input
                        value={content.content?.heading || ""}
                        onChange={(e) => handleContentChange("heading", e.target.value)}
                        className="w-full text-center text-3xl md:text-4xl font-black text-primary bg-muted/30 outline-none rounded-xl p-3 border focus:border-primary"
                        placeholder="כותרת תוכן"
                      />
                    </div>
                  ) : (
                    <h2 className="text-3xl md:text-4xl font-black text-primary text-center">
                      {content.content?.heading}
                    </h2>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {isEditing ? (
                      <>
                        {((content.content?.body || "").split(/\n\n+/))
                          .map((paragraph: string, idx: number, arr: string[]) => (
                            <div 
                              key={idx} 
                              className="bg-muted/20 p-8 rounded-[2rem] border border-primary/5 shadow-sm space-y-4 text-right animate-in fade-in duration-300"
                            >
                              <div className="flex justify-between items-center">
                                <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm">
                                  {idx + 1}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newParagraphs = arr.filter((_, i) => i !== idx);
                                    handleContentChange("body", newParagraphs.join("\n\n"));
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                  מחק כרטיס
                                </button>
                              </div>
                              <RichTextEditor
                                value={paragraph}
                                onChange={(val) => {
                                  const newParagraphs = [...arr];
                                  newParagraphs[idx] = val;
                                  handleContentChange("body", newParagraphs.join("\n\n"));
                                }}
                                className="min-h-[140px]"
                                placeholder="תוכן הכרטיס..."
                              />
                            </div>
                          ))}
                        <button
                          type="button"
                          onClick={() => {
                            const paragraphs = (content.content?.body || "").split(/\n\n+/);
                            const newParagraphs = [...paragraphs.filter((p: string) => p.trim().length > 0), ""];
                            handleContentChange("body", newParagraphs.join("\n\n"));
                          }}
                          className="border-2 border-dashed border-slate-300 hover:border-primary rounded-[2rem] p-8 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary transition-colors min-h-[200px]"
                        >
                          <Sparkles className="w-8 h-8 text-secondary animate-pulse" />
                          <span className="font-bold text-sm">הוסף כרטיס חדש</span>
                        </button>
                      </>
                    ) : (
                      (content.content?.body || "")
                        .split(/\n\n+/)
                        .filter((p: string) => p.trim().length > 0)
                        .map((paragraph: string, idx: number) => (
                          <div 
                            key={idx} 
                            className="bg-muted/20 hover:bg-muted/40 p-8 rounded-[2rem] border border-primary/5 hover:border-secondary/20 shadow-sm hover:shadow-md transition-all duration-300 text-right space-y-4"
                          >
                            <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm">
                              {idx + 1}
                            </div>
                            <div 
                              className="text-base text-muted-foreground leading-relaxed rich-content"
                              dangerouslySetInnerHTML={{ __html: paragraph }}
                            />
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(content.features || []).map((feature: any, index: number) => {
                const IconComponent = IconMap[feature.iconName] || Star;
                return (
                  <div key={index} className="bg-white p-8 rounded-[2rem] border shadow-sm hover:shadow-xl hover:scale-103 transition-all duration-500 group flex flex-col justify-between">
                    <div>
                      <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:${activeTheme.iconBg} transition-all duration-300`}>
                        <IconComponent className={`h-7 w-7 text-slate-700 group-hover:${activeTheme.iconText} transition-all duration-300`} />
                      </div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <input 
                            value={feature.title} 
                            onChange={(e) => handleFeatureChange(index, "title", e.target.value)}
                            className="w-full text-xl font-bold text-primary bg-muted/30 rounded px-2 py-1 outline-none"
                          />
                          <textarea 
                            value={feature.desc} 
                            onChange={(e) => handleFeatureChange(index, "desc", e.target.value)}
                            className="w-full text-muted-foreground text-sm leading-relaxed bg-muted/30 rounded p-2 min-h-[70px] outline-none"
                          />
                          
                          {/* Interactive Icon Picker */}
                          <div className="pt-2 border-t border-dashed">
                            <label className="block text-xs font-bold text-slate-500 mb-2 text-right">בחר אייקון:</label>
                            <div className="grid grid-cols-5 gap-1.5 justify-center max-w-[200px] mx-auto bg-slate-50 p-1.5 rounded-xl border">
                              {Object.keys(IconMap).map((iconName) => {
                                const IconBtn = IconMap[iconName];
                                const isSelected = feature.iconName === iconName;
                                return (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => handleFeatureChange(index, "iconName", iconName)}
                                    className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                                      isSelected 
                                        ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-sm" 
                                        : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600"
                                    }`}
                                    title={iconName}
                                  >
                                    <IconBtn className="w-3.5 h-3.5" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dynamic CRM integrated Form section */}
        {(isEditing || content.form?.enabled) && (
          <section className="py-24 bg-white border-t border-slate-100 relative z-25">
            <div className="max-w-4xl mx-auto px-6">
              {isEditing ? (
                <div className="relative group max-w-xl mx-auto">
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/60 backdrop-blur-[2px] rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button onClick={() => setIsFormBuilderOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 shadow-xl flex items-center gap-2 font-bold text-sm">
                      <Settings2 className="w-4 h-4" />
                      ערוך הגדרות טופס
                    </Button>
                  </div>
                  <Modal isOpen={isFormBuilderOpen} onClose={() => setIsFormBuilderOpen(false)}>
                    <Modal.Content className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none">
                      <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl relative border border-slate-100">
                        <Modal.Close className="top-6 right-6 text-slate-400 hover:text-slate-700" />
                        <div className="mb-4 text-slate-800 font-black text-xl border-b pb-4 pl-8">הגדרות טופס סנכרון CRM ועריכת שדות לעמוד זה:</div>
                        <CRMFormBuilder
                          value={content.form || DEFAULT_FORM_CONFIG}
                          onChange={(formConfig) => setContent({ ...content, form: formConfig })}
                        />
                      </div>
                    </Modal.Content>
                  </Modal>

                  <div className="opacity-90 blur-[1px] group-hover:blur-sm transition-all pointer-events-none flex flex-col items-center justify-center space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-2.5">
                      <h3 className="text-2xl font-black text-slate-800 leading-tight">
                        {content.form?.form_type === "payment" ? "טופס הרשמה ותשלום מהיר" : "צור קשר והרשמה מהירה"}
                      </h3>
                      <p className="text-xs text-muted-foreground">אנא מלא את השדות הבאים וניצור איתך קשר בהקדם.</p>
                    </div>
                    <CRMFormRenderer
                      config={content.form || DEFAULT_FORM_CONFIG}
                      formId={slug}
                      formTitle={content.hero?.title || slug}
                    />
                  </div>
                </div>
              ) : (
                content.form?.enabled && (
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-2.5">
                      <h3 className="text-2xl font-black text-slate-800 leading-tight">
                        {content.form.form_type === "payment" ? "טופס הרשמה ותשלום מהיר" : "צור קשר והרשמה מהירה"}
                      </h3>
                      <p className="text-xs text-muted-foreground">אנא מלא את השדות הבאים וניצור איתך קשר בהקדם.</p>
                    </div>
                    <CRMFormRenderer
                      config={content.form}
                      formId={slug}
                      formTitle={content.hero?.title || slug}
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
