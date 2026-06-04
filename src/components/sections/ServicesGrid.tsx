"use client";

import { BrandIcon } from "@/components/ui/BrandIcon";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ServiceItem } from "@/features/home/actions";

import { useState } from "react";
import { AITextHelper } from "@/components/ui/AITextHelper";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

const ServicesGridEditor = dynamic(() => import("./ServicesGridEditor").then(m => m.ServicesGridEditor), { ssr: false });

interface ServicesGridProps {
  title?: string;
  description?: string;
  layout?: "grid" | "carousel" | "list" | "fz" | "bento" | "modular" | "progressive" | "spatial" | "thumb";
  items?: ServiceItem[];
  isEditing?: boolean;
  onUpdate?: (newItems: ServiceItem[]) => void;
  onHeaderUpdate?: (field: string, value: string) => void;
}

const EditableText = ({ 
  tag: Tag = "p", 
  value, 
  onChange, 
  isEditing, 
  className = "",
  richText = false
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  if (!isEditing) {
    if (richText) return <div className={cn("rich-content", className)} dangerouslySetInnerHTML={{ __html: value || "" }} />;
    return <Tag className={className}>{value}</Tag>;
  }

  if (richText) {
    return (
      <div className={cn("relative group/text rounded-xl outline-none hover:bg-slate-50 transition-colors cursor-text min-h-[50px] focus-within:ring-2 focus-within:ring-primary focus-within:bg-white", className)}>
        <RichTextEditor value={value} onChange={onChange} />
        <AITextHelper className="absolute -top-3 -right-3" value={value} onChange={(val) => onChange(val)} />
      </div>
    );
  }

  return (
    <div className={cn("relative group/text w-full max-w-full", isFocused ? "z-20" : "")}>
      <Tag
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setIsFocused(true)}
        onBlur={(e: any) => {
          setIsFocused(false);
          onChange(e.currentTarget.textContent || "");
        }}
        className={cn(
          "w-full outline-none hover:bg-slate-100 focus:bg-slate-100 focus:ring-2 focus:ring-primary/50 transition-all cursor-text rounded break-words p-1 -mx-1 block",
          className
        )}
      >
        {value}
      </Tag>
      <div className="absolute top-0 right-0 h-full flex items-center pr-2 -mr-12 opacity-0 group-hover/text:opacity-100 transition-opacity pointer-events-none">
        <LucideIcons.Edit2 className="w-4 h-4 text-slate-400" />
      </div>
      <AITextHelper className="absolute -top-3 -right-3" value={value} onChange={(val) => onChange(val)} />
    </div>
  );
};

// Helper to get Icon component safely
const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.FileQuestion;
};

export const ServicesGrid = ({ title, description, layout = "grid", items = [], isEditing, onUpdate, onHeaderUpdate }: ServicesGridProps) => {
  const visibleItems = isEditing ? items : items.filter(item => item.isVisible !== false);

  const renderAdminPanel = () => {
    if (!isEditing || !onUpdate) return null;

    return (
      <ServicesGridEditor
        items={items}
        onUpdate={onUpdate}
      />
    );
  };

  const renderLayout = () => {
    // ---- Existing Layouts (Grid, Carousel, List) ----
    if (layout === "grid" || layout === "carousel" || layout === "list") {
      return (
        <div className={cn(
          "w-full",
          layout === "grid" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
          layout === "carousel" && "flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x snap-mandatory",
          layout === "list" && "flex flex-col gap-4 max-w-4xl mx-auto"
        )}>
          {visibleItems.map((service, index) => (
            <Link
              key={index}
              href={service.url || "#"}
              className={cn(
                "bg-card border rounded-3xl transition-all duration-500 hover:shadow-2xl hover:border-primary/20 group cursor-pointer",
                layout === "grid" && "p-8 flex flex-col items-center text-center hover:-translate-y-2",
                layout === "carousel" && "min-w-[280px] p-8 flex flex-col items-center text-center snap-center hover:-translate-y-2",
                layout === "list" && "p-6 flex items-center text-right gap-6 hover:translate-x-[-8px] relative overflow-hidden"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl transition-colors duration-500",
                "bg-primary/5 group-hover:bg-primary",
                layout === "list" && "shrink-0"
              )}>
                <BrandIcon icon={getIcon(service.icon)} size={layout === "list" ? 32 : 40} iconClassName="group-hover:text-white" />
              </div>
              
              <div className={cn(layout === "list" && "flex-1")}>
                <h3 className="text-xl font-bold text-primary group-hover:text-primary transition-colors">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">{service.description}</p>
              </div>

              {layout !== "list" && (
                <div className="pt-4">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 inline-block">לפרטים נוספים +</span>
                </div>
              )}
              {layout === "list" && (
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0">
                  <span className="bg-primary/10 text-primary p-2 rounded-full flex"><LucideIcons.ChevronLeft className="w-5 h-5" /></span>
                </div>
              )}
            </Link>
          ))}
        </div>
      );
    }

    // ---- Option 1: "המסלול הטבעי" (F/Z Pattern Hierarchy) ----
    if (layout === "fz") {
      return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
          {visibleItems.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <Link key={index} href={service.url || "#"} className="group flex flex-col md:flex-row items-center bg-white rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl border border-transparent hover:border-slate-100 transition-all gap-8">
                <div className="flex-1 w-full md:w-auto">
                  <div className="flex items-center gap-4 mb-4">
                    {!service.imageSrc && (
                      <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shrink-0">
                        <Icon className="w-8 h-8" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-slate-900">{service.title}</h3>
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed">{service.description}</p>
                </div>
                {service.imageSrc && (
                  <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden shrink-0 mt-4 md:mt-0 order-first md:order-last relative">
                    <Image src={service.imageSrc} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  </div>
                )}
                {!service.imageSrc && (
                  <div className="shrink-0 md:w-48 text-left md:text-center mt-4 md:mt-0 w-full flex md:block justify-end">
                  <div className="flex items-center text-indigo-600 font-medium group-hover:translate-x-[-8px] transition-transform">
                    למעבר לעמוד <LucideIcons.ArrowLeft className="w-5 h-5 mr-2" />
                  </div>
                </div>
                )}
              </Link>
            )
          })}
        </div>
      );
    }

    // ---- Option 2: "קופסת הבנטו" (Bento Grid Style) ----
    if (layout === "bento") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[250px] gap-6 w-full max-w-6xl mx-auto">
          {visibleItems.map((service, index) => {
            // First item gets 2x2, next ones varying
            const isLarge = index === 0;
            const isWide = index === 1 || index === 4;
            const Icon = getIcon(service.icon);
            
            return (
              <Link key={index} href={service.url || "#"} className={cn(
                "group relative bg-white rounded-[2rem] p-8 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col",
                isLarge ? "md:col-span-2 md:row-span-2 bg-slate-900 text-white border-none" : "",
                isWide ? "md:col-span-2" : ""
              )}>
                <div className={cn(
                  "p-4 rounded-2xl w-fit mb-auto transition-transform group-hover:scale-110",
                  isLarge ? "bg-white/10 text-white" : "bg-primary/5 text-primary"
                )}>
                  <Icon className="w-8 h-8" />
                </div>
                
                <div className="mt-8 relative z-10">
                  <h3 className={cn("font-bold mb-2", isLarge ? "text-3xl" : "text-xl text-slate-900")}>{service.title}</h3>
                  <p className={cn("text-sm leading-relaxed", isLarge ? "text-white/70 text-lg" : "text-slate-500", !isLarge && !isWide ? "line-clamp-2" : "")}>
                    {service.description}
                  </p>
                </div>
                {/* Decorative background shape or Image */}
                {service.imageSrc ? (
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
                    <Image src={service.imageSrc} alt="" fill className="object-cover opacity-20 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  </div>
                ) : (
                  <div className={cn("absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity z-0", isLarge ? "bg-secondary" : "bg-primary")} />
                )}
              </Link>
            )
          })}
        </div>
      );
    }

    // ---- Option 3: "שולחן העבודה האישי" (Modular Customization) ----
    if (layout === "modular") {
      return (
        <div className="w-full max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4 text-sm font-medium text-slate-500 hidden md:flex">
            <div className="w-16"></div>
            <div className="flex-1">שם השירות / העמוד</div>
            <div className="flex-[2]">תקציר</div>
            <div className="w-32 text-center">פעולה</div>
          </div>
          <div className="divide-y divide-slate-100">
            {visibleItems.map((service, index) => {
              const Icon = getIcon(service.icon);
              return (
                <Link key={index} href={service.url || "#"} className="flex flex-col md:flex-row items-start md:items-center p-4 md:p-6 hover:bg-slate-50 transition-colors group">
                  <div className="w-16 shrink-0 mb-4 md:mb-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1 font-bold text-slate-900 text-lg mb-2 md:mb-0 pr-0 md:pr-4">{service.title}</div>
                  <div className="flex-[2] text-slate-600 text-sm leading-relaxed pr-0 md:pr-4">{service.description}</div>
                  <div className="w-full md:w-32 mt-4 md:mt-0 text-left md:text-center">
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors w-full md:w-auto">
                      צפה בפרטים
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      );
    }

    // ---- Option 4: "הלובי השקט" (Progressive Disclosure) ----
    if (layout === "progressive") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
          {visibleItems.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <div key={index} className="group relative bg-slate-50 hover:bg-white rounded-[2rem] p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-transparent hover:border-slate-100 text-center h-48 hover:h-auto overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center group-hover:top-8 group-hover:translate-y-0 transition-all duration-500">
                  <Icon className="w-10 h-10 text-slate-400 group-hover:text-primary mb-4 transition-colors" />
                  <h3 className="text-xl font-bold text-slate-800">{service.title}</h3>
                </div>
                
                <div className="opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 mt-28">
                  <p className="text-slate-500 mb-6 text-sm leading-relaxed">{service.description}</p>
                  <Link href={service.url || "#"} className="inline-flex items-center text-primary font-bold hover:underline">
                    למידע נוסף <LucideIcons.ArrowLeft className="w-4 h-4 mr-1" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      );
    }

    // ---- Option 5: "הגלריה היוקרתית" (Spatial Minimalism) ----
    if (layout === "spatial") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16 w-full max-w-[1400px] mx-auto px-4 md:px-12">
          {visibleItems.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <Link key={index} href={service.url || "#"} className="group block relative perspective-1000">
                <div className="transform-style-3d group-hover:rotate-y-[-5deg] group-hover:rotate-x-[5deg] transition-transform duration-700 ease-out">
                  <div className="bg-white rounded-[3rem] p-12 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-50 aspect-square flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="flex justify-between items-start z-10">
                      <div className="p-5 bg-slate-50 rounded-full text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-sm">
                        <Icon className="w-8 h-8" strokeWidth={1} />
                      </div>
                      <div className="text-slate-200 group-hover:text-primary transition-colors">
                         <LucideIcons.ArrowUpRight className="w-8 h-8" />
                      </div>
                    </div>
                    
                    <div className="z-10 mt-12">
                      <h3 className="text-3xl font-light tracking-tight text-slate-900 mb-4 group-hover:text-primary transition-colors">{service.title}</h3>
                      <p className="text-slate-500 leading-relaxed font-light">{service.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      );
    }

    // ---- Option 6: "אזור האגודל" (Mobile Ergonomics) ----
    if (layout === "thumb") {
      return (
        <div className="flex flex-col gap-4 w-full max-w-lg mx-auto md:max-w-4xl md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 pb-20 md:pb-0">
          {visibleItems.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <Link key={index} href={service.url || "#"} className="bg-white rounded-3xl p-5 shadow-sm active:scale-95 transition-transform flex items-center gap-4 border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate">{service.title}</h3>
                  <p className="text-slate-500 text-sm truncate">{service.description}</p>
                </div>
                <div className="shrink-0 text-slate-300">
                  <LucideIcons.ChevronLeft className="w-5 h-5" />
                </div>
              </Link>
            )
          })}
          
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-slate-900 text-white rounded-full p-2 flex justify-between items-center shadow-2xl md:hidden z-50">
            <button className="p-3 bg-white/10 rounded-full"><LucideIcons.Filter className="w-5 h-5" /></button>
            <span className="font-medium text-sm">סה"כ {visibleItems.length} עמודים</span>
            <button className="p-3 bg-white/10 rounded-full"><LucideIcons.Search className="w-5 h-5" /></button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="py-24 px-6 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <EditableText tag="h2" value={title || "שירותי דת וקהילה"} onChange={(v: string) => onHeaderUpdate?.("title", v)} isEditing={isEditing} className="text-3xl md:text-5xl font-bold text-primary" />
          <EditableText tag="p" value={description || ""} onChange={(v: string) => onHeaderUpdate?.("description", v)} isEditing={isEditing} className="text-muted-foreground text-lg max-w-2xl mx-auto" />
        </div>

        {renderAdminPanel()}
        {renderLayout()}
      </div>
    </section>
  );
};
