"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { CommunitySection } from "@/components/sections/CommunitySection";
import { LivePostsGrid } from "@/components/sections/LivePostsGrid";
import { ContactSection } from "@/components/sections/ContactSection";
import { LandingSection } from "@/components/sections/LandingSection";
import { RichContentSection } from "@/components/sections/RichContentSection";
import { HomePageConfig } from "@/features/home/actions";
import { GlobalSettings } from "@/features/settings/actions";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

// Dynamically import the heavy editing interface so normal visitors never download it
const HomeEditor = dynamic(() => import("./HomeEditor").then(m => m.HomeEditor), { ssr: false });

interface HomeClientProps {
  initialConfig: HomePageConfig;
  initialGlobalSettings?: GlobalSettings;
}

export function HomeClient({ initialConfig, initialGlobalSettings }: HomeClientProps) {
  const { isAuthenticated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<HomePageConfig>(initialConfig);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(
    initialGlobalSettings || { siteLogoUrl: "", headerLayout: "classic", theme: "navy", navLinks: [] }
  );

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("home_editor_scroll");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem("home_editor_scroll");
    }
  }, [isEditing]);

  // If in editing mode, swap out for the dynamic editor component
  if (isAuthenticated && isEditing) {
    return (
      <HomeEditor
        initialConfig={initialConfig}
        initialGlobalSettings={initialGlobalSettings}
        config={config}
        setConfig={setConfig}
        globalSettings={globalSettings}
        setGlobalSettings={setGlobalSettings}
        setIsEditing={setIsEditing}
      />
    );
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        return (
          <Hero 
            title={config.hero.title}
            subtitle={config.hero.subtitle}
            description={config.hero.description}
            imageSrc={config.hero.imageSrc}
            layout={config.hero.layout}
            buttonsVisible={config.hero.buttonsVisible}
            primaryButton={config.hero.primaryButton}
            secondaryButton={config.hero.secondaryButton}
            isEditing={false}
          />
        );
      case "mainContent":
        if (!config.mainContent.visible) return null;
        return (
          <Hero 
            title={config.mainContent.title}
            subtitle={config.mainContent.subtitle}
            description={config.mainContent.description}
            imageSrc={config.mainContent.imageSrc}
            layout={config.mainContent.layout}
            buttonsVisible={config.mainContent.buttonsVisible}
            primaryButton={config.mainContent.primaryButton}
            secondaryButton={config.mainContent.secondaryButton}
            isEditing={false}
          />
        );
      case "services":
        if (!config.services.visible) return null;
        return (
          <ServicesGrid 
            layout={config.services.layout} 
            items={config.services.items} 
            isEditing={false}
          />
        );
      case "community":
        if (!config.community.visible) return null;
        return (
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
            isEditing={false}
          />
        );
      case "livePosts":
        if (!config.livePosts.visible) return null;
        return <LivePostsGrid layout={config.livePosts.layout} customPages={config.livePosts.customPages} />;
      case "contact":
        if (!config.contact.visible) return null;
        return (
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
          />
        );
      case "richContent":
        if (!config.richContent || !config.richContent.visible) return null;
        return (
          <RichContentSection 
            heading={config.richContent.heading}
            body={config.richContent.body}
            layout={config.richContent.layout}
            isEditing={false}
          />
        );
      case "landingSection":
        if (!config.landingSection || !config.landingSection.visible) return null;
        return (
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
            isEditing={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar layout={globalSettings.headerLayout} logoUrl={globalSettings.siteLogoUrl} navLinks={globalSettings.navLinks} />
      
      {/* Admin Floating Edit Button */}
      {isAuthenticated && (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2.5">
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white h-14 w-14 p-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
            onClick={() => {
              sessionStorage.setItem("home_editor_scroll", window.scrollY.toString());
              setIsEditing(true);
            }}
            title="ערוך עמוד בית"
          >
            <Edit3 className="w-6 h-6" />
          </Button>
        </div>
      )}

      <main className="flex-grow">
        <div className="flex flex-col w-full">
          {(config.sectionOrder || ["hero", "mainContent", "services", "community", "livePosts", "richContent", "contact"]).map((sectionId) => {
            const isHiddenOnMobile = config.mobileHiddenSections?.includes(sectionId);
            return (
              <div key={sectionId} className={isHiddenOnMobile ? "max-sm:hidden" : undefined}>
                {renderSection(sectionId)}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
