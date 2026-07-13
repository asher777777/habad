import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

import QueryProvider from "@/components/providers/QueryProvider";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { getGlobalSettings } from "@/features/settings/actions";

export async function generateMetadata(): Promise<Metadata> {
  const globalSettings = await getGlobalSettings();
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://azor.hakel.club';

  return {
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: './',
    },
    title: {
      template: '%s | בית חב"ד אזור',
      default: 'בית חב"ד אזור',
    },
    description: 'בית חב"ד אזור - הלב הפועם של הקהילה. מקום של חסד, לימוד וחיבור.',
    icons: globalSettings.siteFaviconUrl ? {
      icon: globalSettings.siteFaviconUrl,
      shortcut: globalSettings.siteFaviconUrl,
      apple: globalSettings.siteFaviconUrl,
    } : undefined,
  };
}



export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const globalSettings = await getGlobalSettings();

  return (
    <html
      lang="he"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${heebo.variable} h-full antialiased theme-${globalSettings.theme || "navy"} overflow-x-hidden`}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XX45B609J4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-XX45B609J4');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <QueryProvider>
          {children}
          <WhatsAppButton 
            phoneNumber={globalSettings.contactPhone}
            defaultEmail={globalSettings.contactEmail}
            facebookUrl={globalSettings.contactFacebook}
            address={globalSettings.contactAddress}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
