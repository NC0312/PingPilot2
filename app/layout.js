import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./components/providers/SocketProvider";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Website Uptime Monitoring & Server Monitoring Tool | Ping Pilott",
    template: "%s · Ping Pilott",
  },
  description:
    "Monitor website and server uptime with checks as often as every minute, instant email alerts when a site goes down, response-time tracking and full incident history. Free plan, no expiry.",
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Ping Pilott — Website uptime monitoring with instant downtime alerts",
    description:
      "Know your website is down before your customers do. Scheduled checks, instant email alerts, response-time tracking and full incident history.",
    url: "/",
    siteName: SITE_NAME,
    images: [{ url: "/banner.png" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ping Pilott — Website uptime monitoring",
    description: "Scheduled checks, instant downtime alerts and incident history for websites and servers.",
    images: ["/banner.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
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
