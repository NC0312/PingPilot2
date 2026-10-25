import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./components/providers/SocketProvider";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { OG_IMAGE } from "@/lib/seo";

// Fonts are served from our own files, not fetched from Google at build time. A build on Vercel was handed a newer
// Google Fonts address format that Next 16.1.5 with Turbopack cannot read ("next/font/google queries have exactly one
// entry"), which failed the whole deploy. Geist comes from the "geist" package (variable fonts, the same variables as
// before: --font-geist-sans, --font-geist-mono). Outfit is the variable latin file from @fontsource-variable/outfit.
const outfit = localFont({
  src: "../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  weight: "100 900",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Website Uptime Monitoring & Server Monitoring Tool | Ping Pilott",
    template: "%s · Ping Pilott",
  },
  description:
    "Monitor website and server uptime with checks as often as every minute, instant alerts by email, Slack, Discord and Telegram, a diagnosis of why a check failed, public status pages and CPU, memory and disk metrics. Free plan, no expiry.",
  applicationName: SITE_NAME,
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/logo.png" }],
  },
  // Pages that must not be listed set their own robots; this is the default for everything else
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    title: "Ping Pilott — Website uptime monitoring with instant downtime alerts",
    description:
      "Know your website is down before your customers do. Scheduled checks, instant email alerts, response-time tracking and full incident history.",
    url: "/",
    siteName: SITE_NAME,
    images: [OG_IMAGE],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ping Pilott — Website uptime monitoring",
    description: "Scheduled checks, instant downtime alerts and incident history for websites and servers.",
    images: [OG_IMAGE.url],
  },
};

export const viewport = {
  themeColor: "#07161c",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${outfit.variable} font-sans`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          style={{ zIndex: "var(--z-modal)" }}
        >
          Skip to content
        </a>
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
