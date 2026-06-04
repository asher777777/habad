"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { CommunitySection } from "@/components/sections/CommunitySection";
import { LivePostsGrid } from "@/components/sections/LivePostsGrid";
import { ContactSection } from "@/components/sections/ContactSection";
import { LandingSection } from "@/components/sections/LandingSection";
import { RichContentSection } from "@/components/sections/RichContentSection";
import { HomePageConfig, savePageConfig, getAllSitePages } from "@/features/home/actions";
import { GlobalSettings, saveGlobalSettings } from "@/features/settings/actions";
import { 
  Save, 
  X, 
  LayoutTemplate, 
  Settings2, 
  Image as ImageIcon, 
  Palette, 
  GripVertical,
  AlignRight,
  AlignCenter,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  Check,
  Layers,
  Phone,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

interface HomeEditorProps {
  initialConfig: HomePageConfig;
  initialGlobalSettings?: GlobalSettings;
  config: HomePageConfig;
  setConfig: React.Dispatch<React.SetStateAction<HomePageConfig>>;
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  setIsEditing: (val: boolean) => void;
  pageId?: string;
  collectionName?: string;
}

export function HomeEditor({
  initialConfig,
  initialGlobalSettings,
  config,
  setConfig,
  globalSettings,
  setGlobalSettings,
  setIsEditing,
  pageId,
  collectionName
}: HomeEditorProps) {
  const [saving, setSaving] = useState(false);
  
  // Side Drawer & Dyn Loading States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sitePages, setSitePages] = useState<any[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("logo");

  // Load site pages and restore scroll on mount
  useEffect(() => {
    async function loadPages() {
      setIsLoadingPages(true);
      try {
        const pages = await getAllSitePages();
        const fixedPages = [
          { id: "home", title: 'עמוד הבית', url: '/' },
          { id: "lessons", title: 'שיעורי תורה', url: '/lessons' },
          { id: "services", title: 'שירותי דת', url: '/services' },
          { id: "community", title: 'עמוד קהילה', url: '/community' },
          { id: "contact", title: 'צור קשר', url: '/contact' },
        ];
        const combined = [...fixedPages];
        if (pages) {
          pages.forEach(p => {
            if (!combined.some(existing => existing.url === p.url)) {
              combined.push(p);
            }
          });
        }
        setSitePages(combined);
      } catch (e) {
        console.error("Failed to load site pages", e);
      } finally {
        setIsLoadingPages(false);
      }
    }
    loadPages();

    // Restore scroll position
    const savedScroll = sessionStorage.getItem("home_editor_scroll");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem("home_editor_scroll");
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (collectionName && pageId) {
        await savePageConfig(collectionName, pageId, config);
      } else {
        await savePageConfig("pages", "home", config);
      }
      await saveGlobalSettings(globalSettings);
      sessionStorage.setItem("home_editor_scroll", window.scrollY.toString());
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save home page config", e);
      alert("שגיאה בשמירה ל-Firebase.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
  };

  const updateHero = (field: keyof HomePageConfig["hero"], value: string) => {
    setConfig({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const updateMainContent = (field: keyof HomePageConfig["mainContent"], value: string) => {
    setConfig({ ...config, mainContent: { ...config.mainContent, [field]: value } });
  };

  const updateSectionVisibility = (section: keyof Omit<HomePageConfig, "hero" | "sectionOrder">, visible: boolean) => {
    setConfig({ ...config, [section]: { ...config[section as keyof HomePageConfig] as any, visible } });
  };

  // Nav Links manipulations
  const handleAddLink = () => {
    const newLinks = [...(globalSettings.navLinks || []), { name: "קישור חדש", href: "/" }];
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleUpdateLinkName = (index: number, val: string) => {
    const newLinks = [...(globalSettings.navLinks || [])];
    newLinks[index] = { ...newLinks[index], name: val };
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleUpdateLinkHref = (index: number, val: string) => {
    const newLinks = [...(globalSettings.navLinks || [])];
    newLinks[index] = { ...newLinks[index], href: val };
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleDeleteLink = (index: number) => {
    const newLinks = (globalSettings.navLinks || []).filter((_, i) => i !== index);
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const links = [...(globalSettings.navLinks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const temp = links[index];
    links[index] = links[targetIndex];
    links[targetIndex] = temp;
    setGlobalSettings({ ...globalSettings, navLinks: links });
  };

  const SectionToggle = ({ 
    label, 
    sectionKey 
  }: { 
    label: string, 
    sectionKey: keyof Omit<HomePageConfig, "hero" | "sectionOrder"> 
  }) => {
    return (
      <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={(config[sectionKey as keyof typeof config] as any)?.visible ?? true}
            onChange={(e) => updateSectionVisibility(sectionKey, e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>
    );
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800">מבנה אזור ראשי</span>
              <select 
                value={config.hero.layout || "fz"}
                onChange={(e) => updateHero("layout", e.target.value)}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="fz">המסלול הטבעי (F/Z)</option>
                <option value="bento">קופסת הבנטו (Bento Grid)</option>
                <option value="modular">שולחן עבודה (Modular)</option>
                <option value="progressive">הלובי השקט (Progressive)</option>
                <option value="spatial">הגלריה היוקרתית (Spatial)</option>
                <option value="thumb">אזור האגודל (Mobile Thumb)</option>
              </select>
            </div>
            <Hero 
              title={config.hero.title}
              subtitle={config.hero.subtitle}
              description={config.hero.description}
              imageSrc={config.hero.imageSrc}
              layout={config.hero.layout}
              buttonsVisible={config.hero.buttonsVisible}
              primaryButton={config.hero.primaryButton}
              secondaryButton={config.hero.secondaryButton}
              isEditing={true}
              onUpdateHero={updateHero}
            />
          </div>
        );
      case "mainContent":
        return (
          <div className={`relative ${!config.mainContent.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור תוכן מרכזי" sectionKey="mainContent" />
            <div className="absolute top-4 left-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800">מבנה תוכן מרכזי</span>
              <select 
                value={config.mainContent.layout || "bento"}
                onChange={(e) => updateMainContent("layout", e.target.value)}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="fz">המסלול הטבעי (F/Z)</option>
                <option value="bento">קופסת הבנטו (Bento Grid)</option>
                <option value="modular">שולחן עבודה (Modular)</option>
                <option value="progressive">הלובי השקט (Progressive)</option>
                <option value="spatial">הגלריה היוקרתית (Spatial)</option>
                <option value="thumb">אזור האגודל (Mobile Thumb)</option>
              </select>
            </div>
            <Hero 
              title={config.mainContent.title}
              subtitle={config.mainContent.subtitle}
              description={config.mainContent.description}
              imageSrc={config.mainContent.imageSrc}
              layout={config.mainContent.layout}
              buttonsVisible={config.mainContent.buttonsVisible}
              primaryButton={config.mainContent.primaryButton}
              secondaryButton={config.mainContent.secondaryButton}
              isEditing={true}
              onUpdateHero={(field, val) => updateMainContent(field, val)}
            />
          </div>
        );
      case "services":
        return (
          <div className={`relative ${!config.services.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור שירותים" sectionKey="services" />
            <div className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">פריסה:</span>
              <select 
                value={config.services.layout || "grid"}
                onChange={(e) => setConfig({ ...config, services: { ...config.services, layout: e.target.value as any }})}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="grid">גריד רגיל (Grid)</option>
                <option value="carousel">קרוסלה (Carousel)</option>
                <option value="list">רשימה קלאסית (List)</option>
                <option value="fz">המסלול הטבעי (F/Z)</option>
                <option value="bento">קופסת הבנטו (Bento Grid)</option>
                <option value="modular">שולחן עבודה (Modular)</option>
                <option value="progressive">הלובי השקט (Progressive)</option>
                <option value="spatial">הגלריה היוקרתית (Spatial)</option>
                <option value="thumb">אזור האגודל (Mobile Thumb)</option>
              </select>
            </div>
            <ServicesGrid 
              title={config.services.title}
              description={config.services.description}
              layout={config.services.layout} 
              items={config.services.items} 
              isEditing={true} 
              onUpdate={(items) => setConfig({ ...config, services: { ...config.services, items } })}
              onHeaderUpdate={(field, val) => setConfig({ ...config, services: { ...config.services, [field]: val } })}
            />
          </div>
        );
      case "community":
        return (
          <div className={`relative ${!config.community.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="קהילה שזורמת" sectionKey="community" />
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">פריסה:</span>
                <select 
                  value={config.community.layout || "split-left"}
                  onChange={(e) => setConfig({ ...config, community: { ...config.community, layout: e.target.value as any }})}
                  className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
                >
                  <option value="split-left">תמונה משמאל (Split Left)</option>
                  <option value="split-right">תמונה מימין (Split Right)</option>
                  <option value="centered">ממורכז (Centered)</option>
                </select>
              </div>
              <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.community.badgeVisible ?? true}
                  onChange={(e) => setConfig({ ...config, community: { ...config.community, badgeVisible: e.target.checked }})}
                />
                תווית על התמונה
              </label>
              <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.community.buttonVisible ?? true}
                  onChange={(e) => setConfig({ ...config, community: { ...config.community, buttonVisible: e.target.checked }})}
                />
                כפתור וואטסאפ
              </label>
            </div>
            <CommunitySection
              title={config.community.title}
              subtitle={config.community.subtitle}
              description={config.community.description}
              quote={config.community.quote}
              imageSrc={config.community.imageSrc}
              badgeTitle={config.community.badgeTitle}
              badgeSubtitle={config.community.badgeSubtitle}
              buttonText={config.community.buttonText}
              whatsappNumber={config.community.whatsappNumber}
              layout={config.community.layout}
              badgeVisible={config.community.badgeVisible}
              buttonVisible={config.community.buttonVisible}
              isEditing={true}
              onUpdate={(field, value) => setConfig({ ...config, community: { ...config.community, [field]: value }})}
            />
          </div>
        );
      case "livePosts":
        return (
          <div className={`relative ${!config.livePosts.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="עדכונים ואירועים" sectionKey="livePosts" />
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">פריסה:</span>
                <select 
                  value={config.livePosts.layout || "grid"}
                  onChange={(e) => setConfig({ ...config, livePosts: { ...config.livePosts, layout: e.target.value as any }})}
                  className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
                >
                  <option value="grid">גריד (Grid)</option>
                  <option value="list">רשימה (List)</option>
                  <option value="bento">בנטו (Bento)</option>
                  <option value="carousel">קרוסלה (Carousel)</option>
                </select>
              </div>
            </div>

            {/* Custom listing editor block when editing */}
            <div className="bg-slate-50 p-6 border-b border-t text-right" dir="rtl">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    בחירת דפים מותאמים אישית לליסטינג (אם ריק - יציג את 3 הפוסטים האחרונים)
                  </h3>
                  <Button
                    onClick={() => {
                      const defaultUrl = sitePages[0]?.url || "/";
                      const currentCustom = config.livePosts.customPages || [];
                      setConfig({
                        ...config,
                        livePosts: {
                          ...config.livePosts,
                          customPages: [...currentCustom, defaultUrl]
                        }
                      });
                    }}
                    variant="outline"
                    className="py-1 px-3 border-secondary/20 hover:border-secondary/50 text-secondary text-xs font-bold rounded-lg cursor-pointer"
                  >
                    הוסף דף לליסטינג +
                  </Button>
                </div>

                {config.livePosts.customPages && config.livePosts.customPages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {config.livePosts.customPages.map((selectedUrl, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border">
                        <select
                          value={selectedUrl}
                          onChange={(e) => {
                            const updated = [...(config.livePosts.customPages || [])];
                            updated[idx] = e.target.value;
                            setConfig({
                              ...config,
                              livePosts: { ...config.livePosts, customPages: updated }
                            });
                          }}
                          className="flex-grow text-xs p-1 border rounded bg-slate-50 cursor-pointer font-medium"
                        >
                          {sitePages.map(page => (
                            <option key={page.id} value={page.url}>{page.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const updated = (config.livePosts.customPages || []).filter((_, i) => i !== idx);
                            setConfig({
                              ...config,
                              livePosts: { ...config.livePosts, customPages: updated }
                            });
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">כעת מוצגים 3 הפוסטים האחרונים באופן אוטומטי.</p>
                )}
              </div>
            </div>

            <LivePostsGrid layout={config.livePosts.layout} customPages={config.livePosts.customPages} />
          </div>
        );
      case "contact":
        return (
          <div className={`relative ${!config.contact.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="צור קשר" sectionKey="contact" />
            <ContactSection 
              title={config.contact.title}
              subtitle={config.contact.subtitle}
              addressLabel={config.contact.addressLabel}
              addressVal={config.contact.addressVal}
              phoneLabel={config.contact.phoneLabel}
              phoneVal={config.contact.phoneVal}
              hoursLabel={config.contact.hoursLabel}
              hoursVal={config.contact.hoursVal}
              form={config.contact.form}
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  contact: {
                    ...config.contact,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      case "richContent":
        return (
          <div className={`relative ${!config.richContent?.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור תוכן מעוצב (Rich Content)" sectionKey="richContent" />
            <RichContentSection 
              heading={config.richContent?.heading}
              body={config.richContent?.body}
              layout={config.richContent?.layout}
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  richContent: {
                    ...config.richContent!,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      case "landingSection":
        if (!config.landingSection) return null;
        return (
          <div className={`relative ${!config.landingSection.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור דף נחיתה וטפסים" sectionKey="landingSection" />
            <LandingSection
              title={config.landingSection.title}
              subtitle={config.landingSection.subtitle}
              description={config.landingSection.description}
              imageSrc={config.landingSection.imageSrc}
              form={config.landingSection.form}
              theme={globalSettings.theme}
              layout={config.landingSection.layout}
              formMode={config.landingSection.formMode}
              buttonText={config.landingSection.buttonText}
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  landingSection: {
                    ...config.landingSection!,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const colorThemes = [
    { value: "navy", label: "כחול נייבי (חב\"ד)", class: "bg-[#0f172a]" },
    { value: "emerald", label: "ירוק ברקת", class: "bg-[#047857]" },
    { value: "rose", label: "אדום ורד", class: "bg-[#be123c]" },
    { value: "violet", label: "סגול מלכותי", class: "bg-[#6d28d9]" },
    { value: "charcoal", label: "פחם אלגנטי", class: "bg-[#374151]" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar layout={globalSettings.headerLayout} logoUrl={globalSettings.siteLogoUrl} navLinks={globalSettings.navLinks} />
      
      {/* Admin Floating Control Dashboard */}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2.5">
        <Button 
          variant="primary" 
          size="lg" 
          className="rounded-full shadow-2xl bg-green-600 hover:bg-green-700 h-14 w-14 p-0 text-white flex items-center justify-center transition-all duration-300 scale-110 cursor-pointer"
          onClick={handleSave}
          disabled={saving}
          title="שמור שינויים"
        >
          <Save className="w-6 h-6" />
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-2xl bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-100 h-14 w-14 p-0 flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer"
          onClick={handleOpenDrawer}
          title="הגדרות עיצוב גלובליות"
        >
          <Settings2 className="w-6 h-6" />
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-2xl bg-white hover:bg-slate-100 text-slate-700 h-14 w-14 p-0 border flex items-center justify-center transition-all duration-300 cursor-pointer"
          onClick={() => {
            sessionStorage.setItem("home_editor_scroll", window.scrollY.toString());
            setConfig(initialConfig);
            if (initialGlobalSettings) setGlobalSettings(initialGlobalSettings);
            setIsEditing(false);
          }}
          title="ביטול שינויים"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Side Settings Drawer Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[240] bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
      )}
      
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-[250] w-full max-w-lg bg-white border-r shadow-2xl transition-transform duration-300 transform flex flex-col text-right",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        dir="rtl"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">עריכת עיצוב ותפריטים</h3>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)} 
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          
          {/* Accordion Group 1: Logo & Alignment */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "logo" ? null : "logo")}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                לוגו ומיקום הלוגו (הדר)
              </span>
              {activeAccordion === "logo" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "logo" && (
              <div className="p-5 bg-white space-y-5 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">קובץ לוגו האתר</label>
                  {/* Container ensures enough spacing for ImageUpload popup and displays fully */}
                  <div className="p-2 border border-slate-100 rounded-xl bg-slate-50/30">
                    <ImageUpload 
                      currentImage={globalSettings.siteLogoUrl}
                      onSelect={(url) => setGlobalSettings({ ...globalSettings, siteLogoUrl: url })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">מיקום הלוגו בתפריט העליון</label>
                  {/* Toggle button icons right, center, left */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGlobalSettings({ ...globalSettings, headerLayout: "classic" })}
                      className={cn(
                        "flex-1 py-3 px-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                        globalSettings.headerLayout === "classic" 
                          ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <AlignRight className="h-5 w-5" />
                      <span>ימין (קלאסי)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setGlobalSettings({ ...globalSettings, headerLayout: "center" })}
                      className={cn(
                        "flex-1 py-3 px-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                        globalSettings.headerLayout === "center" 
                          ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <AlignCenter className="h-5 w-5" />
                      <span>מרכז</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGlobalSettings({ ...globalSettings, headerLayout: "left" })}
                      className={cn(
                        "flex-1 py-3 px-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                        globalSettings.headerLayout === "left" 
                          ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <AlignLeft className="h-5 w-5" />
                      <span>שמאל</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion Group 2: Color Palette */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "theme" ? null : "theme")}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-600" />
                צבעי עיצוב (פלטה)
              </span>
              {activeAccordion === "theme" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "theme" && (
              <div className="p-5 bg-white space-y-3 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-slate-600 block">בחר פלטת צבעים גלובלית</label>
                <div className="flex flex-col gap-2">
                  {colorThemes.map((t) => {
                    const isSelected = globalSettings.theme === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setGlobalSettings({ ...globalSettings, theme: t.value as any })}
                        className={cn(
                          "w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all cursor-pointer",
                          isSelected 
                            ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                            : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn("h-4 w-4 rounded-full shadow-inner", t.class)} />
                          {t.label}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-secondary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accordion Group 3: Main Menu Editor */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "navigation" ? null : "navigation")}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-indigo-600" />
                עורך תפריט ניווט ראשי
              </span>
              {activeAccordion === "navigation" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "navigation" && (
              <div className="p-5 bg-white space-y-4 animate-in fade-in duration-200">
                {isLoadingPages ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                    <p className="text-xs font-bold text-slate-400">טוען את עמודי האתר לעריכה...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">פריטי תפריט ({globalSettings.navLinks?.length || 0})</span>
                      <Button
                        type="button"
                        onClick={handleAddLink}
                        variant="outline"
                        className="py-1 px-3 border border-secondary/20 hover:border-secondary/50 text-secondary rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        הוסף קישור
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(globalSettings.navLinks || []).map((link, idx) => (
                        <div key={idx} className="p-3 border rounded-xl bg-slate-50/50 space-y-2 relative group/link">
                          {/* Arrange controls */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-indigo-600">פריט #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveLink(idx, 'up')}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500 cursor-pointer"
                                title="הזז למעלה"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (globalSettings.navLinks || []).length - 1}
                                onClick={() => handleMoveLink(idx, 'down')}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500 cursor-pointer"
                                title="הזז למטה"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(idx)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 cursor-pointer"
                                title="מחק קישור"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Form fields */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">כותרת הקישור</label>
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => handleUpdateLinkName(idx, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary"
                                placeholder="לדוגמה: שיעורים"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">עמוד יעד</label>
                              <select
                                value={link.href}
                                onChange={(e) => handleUpdateLinkHref(idx, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary font-medium cursor-pointer"
                              >
                                <option value="/">עמוד הבית (בית)</option>
                                {sitePages.map(page => (
                                  <option key={page.id} value={page.url}>
                                    {page.title} ({page.url})
                                  </option>
                                ))}
                                {/* Allow typing custom link path by matching option value */}
                                {!sitePages.some(p => p.url === link.href) && link.href !== "/" && (
                                  <option value={link.href}>קישור מותאם: {link.href}</option>
                                )}
                                <option value="/custom">-- הגדר קישור ידנית --</option>
                              </select>
                            </div>
                          </div>

                          {/* Fallback to text input if manually entering custom path */}
                          {(link.href === "/custom" || !sitePages.some(p => p.url === link.href) && link.href !== "/") && (
                            <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                              <label className="text-[10px] font-bold text-slate-500">נתיב קישור ידני (URL/Path)</label>
                              <input
                                type="text"
                                value={link.href === "/custom" ? "" : link.href}
                                onChange={(e) => handleUpdateLinkHref(idx, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-secondary/50"
                                placeholder="לדוגמה: /custom-path או http://..."
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {(globalSettings.navLinks || []).length === 0 && (
                        <p className="text-center py-6 text-xs text-slate-400 font-medium">אין קישורים בתפריט. הוסף קישור חדש!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion Group 4: Contact Widget Editor */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "contactWidget" ? null : "contactWidget")}
              className="w-full p-4 bg-slate-55 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-650" />
                פרטי קשר של כפתור 'אנחנו כאן'
              </span>
              {activeAccordion === "contactWidget" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "contactWidget" && (
              <div className="p-5 bg-white space-y-4 animate-in fade-in duration-200 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">מספר טלפון לקשר / וואטסאפ</label>
                  <input
                    type="text"
                    value={globalSettings.contactPhone || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="למשל: 0545947701"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">כתובת אימייל</label>
                  <input
                    type="email"
                    value={globalSettings.contactEmail || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="למשל: email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">קישור לפייסבוק</label>
                  <input
                    type="text"
                    value={globalSettings.contactFacebook || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactFacebook: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="קישור מלא לפרופיל / דף פייסבוק"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">כתובת פיזית (עבור וויז)</label>
                  <input
                    type="text"
                    value={globalSettings.contactAddress || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="למשל: יצחק שדה 2, אזור"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t bg-slate-50 flex gap-2">
          <Button
            onClick={() => setIsDrawerOpen(false)}
            variant="primary"
            className="flex-grow py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Check className="h-5 w-5" />
            אישור וסגירה
          </Button>
        </div>
      </div>

      <main className="flex-grow pt-24">
        <Reorder.Group 
          axis="y" 
          values={config.sectionOrder || ["hero", "mainContent", "services", "community", "livePosts", "richContent", "contact"]} 
          onReorder={(newOrder) => setConfig({ ...config, sectionOrder: newOrder })}
          className="flex flex-col w-full"
        >
          {(config.sectionOrder || ["hero", "mainContent", "services", "community", "livePosts", "richContent", "contact"]).map((sectionId) => {
            const isMobileHidden = config.mobileHiddenSections?.includes(sectionId) || false;
            return (
              <Reorder.Item key={sectionId} value={sectionId} className="relative group/reorder">
                {/* Drag Handle & Mobile Switch */}
                <div className="absolute top-4 right-4 z-[100] opacity-0 group-hover/reorder:opacity-100 transition-opacity bg-white/95 shadow-lg backdrop-blur-sm rounded-xl p-1.5 border flex items-center gap-2" dir="rtl">
                  <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-lg text-slate-500" title="גרור לשינוי סדר">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-[1px] h-4 bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      const current = config.mobileHiddenSections || [];
                      const updated = current.includes(sectionId)
                        ? current.filter(id => id !== sectionId)
                        : [...current, sectionId];
                      setConfig({ ...config, mobileHiddenSections: updated });
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
                      isMobileHidden 
                        ? "bg-red-50 text-red-600 hover:bg-red-100/80" 
                        : "bg-green-50 text-green-600 hover:bg-green-100/80"
                    )}
                    title={isMobileHidden ? "מוסתר בנייד - לחץ להצגה" : "מוצג בנייד - לחץ להסתרה"}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isMobileHidden ? "מוסתר בנייד" : "מוצג בנייד"}</span>
                  </button>
                </div>
                {renderSection(sectionId)}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </main>

      <Footer />
    </div>
  );
}
