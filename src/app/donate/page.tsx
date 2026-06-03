"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DonationHero } from "@/features/donations/DonationHero";
import { DonationForm } from "@/features/donations/DonationForm";
import { ShieldCheck, Users, Globe, Zap, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const INITIAL_CONTENT = {
  hero: {
    title: "להיות שותפים",
    subtitle: "בהפצת האור",
    description: "בזכות התמיכה שלך, נוכל להמשיך ולהוות בית חם לכל תושב ותושבת באזור, לספק סלי מזון, ייעוץ אישי וקהילה תומכת.",
    imageSrc: "/donation_hero_chabad_1778761136809.png",
  },
  amounts: [
    { value: 18, label: "₪18", impact: "סיוע לארוחת צהריים לסטודנט" },
    { value: 50, label: "₪50", impact: "ערכת בדיקת תפילין ומזוזות" },
    { value: 180, label: "₪180", impact: "סעודת שבת מלאה ל-4 סטודנטים" },
    { value: 500, label: "₪500", impact: "שיעור תורה שבועי לכל הקהילה" },
  ],
  impactCards: [
    {
      title: "קהילה תומכת",
      desc: "מעל 500 תושבים מוצאים אצלנו אוזן קשבת בכל חודש.",
      icon: Users,
    },
    {
      title: "הפצת יהדות",
      desc: "מאות שיעורי תורה, תניא וגמרא לאורך השנה.",
      icon: Zap,
    },
    {
      title: "סיוע הומניטרי",
      desc: "חלוקת סלי מזון וסיוע כלכלי לתושבים נזקקים.",
      icon: Globe,
    },
    {
      title: "ביטחון רוחני",
      desc: "בדיקת אלפי מזוזות ותפילין לשמירה על בתי התושבים.",
      icon: ShieldCheck,
    },
  ],
};

import { getDonatePageContent, saveDonatePageContent } from "./actions";

export default function DonatePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Firebase on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getDonatePageContent();
        
        if (data) {
          // Map back icons from INITIAL_CONTENT
          const impactCards = data.impactCards.map((card: any, index: number) => ({
            ...card,
            icon: INITIAL_CONTENT.impactCards[index].icon
          }));
          setContent({ ...data, impactCards } as any);
        }
      } catch (e) {
        console.error("Failed to fetch from Firebase:", e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchContent();
  }, []);

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleSave = async () => {
    try {
      // Strip non-serializable icons before saving
      const dataToSave = {
        ...content,
        impactCards: content.impactCards.map(({ icon, ...rest }) => rest)
      };
      await saveDonatePageContent(dataToSave);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save to Firestore", e);
      alert("שגיאה בשמירה ל-Firebase. וודא שהגדרת את ה-Environment Variables.");
    }
  };

  if (!isLoaded) return null; 


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
                setContent(INITIAL_CONTENT);
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
        <DonationHero 
          content={content.hero}
          isEditing={isEditing}
          onChange={(newHero) => setContent({ ...content, hero: newHero })}
        />
        
        <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20 mb-24">
          <DonationForm 
            amounts={content.amounts}
            isEditing={isEditing}
            onAmountsChange={(newAmounts) => setContent({ ...content, amounts: newAmounts })}
          />
        </div>

        {/* Impact Section */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-primary">לאן הכסף שלך הולך?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                שקיפות מלאה היא ערך עליון אצלנו. הנה הצצה לאימפקט שאתה יוצר.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {content.impactCards.map((card, index) => (
                <div key={index} className="bg-white p-8 rounded-[2rem] border shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                    <card.icon className="h-7 w-7 text-primary group-hover:text-secondary transition-colors" />
                  </div>
                  {isEditing ? (
                    <input 
                      value={card.title} 
                      onChange={(e) => {
                        const newCards = [...content.impactCards];
                        newCards[index].title = e.target.value;
                        setContent({...content, impactCards: newCards});
                      }}
                      className="w-full text-xl font-bold text-primary mb-3 bg-muted/30 rounded px-2"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-primary mb-3">{card.title}</h3>
                  )}
                  {isEditing ? (
                    <textarea 
                      value={card.desc} 
                      onChange={(e) => {
                        const newCards = [...content.impactCards];
                        newCards[index].desc = e.target.value;
                        setContent({...content, impactCards: newCards});
                      }}
                      className="w-full text-muted-foreground text-sm leading-relaxed bg-muted/30 rounded px-2 min-h-[60px]"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
