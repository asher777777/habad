"use client";

import { useState, useEffect } from "react";
import { Edit3, Save, X, Sparkles, Image as ImageIcon, Loader2, Wand2, FileText, Settings, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { saveServicePage, generateHeroImageWithAI } from "@/features/services/actions";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { CampRegistrationForm } from "./CampRegistrationForm";
import { CRMFormBuilder, FormConfig } from "@/features/crm/components/CRMFormBuilder";
import { CRMFormRenderer } from "@/features/crm/components/CRMFormRenderer";
import { Modal } from "@/components/ui/Modal";

const defaultCampFormConfig: FormConfig = {
  enabled: false,
  form_type: "payment",
  submit_button_text: "מעבר לתשלום המאובטח ←",
  submit_button_bg_color: "#fb923c",
  submit_button_text_color: "#ffffff",
  save_to_crm: true,
  crm_owner_id: "1",
  standard_success_message: "",
  standard_redirect_url: "",
  standard_whatsapp_message: "",
  standard_whatsapp_image_url: "",
  payment_amount: 980,
  payment_amount_crm_map: "payment_amount",
  payment_pending_message: "שלום {שם האם}, רשמנו את {שם פרטי של הילד} לקייטנה בהצלחה, ממתינים לתשלום...",
  payment_pending_image_url: "",
  payment_success_message: "התשלום עבר בהצלחה! נתראה בקייטנה.",
  payment_success_image_url: "",
  payment_group: "",
  payment_zeut_kupa: "",
  payment_receipt_type: "405",
  payment_frequency: "one-time",
  fields: [
    { label: "שם פרטי של הילד", type: "text", map_to: "child_first_name", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 1 },
    { label: "שם משפחה", type: "text", map_to: "child_last_name", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 1 },
    { label: "תעודת זהות", type: "text", map_to: "child_id_number", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 1 },
    { label: "עולה לכיתה", type: "select", map_to: "child_grade", required: true, default_value: "", options: "א\nב\nג\nד\nה\nו", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 1 },
    { label: "מגדר", type: "select", map_to: "gender", required: true, default_value: "", options: "בן\nבת", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 1 },
    { label: "קיימת רגישות כלשהי?", type: "select", map_to: "allergies_has", required: true, default_value: "", options: "לא\nכן", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 1 },
    { label: "פרט את הרגישות", type: "textarea", map_to: "allergies_details", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: true, cond_field_index: 5, cond_operator: "is", cond_value: "כן", step: 1 },
    { label: "שם האם", type: "text", map_to: "mother_name", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 2 },
    { label: "טלפון האם", type: "tel", map_to: "mother_phone", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 2 },
    { label: "שם האב", type: "text", map_to: "father_name", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 2 },
    { label: "טלפון האב", type: "tel", map_to: "father_phone", required: true, default_value: "", options: "", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 2 },
    { label: "בחירת מסלול קייטנה", type: "select", map_to: "payment_amount", required: true, default_value: "", options: "980 - מסלול בוקר (עד 13:00)\n1800 - מסלול צהרון (עד 16:00 כולל ארוחה חמה)", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 3 },
    { label: "אמצעי תשלום", type: "select", map_to: "", required: true, default_value: "", options: "אשראי באתר (תשלום מאובטח)\nמזומן / העברה בנקאית (מול המשרד)", url_param_enable: false, url_param_name: "", cond_enable: false, cond_field_index: 0, cond_operator: "is", cond_value: "", step: 3 }
  ]
};

const themePresets: Record<string, { bgPrimary: string; bgSecondary: string; textHighlight: string; btnBg: string; btnHover: string; abstractShape1: string; abstractShape2: string }> = {
  sky: {
    bgPrimary: "from-sky-100",
    bgSecondary: "to-amber-50",
    textHighlight: "text-orange-500",
    btnBg: "bg-orange-500",
    btnHover: "hover:bg-orange-600",
    abstractShape1: "bg-yellow-300",
    abstractShape2: "bg-orange-400"
  },
  emerald: {
    bgPrimary: "from-emerald-100",
    bgSecondary: "to-teal-50",
    textHighlight: "text-emerald-600",
    btnBg: "bg-emerald-600",
    btnHover: "hover:bg-emerald-700",
    abstractShape1: "bg-teal-300",
    abstractShape2: "bg-emerald-400"
  },
  indigo: {
    bgPrimary: "from-indigo-100",
    bgSecondary: "to-purple-50",
    textHighlight: "text-purple-600",
    btnBg: "bg-indigo-600",
    btnHover: "hover:bg-indigo-700",
    abstractShape1: "bg-purple-300",
    abstractShape2: "bg-indigo-400"
  }
};

import { useSearchParams } from "next/navigation";

export function CampRegistrationClient({ initialData, isAdmin }: { initialData: any, isAdmin?: boolean }) {
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(isAdmin && searchParams.get("edit") === "true");
  const [content, setContent] = useState(initialData);
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiError, setAiError] = useState("");

  const activeTheme = themePresets[content.theme || "sky"] || themePresets.sky;

  useEffect(() => {
    if (content.hero?.title && !aiPrompt) {
      setAiPrompt(`Professional high quality photography of ${content.hero.title} for a Jewish Chabad summer camp, kids having fun, summer vibe`);
    }
  }, [content.hero?.title, isEditing]);

  const handleSave = async () => {
    try {
      const cleanContent = JSON.parse(JSON.stringify(content));
      const res = await saveServicePage("camp-registration", cleanContent);
      if (res.success) {
        setIsEditing(false);
      } else {
        alert("שגיאה בשמירה: " + res.error);
      }
    } catch (e) {
      console.error("Failed to save camp page", e);
      alert("שגיאה בשמירה ל-Firebase.");
    }
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt) return;
    setGeneratingImage(true);
    setAiError("");
    try {
      const res = await generateHeroImageWithAI(aiPrompt);
      if (res.success && res.url) {
        setContent({ ...content, hero: { ...content.hero, imageSrc: res.url } });
      } else {
        setAiError(res.error || "שגיאה ביצירת התמונה.");
      }
    } catch (e: any) {
      setAiError(e.message || "שגיאה בתקשורת עם השרת.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleHeroChange = (field: string, value: string) => {
    setContent({ ...content, hero: { ...content.hero, [field]: value } });
  };
  const handleInfoChange = (field: string, value: string) => {
    setContent({ ...content, info: { ...content.info, [field]: value } });
  };
  const handleSeoChange = (field: string, value: string) => {
    setContent({ ...content, seo: { ...content.seo, [field]: value } });
  };
  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...(content.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${activeTheme.bgPrimary} ${activeTheme.bgSecondary} font-sans`} dir="rtl">
      
      {/* Admin Floating Control Dashboard */}
      {isAdmin && (
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
      )}

      {isEditing && (
        <div className="max-w-5xl mx-auto px-6 py-8 mt-24 mb-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-[2.5rem] shadow-xl text-right z-50 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-indigo-600" />
                קידום אתרים (SEO)
              </h3>
              <div>
                <label className="block text-sm font-semibold mb-1">כותרת הדף בדפדפן</label>
                <input 
                  value={content.seo?.title || ""} 
                  onChange={(e) => handleSeoChange("title", e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">תיאור הדף במנועי חיפוש</label>
                <textarea 
                  value={content.seo?.description || ""} 
                  onChange={(e) => handleSeoChange("description", e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white min-h-[90px]"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                בחירת ערכת נושא
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(themePresets).map((presetKey) => {
                  const isSelected = (content.theme || "sky") === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => setContent({ ...content, theme: presetKey })}
                      className={`flex items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected ? "border-indigo-600 bg-indigo-50 font-bold" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      {presetKey === "sky" && "תכלת קיצי (חב\"ד)"}
                      {presetKey === "emerald" && "ירוק טבע"}
                      {presetKey === "indigo" && "סגול יוקרתי"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className={`pt-20 pb-12 px-4 text-center relative overflow-visible ${!isEditing ? "mt-0" : "mt-0"} z-[100]`}>
        {/* Background Layer */}
        {content.hero?.imageSrc ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img src={content.hero.imageSrc} className="w-full h-full object-cover opacity-30" alt="Hero" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${activeTheme.abstractShape1} rounded-full blur-3xl opacity-30 z-0`}></div>
            <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 ${activeTheme.abstractShape2} rounded-full blur-3xl opacity-20 z-0`}></div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto relative z-50">
          {isEditing ? (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200 space-y-4 text-right mb-8 shadow-sm">
              <h4 className="font-bold flex items-center gap-2 border-b pb-2"><Settings className="w-4 h-4"/> עריכת כותרות Hero</h4>
              <input
                value={content.hero?.subtitle || ""}
                onChange={(e) => handleHeroChange("subtitle", e.target.value)}
                className="w-full p-2 border rounded-xl text-sm font-bold bg-sky-50 text-sky-800"
                placeholder="תגית (לדוג' בית חב״ד אזור)"
              />
              <div className="flex gap-2">
                <input
                  value={content.hero?.title || ""}
                  onChange={(e) => handleHeroChange("title", e.target.value)}
                  className="w-2/3 p-3 border rounded-xl font-black text-2xl"
                  placeholder="כותרת ראשית (קייטנת חב״ד אזור)"
                />
                <input
                  value={content.hero?.highlight || ""}
                  onChange={(e) => handleHeroChange("highlight", e.target.value)}
                  className="w-1/3 p-3 border rounded-xl font-black text-2xl text-orange-500"
                  placeholder="הדגשה (מסורת של חוויה!)"
                />
              </div>
              <textarea
                value={content.hero?.description || ""}
                onChange={(e) => handleHeroChange("description", e.target.value)}
                className="w-full p-3 border rounded-xl mt-2 min-h-[80px]"
                placeholder="תיאור קצר..."
              />

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  תמונת רקע (אופציונלי)
                </h4>
                <div className="flex flex-col md:flex-row gap-6">
                  <ImageUpload 
                    currentImage={content.hero?.imageSrc}
                    onSelect={(url) => handleHeroChange("imageSrc", url)}
                  />
                  <div className="flex-1 space-y-3 bg-slate-50 p-4 rounded-2xl border">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" /> מחולל AI
                    </h5>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border outline-none min-h-[60px]"
                      placeholder="תאר את התמונה..."
                    />
                    {aiError && <p className="text-[10px] text-red-500">{aiError}</p>}
                    <Button onClick={handleGenerateImage} disabled={generatingImage || !aiPrompt} className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                      {generatingImage ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Wand2 className="w-3 h-3 mr-1"/> יצר תמונה</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="inline-block px-4 py-1.5 bg-white/70 text-slate-800 rounded-full text-sm font-bold mb-6 shadow-sm backdrop-blur-sm border border-white/50">
                {content.hero?.subtitle}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-6 tracking-tight leading-tight drop-shadow-sm">
                {content.hero?.title} <br />
                <span className={`${activeTheme.textHighlight}`}>{content.hero?.highlight}</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-700 font-medium max-w-2xl mx-auto mb-10 leading-relaxed bg-white/40 px-4 py-2 rounded-2xl backdrop-blur-sm">
                {content.hero?.description}
              </p>
              
              <a href="#register" className={`inline-block px-10 py-5 ${activeTheme.btnBg} ${activeTheme.btnHover} text-white font-bold text-xl rounded-full shadow-lg transition-all hover:-translate-y-1`}>
                להרשמה מהירה לקייטנה
              </a>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {(content.features || []).map((feature: any, idx: number) => (
            <div key={idx} className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white text-center hover:-translate-y-2 transition-transform duration-300 relative group">
              {isEditing ? (
                <div className="space-y-3 text-right">
                  <input value={feature.icon} onChange={(e) => handleFeatureChange(idx, "icon", e.target.value)} className="w-16 h-16 text-center text-3xl mx-auto block border rounded-xl" placeholder="אימוג'י"/>
                  <input value={feature.title} onChange={(e) => handleFeatureChange(idx, "title", e.target.value)} className="w-full text-xl font-bold border-b text-center pb-1" placeholder="כותרת"/>
                  <textarea value={feature.desc} onChange={(e) => handleFeatureChange(idx, "desc", e.target.value)} className="w-full text-sm text-center border rounded-lg p-2 min-h-[80px]" placeholder="תיאור"/>
                </div>
              ) : (
                <>
                  <div className={`w-20 h-20 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-5xl mb-6 shadow-inner ${idx%2===0?'rotate-3':'-rotate-3'}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Info Table / Dates */}
      <section className="py-8 px-4 relative z-10">
        <div className="max-w-3xl mx-auto bg-slate-800 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 rounded-full blur-3xl opacity-20"></div>
          
          <h2 className="text-3xl font-bold mb-6 text-center">פרטים טכניים ולוח זמנים</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-2xl">
              <span className="text-4xl">🗓️</span>
              <div className="w-full">
                <div className="text-sky-300 font-bold text-sm mb-1">תאריכים</div>
                {isEditing ? (
                  <>
                    <input value={content.info?.dates || ""} onChange={(e) => handleInfoChange("dates", e.target.value)} className="w-full bg-slate-600 rounded px-2 py-1 text-white font-bold mb-1"/>
                    <input value={content.info?.datesDesc || ""} onChange={(e) => handleInfoChange("datesDesc", e.target.value)} className="w-full bg-slate-600 rounded px-2 py-1 text-white text-sm"/>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold">{content.info?.dates}</div>
                    <div className="text-slate-300 text-sm">{content.info?.datesDesc}</div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-2xl">
              <span className="text-4xl">⏰</span>
              <div className="w-full">
                <div className="text-sky-300 font-bold text-sm mb-1">שעות פעילות</div>
                {isEditing ? (
                  <>
                    <input value={content.info?.hours || ""} onChange={(e) => handleInfoChange("hours", e.target.value)} className="w-full bg-slate-600 rounded px-2 py-1 text-white font-bold mb-1"/>
                    <input value={content.info?.hoursDesc || ""} onChange={(e) => handleInfoChange("hoursDesc", e.target.value)} className="w-full bg-slate-600 rounded px-2 py-1 text-white text-sm"/>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold">{content.info?.hours}</div>
                    <div className="text-yellow-400 text-sm font-bold mt-1">{content.info?.hoursDesc}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="register" className="py-16 px-4 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 mb-4">הרשמה לקייטנה</h2>
          <p className="text-lg text-slate-600">מלאו את הפרטים להבטחת המקום. התשלום מאובטח.</p>
        </div>
        
        {/* We reuse the beautiful multi-step form built for the camp OR dynamic form */}
        <div className="relative group max-w-2xl mx-auto">
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
                      value={content.form || defaultCampFormConfig}
                      onChange={(formConfig) => setContent({ ...content, form: formConfig })}
                    />
                  </div>
                </Modal.Content>
              </Modal>
            </>
          )}
          <div className={`transition-all ${isEditing ? "opacity-75 pointer-events-none group-hover:blur-sm" : ""}`}>
            {content.form?.enabled ? (
              <CRMFormRenderer config={content.form} formId="camp-registration" formTitle={content.hero?.title || "הרשמה לקייטנה"} />
            ) : (
              <CampRegistrationForm />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-100 py-10 text-center relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">{content.hero?.title} - {content.hero?.highlight}</h2>
          <p className="text-slate-400 mb-6">מצפים לראותכם בקיץ בלתי נשכח!</p>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} כל הזכויות שמורות.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/972501234567?text=שלום,%20אשמח%20לפרטים%20נוספים%20לגבי%20הקייטנה" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 left-6 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-green-600 hover:scale-110 transition-all z-50 group"
      >
        <span className="text-3xl">💬</span>
        <span className="absolute right-full mr-4 bg-white text-slate-800 font-bold px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          יש לכם שאלות?
        </span>
      </a>
      
    </div>
  );
}
