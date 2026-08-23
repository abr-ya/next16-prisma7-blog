import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "next-i18next/client";
import { getResources, getT, initServerI18next } from "next-i18next/server";
import { Toaster } from "sonner";
import { fallbackLanguage, navigationNamespace } from "@/app/i18n/settings";
import i18nConfig from "@/i18n.config";
import { buildPageMetadata, siteUrl } from "@/lib/site-metadata";
import "./globals.css";

initServerI18next(i18nConfig);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  ...buildPageMetadata(),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { i18n, lng } = await getT(navigationNamespace);
  const resourceLanguages = lng === fallbackLanguage ? [lng] : [lng, fallbackLanguage];
  const resources = getResources(i18n, [navigationNamespace], resourceLanguages);

  return (
    <html lang={lng}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider
          language={lng}
          resources={resources}
          supportedLngs={i18nConfig.supportedLngs}
          fallbackLng={i18nConfig.fallbackLng}
          defaultNS={i18nConfig.defaultNS}
        >
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
