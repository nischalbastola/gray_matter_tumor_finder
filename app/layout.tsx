import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const description =
  "Research tool that classifies a brain MRI slice as glioma, meningioma, pituitary tumor, or no tumor. Inference runs in the browser. Trained on the Nickparvar Brain Tumor MRI Dataset.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Gray Matter — Brain tumor MRI classifier",
    template: "%s · Gray Matter",
  },
  description,
  applicationName: "Gray Matter",
  keywords: [
    "brain tumor MRI",
    "glioma classification",
    "meningioma MRI",
    "pituitary tumor MRI",
    "brain MRI classifier",
    "Nickparvar dataset",
  ],
  authors: [{ name: "Gray Matter" }],
  creator: "Gray Matter",
  category: "education",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Gray Matter",
    title: "Gray Matter — Brain tumor MRI classifier",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Gray Matter — Brain tumor MRI classifier",
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f4f7fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="content" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
