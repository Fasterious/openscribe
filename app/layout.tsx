import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { I18nProvider } from "@/lib/i18n/context";
import { SupabaseAuthBannerWrapper } from "@/components/supabase-auth-banner-wrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2F40C2",
};

export const metadata: Metadata = {
  title: "OpenScribe - Transcription gratuite & professionnelle",
  description:
    "Transcription pro avec identification des locuteurs. Jusqu'à 1 Go, durée illimitée. Propulsé par Voxtral (Mistral AI).",
  applicationName: "OpenScribe",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenScribe",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <SupabaseAuthBannerWrapper />
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
