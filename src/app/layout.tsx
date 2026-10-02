import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/providers";
import { themeInitScript } from "@/lib/theme";
import "@/styles/globals.css";

// Condensed display voice: the width axis is driven by font-stretch 62%.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const defaultDescription =
  "Modern ecommerce template built with Next.js 16, React 19, Drizzle, Better Auth, Supabase, and Stripe.";

function getMetadataBase() {
  try {
    return process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  title: "Ecommerce Template",
  description: defaultDescription,
  metadataBase: getMetadataBase(),
  openGraph: {
    title: "Ecommerce Template",
    description: defaultDescription,
    type: "website",
    siteName: "Ecommerce Template",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ecommerce Template",
    description: defaultDescription,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-[1920px] px-6 pb-24 sm:px-12">
            {children}
            <Toaster position="bottom-right" />
            <Analytics />
            <SpeedInsights />
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
