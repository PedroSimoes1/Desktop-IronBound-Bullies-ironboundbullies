import type { Metadata, Viewport } from "next";
import { displayFont, textFont, textFontItalic } from "./fonts";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteChrome } from "@/components/site/SiteChrome";
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
  /**
   * When the Android soft keyboard opens, shrink the layout viewport rather
   * than only the visual one. Without this, Chrome's default leaves anything
   * positioned against the bottom of the screen sitting behind the keyboard,
   * which on the owner screens means the Publish button disappears the moment
   * you start typing. iOS ignores this property, so the approved iPhone
   * behaviour is unchanged.
   */
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${displayFont.variable} ${textFont.variable} ${textFontItalic.variable}`}>
      <body>
        <a href="#main" className={styles.skipLink}>
          Skip to content
        </a>
        {/* The header and footer are rendered here on the server and handed to
            SiteChrome, which leaves them out in the owner area. */}
        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          <main id="main" className={styles.main}>
            {children}
          </main>
        </SiteChrome>
      </body>
    </html>
  );
}
