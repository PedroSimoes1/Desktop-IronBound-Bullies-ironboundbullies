import type { Metadata, Viewport } from "next";
import { displayFont, textFont, textFontItalic } from "./fonts";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { isProduction, site } from "@/lib/site";
import "@/styles/globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  // Only the live production deployment may be indexed. Previews and local builds stay out of Google.
  robots: isProduction ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${displayFont.variable} ${textFont.variable} ${textFontItalic.variable}`}>
      <body>
        <a href="#main" className={styles.skipLink}>
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className={styles.main}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
