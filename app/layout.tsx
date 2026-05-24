import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

/* ─── Fonts ──────────────────────────────────────────────────────── */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

/* ─── Metadata ───────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "KathaiKavi – Multilingual AI Storytelling",
  description:
    "Speak your idea, choose a language, and watch KathaiKavi weave enchanting children's stories powered by Google Gemini AI. Supports Tamil, Hindi, and English.",
  keywords: [
    "AI stories",
    "multilingual storytelling",
    "Tamil stories",
    "Hindi stories",
    "children stories AI",
    "Gemini AI",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "KathaiKavi – Multilingual AI Storytelling",
    description: "AI-powered children's stories in Tamil, Hindi & English",
    type: "website",
  },
};

/* ─── Root Layout ────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
