"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Edit3, Save, X, Star, Heart, Shield, Zap, Book, Calendar, ShieldCheck, 
  Users, Globe, Loader2, Wand2, Sparkles, Image as ImageIcon, Gift, MapPin, 
  Flame, GraduationCap, Coins, FileText, Quote, Settings2
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

const IconMap: Record<string, any> = {
  Star, Heart, Shield, Zap, Book, Calendar, ShieldCheck, Users, Globe, Gift, MapPin, Flame, GraduationCap, Coins
};

const themePresets: Record<string, { bg: string; text: string; accent: string; accentHover: string; iconBg: string; iconText: string; cardBg: string; btnColor: string; }> = {
  navy: {
    bg: "bg-slate-900",
    text: "text-slate-100",
    accent: "text-amber-500",
    accentHover: "group-hover:text-amber-500",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500",
    cardBg: "bg-slate-800/80 border-slate-700/50",
    btnColor: "bg-amber-500 hover:bg-amber-600 text-slate-950"
  },
  emerald: {
    bg: "bg-emerald-950",
    text: "text-emerald-50",
    accent: "text-yellow-400",
    accentHover: "group-hover:text-yellow-400",
    iconBg: "bg-yellow-400/10",
    iconText: "text-yellow-400",
    cardBg: "bg-emerald-900/60 border-emerald-800/50",
    btnColor: "bg-yellow-400 hover:bg-yellow-500 text-emerald-950"
  },
  rose: {
    bg: "bg-rose-950",
    text: "text-rose-50",
    accent: "text-rose-300",
    accentHover: "group-hover:text-rose-300",
    iconBg: "bg-rose-300/10",
    iconText: "text-rose-300",
    cardBg: "bg-rose-900/60 border-rose-800/50",
    btnColor: "bg-rose-400 hover:bg-rose-500 text-slate-950"
  },
  violet: {
    bg: "bg-violet-950",
    text: "text-violet-50",
    accent: "text-amber-300",
    accentHover: "group-hover:text-amber-300",
    iconBg: "bg-amber-300/10",
    iconText: "text-amber-300",
    cardBg: "bg-violet-900/60 border-violet-800/50",
    btnColor: "bg-amber-400 hover:bg-amber-500 text-violet-950"
  },
  charcoal: {
    bg: "bg-zinc-950",
    text: "text-zinc-100",
    accent: "text-teal-400",
    accentHover: "group-hover:text-teal-400",
    iconBg: "bg-teal-400/10",
    iconText: "text-teal-400",
    cardBg: "bg-zinc-900/80 border-zinc-800/50",
    btnColor: "bg-teal-450 hover:bg-teal-500 text-zinc-950"
  }
};

export function LandingPageClient({ initialData, slug }: { initialData: any, slug: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialData);
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiError, setAiError] = useState("");

  // Dynamic form integration states

  useEffect(() => {
    if (content.hero?.title && !aiPrompt) {
      setAiPrompt(`Professional high quality photography of ${content.hero.title}, warm Jewish Chabad house vibe, inviting HDR image`);
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

  const handleSave = async () => {
    try {
      const cleanContent = JSON.parse(JSON.stringify(content));
      const res = await saveServicePage(slug, cleanContent);
      if (res.success) {
        setIsEditing(false);
      } else {
        alert("שגיאה בשמירה: " + res.error);
      }
    } catch (e) {
      console.error("Failed to save landing page", e);
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

  const handleTestimonialChange = (field: string, value: string) => {
    setContent({ ...content, testimonial: { ...content.testimonial, [field]: value } });
  };

  const handleBenefitChange = (index: number, field: string, value: string) => {
    const newBenefits = [...(content.features || [])];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setContent({ ...content, features: newBenefits });
  };

  const activeTheme = themePresets[content.theme || "navy"] || themePresets.navy;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* Admin Floating Control Dashboard */}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2.5">
        {isEditing ? (
          <>
            <Button 
              variant="primary" 
              size="lg" 
              className="rounded-full shadow-2xl bg-green-600 hover:bg-green-700 h-14 w-14 p-0 text-white flex items-center justify-center transition-all duration-300 scale-110"
              onClick={handleSave}
              title="שמור שינויים"
            >
              <Save className="w-6 h-6" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full shadow-2xl bg-white hover:bg-slate-100 text-slate-700 h-14 w-14 p-0 border flex items-center justify-center transition-all duration-300"
              onClick={() => {
                setContent(initialData);
                setIsEditing(false);
              }}
              title="ביטול שינויים"
            >
              <X className="w-6 h-6" />
            </Button>
          </>
        ) : (
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white h-14 w-14 p-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
            onClick={() => setIsEditing(true)}
            title="ערוך דף נחיתה"
          >
            <Edit3 className="w-6 h-6" />
          </Button>
        )}
      </div>

      <main className="flex-grow pt-20">
        {/* SEO & Theme Design Panel */}
        {isEditing && (
          <div className="max-w-7xl mx-auto px-6 py-8 bg-white border border-slate-100 rounded-[2.5rem] mt-6 mb-8 text-right grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-md" dir="rtl">
            {/* SEO Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-indigo-600" />
                קידום אתרים (SEO)
              </h3>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">כותרת הדף בדפדפן (Title)</label>
                <input 
                  value={content.seo?.title || ""} 
                  onChange={(e) => handleSeoChange("title", e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">תיאור הדף במנועי חיפוש (Description)</label>
                <textarea 
                  value={content.seo?.description || ""} 
                  onChange={(e) => handleSeoChange("description", e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white transition-all min-h-[90px]"
                />
              </div>
            </div>

            {/* Design & Theme Selector */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                צבעי מותג ועיצוב דף הנחיתה
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                בחר את פלטת הצבעים המאפיינת דף נחיתה זה. הצבעים ישתלבו אוטומטית בכפתורים, באנר ובכרטיסיות:
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
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-right transition-all duration-300 ${
                        isSelected 
                          ? "border-indigo-600 bg-white shadow-md ring-2 ring-indigo-500/10 scale-102 font-bold" 
                          : "border-slate-100 bg-slate-50 hover:bg-white"
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
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className={`relative pt-24 pb-36 overflow-hidden ${activeTheme.bg} ${activeTheme.text} min-h-[65vh] flex items-center`}>
          <div className="absolute inset-0 z-0">
            {content.hero?.imageSrc && content.hero.imageSrc !== "/placeholder.png" && (
              <>
                <img 
                  src={content.hero.imageSrc} 
                  alt={content.hero.title || "רקע"} 
                  className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                />
                <div className={`absolute inset-0 ${activeTheme.bg}/85 mix-blend-multiply`} />
              </>
            )}
            <div className="absolute inset-0 bg-pattern opacity-10 bg-repeat bg-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          </div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full text-right" dir="rtl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Text Description Info */}
              <div className="lg:col-span-7 space-y-6">
                {isEditing ? (
                  <div className="space-y-4 bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                    <span className="text-xs uppercase tracking-wider font-bold text-white/50 block">כותרת משנה</span>
                    <input
                      value={content.hero?.subtitle || ""}
                      onChange={(e) => handleHeroChange("subtitle", e.target.value)}
                      className={`w-full text-lg font-bold ${activeTheme.accent} bg-white/15 outline-none rounded-xl px-4 py-2 border border-white/10`}
                      placeholder="כותרת משנה שיווקית"
                    />
                    <span className="text-xs uppercase tracking-wider font-bold text-white/50 block">כותרת עמוד ראשית</span>
                    <input
                      value={content.hero?.title || ""}
                      onChange={(e) => handleHeroChange("title", e.target.value)}
                      className="w-full text-3xl font-black bg-white/15 outline-none text-white rounded-xl px-4 py-2 border border-white/10"
                      placeholder="כותרת הנעה לפעולה ממוקדת"
                    />
                    <span className="text-xs uppercase tracking-wider font-bold text-white/50 block">תיאור קצר</span>
                    <textarea
                      value={content.hero?.description || ""}
                      onChange={(e) => handleHeroChange("description", e.target.value)}
                      className="w-full text-sm text-white bg-white/15 outline-none rounded-xl p-4 min-h-[100px] border border-white/10 focus:border-white/30"
                      placeholder="הסבר קצר על המטרה, האירוע או הקמפיין..."
                    />
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <span className={`text-sm sm:text-base font-bold ${activeTheme.accent} tracking-wide border-r-4 border-current pr-3 block`}>
                      {content.hero?.subtitle}
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                      {content.hero?.title}
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-3xl">
                      {content.hero?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Conversion Block (CRM Form Builder / Renderer) */}
              <div className="lg:col-span-5 flex justify-center relative group">
                {isEditing && (
                  <>
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => setIsFormBuilderOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 shadow-xl flex items-center gap-2 font-bold text-sm">
                        <Settings2 className="w-4 h-4" />
                        ערוך הגדרות טופס
                      </Button>
                    </div>
                    <Modal isOpen={isFormBuilderOpen} onClose={() => setIsFormBuilderOpen(false)}>
                      <Modal.Content className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none">
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-4 text-slate-100 relative">
                          <Modal.Close className="top-4 right-4 text-slate-400 hover:text-white" />
                          <CRMFormBuilder
                            value={content.form || { ...DEFAULT_FORM_CONFIG, enabled: true }}
                            onChange={(formConfig) => setContent({ ...content, form: formConfig })}
                          />
                        </div>
                      </Modal.Content>
                    </Modal>
                  </>
                )}
                <div className={`w-full flex justify-center ${isEditing ? "opacity-90 blur-[1px] group-hover:blur-sm transition-all pointer-events-none" : ""}`}>
                  {content.form?.enabled ? (
                    <CRMFormRenderer
                      config={content.form}
                      formId={slug}
                      formTitle={content.hero?.title || slug}
                    />
                  ) : (
                    <div className="bg-slate-800/80 border border-slate-700/50 p-8 rounded-[2.5rem] text-center text-white/50 text-sm max-w-[420px] w-full">
                      הטופס אינו פעיל בעמוד זה.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Background image edit options (inside edit mode at bottom of Hero) */}
            {isEditing && (
              <div className="space-y-6 mt-12 w-full max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6 text-right" dir="rtl">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <ImageIcon className="w-5 h-5 text-secondary" />
                    תמונת הרקע של דף הנחיתה
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
                        מחולל תמונות Google AI (Imagen)
                      </h5>
                      <p className="text-xs text-primary-foreground/75 leading-relaxed">
                        צור תמונת רקע מותאמת אישית לדף הנחיתה באמצעות בינה מלאכותית יוצרת.
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

        {/* Benefits Section */}
        <section className="py-24 bg-white relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${activeTheme.iconBg} ${activeTheme.iconText}`}>
                למה להצטרף?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
                היתרונות והערך המרכזיים
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(content.features || []).map((benefit: any, index: number) => {
                const IconComponent = IconMap[benefit.iconName] || Star;
                return (
                  <div key={index} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex flex-col justify-between text-right" dir="rtl">
                    <div>
                      <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:${activeTheme.iconBg} transition-all duration-300`}>
                        <IconComponent className={`h-7 w-7 text-slate-600 group-hover:${activeTheme.iconText} transition-all duration-300`} />
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-3">
                          <input 
                            value={benefit.title} 
                            onChange={(e) => handleBenefitChange(index, "title", e.target.value)}
                            className="w-full text-lg font-bold text-slate-800 bg-white rounded px-2.5 py-1 border outline-none"
                            placeholder="כותרת היתרון"
                          />
                          <textarea 
                            value={benefit.desc} 
                            onChange={(e) => handleBenefitChange(index, "desc", e.target.value)}
                            className="w-full text-slate-600 text-xs leading-relaxed bg-white rounded p-2.5 min-h-[70px] border outline-none"
                            placeholder="תיאור היתרון"
                          />
                          
                          {/* Interactive Icon Picker */}
                          <div className="pt-2 border-t border-dashed">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5">בחר אייקון:</label>
                            <div className="grid grid-cols-5 gap-1 bg-white p-1.5 rounded-xl border">
                              {Object.keys(IconMap).map((iconName) => {
                                const IconBtn = IconMap[iconName];
                                const isSelected = benefit.iconName === iconName;
                                return (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => handleBenefitChange(index, "iconName", iconName)}
                                    className={`p-1 rounded-lg border transition-all flex items-center justify-center ${
                                      isSelected 
                                        ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-sm" 
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
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
                          <h3 className="text-xl font-bold text-slate-800 mb-3">{benefit.title}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed">{benefit.desc}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content & Details Section */}
        <section className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
              {isEditing ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">כותרת הפירוט הראשי</label>
                  <input
                    value={content.content?.heading || ""}
                    onChange={(e) => handleContentChange("heading", e.target.value)}
                    className="w-full text-xl font-bold text-slate-800 bg-slate-50 rounded-xl p-3 border outline-none focus:bg-white"
                  />
                  <label className="block text-sm font-bold text-slate-700">תוכן הפירוט הראשי</label>
                  <RichTextEditor
                    value={content.content?.body || ""}
                    onChange={(val) => handleContentChange("body", val)}
                    placeholder="הזן כאן את פירוט התוכן..."
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">
                    {content.content?.heading}
                  </h2>
                  <div 
                    className="text-sm sm:text-base text-slate-600 leading-relaxed rich-content"
                    dangerouslySetInnerHTML={{ __html: content.content?.body || "" }}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        {content.testimonial && (
          <section className="py-20 bg-white border-t border-slate-100">
            <div className="max-w-4xl mx-auto px-6 text-center space-y-6" dir="rtl">
              <Quote className="w-10 h-10 text-indigo-200 mx-auto" />
              
              {isEditing ? (
                <div className="space-y-4 max-w-2xl mx-auto bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">ציטוט ממליץ / עדות קהילתית</h4>
                  <textarea
                    value={content.testimonial?.quote || ""}
                    onChange={(e) => handleTestimonialChange("quote", e.target.value)}
                    className="w-full text-sm text-slate-700 bg-white rounded-xl p-3 border outline-none min-h-[80px]"
                    placeholder="טקסט הציטוט..."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={content.testimonial?.author || ""}
                      onChange={(e) => handleTestimonialChange("author", e.target.value)}
                      className="w-full text-xs text-slate-700 bg-white rounded-xl p-2.5 border outline-none"
                      placeholder="שם כותב הציטוט"
                    />
                    <input
                      value={content.testimonial?.authorTitle || ""}
                      onChange={(e) => handleTestimonialChange("authorTitle", e.target.value)}
                      className="w-full text-xs text-slate-700 bg-white rounded-xl p-2.5 border outline-none"
                      placeholder="תפקיד / תואר (למשל חבר קהילה)"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <p className="text-lg sm:text-xl font-medium text-slate-700 leading-relaxed italic">
                    "{content.testimonial?.quote}"
                  </p>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                      {content.testimonial?.author}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {content.testimonial?.authorTitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
