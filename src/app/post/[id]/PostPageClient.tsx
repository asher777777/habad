"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Calendar, Tag, ArrowRight, Award, Edit3, Save, X, 
  Loader2, Wand2, Sparkles, Image as ImageIcon 
} from "lucide-react";
import Link from "next/link";
import { ShareButton } from "./ShareButton";
import { Button } from "@/components/ui/Button";
import { savePost } from "@/features/posts/actions";
import { generateHeroImageWithAI } from "@/features/services/actions";
import { ImageUpload } from "@/components/ui/ImageUpload";
export function PostPageClient({ initialData, id }: { initialData: any, id: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [post, setPost] = useState(initialData);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiError, setAiError] = useState("");
  
  useEffect(() => {
    if (post.title && !aiPrompt) {
      setAiPrompt(`Professional photorealistic warm photograph representing ${post.title} for a Jewish Chabad website, dramatic soft lighting, 16:9`);
    }
  }, [post.title, isEditing]);

  const handleGenerateImage = async () => {
    if (!aiPrompt) return;
    setGeneratingImage(true);
    setAiError("");
    try {
      const res = await generateHeroImageWithAI(aiPrompt);
      if (res.success && res.url) {
        setPost({ ...post, imageUrl: res.url });
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
      const updatedData = {
        ...post,
        updatedAt: new Date().toISOString()
      };
      await savePost(id, updatedData);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save post", e);
      alert("שגיאה בשמירת הפוסט ל-Firebase.");
    }
  };

  const isGradient = post.imageUrl?.startsWith("linear-gradient");
  const heroBackgroundStyle = isGradient 
    ? { background: post.imageUrl } 
    : post.imageUrl ? { backgroundImage: `url(${post.imageUrl})` } : {};

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]" dir="rtl">
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
                setPost(initialData);
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
            title="ערוך פוסט זה"
          >
            <Edit3 className="w-6 h-6" />
          </Button>
        )}
      </div>

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          
          {/* Back button */}
          <div className="flex justify-start">
            <Link 
              href="/"
              className="group flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors duration-200 bg-white px-4 py-2.5 rounded-full border shadow-sm"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-[2px] transition-transform" />
              <span>חזרה לדף הבית</span>
            </Link>
          </div>

          {/* Premium Article Container */}
          <article className="bg-white border rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-100/50 flex flex-col">
            
            {/* Hero Image / Banner */}
            <div 
              className={`relative bg-cover bg-center h-[260px] sm:h-[380px] w-full flex flex-col justify-end p-8 text-white`}
              style={heroBackgroundStyle}
            >
              {/* Dark gradient overlay for text readability */}
              {!isGradient && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-slate-950/15 z-0" />
              )}

              <div className="relative z-10 space-y-3.5 text-right w-full">
                
                {isEditing ? (
                  <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-3 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-white/60 mb-1">קטגוריה</label>
                      <select
                        value={post.category}
                        onChange={(e) => setPost({ ...post, category: e.target.value })}
                        className="bg-slate-800 text-white rounded-lg px-2.5 py-1 text-xs border border-white/10"
                      >
                        <option value="פרשת שבוע">פרשת שבוע</option>
                        <option value="חדשות הקהילה">חדשות הקהילה</option>
                        <option value="הלכה יומית">הלכה יומית</option>
                        <option value="חגים ומועדים">חגים ומועדים</option>
                        <option value="אירועים">אירועים</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/60 mb-1">כותרת הפוסט</label>
                      <input
                        value={post.title}
                        onChange={(e) => setPost({ ...post, title: e.target.value })}
                        className="w-full text-lg font-black bg-white/15 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border bg-white/20 border-white/20 backdrop-blur-md inline-block`}>
                      {post.category}
                    </span>
                    
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                      {post.title}
                    </h1>
                  </>
                )}
                
                <div className="flex items-center gap-4 text-xs sm:text-sm text-white/90 drop-shadow-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>נכתב ע"י סוכן ה-AI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Imagen / Custom Upload Options inside edit mode */}
            {isEditing && (
              <div className="bg-slate-50 border-b p-6 sm:p-8 space-y-6 text-right" dir="rtl">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b pb-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  ניהול תמונת הכתבה
                </h4>
                
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="flex flex-col items-center gap-2">
                    <ImageUpload 
                      currentImage={isGradient ? "" : post.imageUrl}
                      onSelect={(url) => setPost({ ...post, imageUrl: url })}
                    />
                  </div>
                  
                  <div className="flex-1 w-full space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      מחולל תמונות Google AI (Imagen)
                    </h5>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="תאר את תמונת הכתבה הרצויה בפירוט..."
                      className="w-full text-xs bg-white border rounded-xl p-3 outline-none text-slate-800 focus:border-indigo-500 min-h-[70px] resize-none"
                    />
                    
                    {aiError && (
                      <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                        {aiError}
                      </p>
                    )}
                    
                    <Button
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={generatingImage || !aiPrompt}
                      className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl gap-2 font-bold text-xs shadow-md"
                    >
                      {generatingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          מפיק תמונה ייחודית...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          צור תמונת כתבה ב-AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Teaser Summary Panel */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b p-6 sm:p-8 text-right">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">תקציר העדכון:</p>
              
              {isEditing ? (
                <textarea
                  value={post.summary}
                  onChange={(e) => setPost({ ...post, summary: e.target.value })}
                  className="w-full text-sm font-semibold text-slate-800 bg-white rounded-xl p-3 border outline-none min-h-[60px]"
                  placeholder="כתוב תקציר קצר ומזמין..."
                />
              ) : (
                <p className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed italic">
                  "{post.summary}"
                </p>
              )}
            </div>

            {/* Content Body */}
            <div className="p-8 sm:p-12 space-y-6 text-right text-slate-800 text-base sm:text-lg leading-relaxed font-normal">
              
              {isEditing ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500">גוף הכתבה (פסקאות מופרדות בשורה חדשה)</label>
                  <textarea
                    value={post.content}
                    onChange={(e) => setPost({ ...post, content: e.target.value })}
                    className="w-full text-sm text-slate-800 bg-slate-50 rounded-2xl p-4 min-h-[300px] border outline-none focus:bg-white leading-relaxed"
                    placeholder="כתוב כאן את מאמר התוכן המלא..."
                  />
                </div>
              ) : (
                post.content.split("\n").map((paragraph: string, index: number) => {
                  if (!paragraph.trim()) return null;
                  return (
                    <p key={index} className="text-slate-800">
                      {paragraph}
                    </p>
                  );
                })
              )}

              {/* Tag Badges */}
              <div className="pt-8 border-t flex flex-col gap-3">
                {isEditing ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">תגיות (מופרדות בפסיקים)</label>
                    <input
                      value={post.tags?.join(", ") || ""}
                      onChange={(e) => {
                        const arr = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                        setPost({ ...post, tags: arr });
                      }}
                      className="w-full text-xs text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border outline-none focus:bg-white"
                      placeholder="e.g. פרשת שבוע, שבת, חיזוק"
                    />
                  </div>
                ) : (
                  post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Public sharing callout */}
            {!isEditing && (
              <div className="bg-slate-50/50 border-t px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-600">התרגשתם מהתוכן? שתפו אותו עם חברים ומשפחה!</span>
                <ShareButton title={post.title} summary={post.summary} />
              </div>
            )}

          </article>

        </div>
      </main>

      <Footer />
    </div>
  );
}
