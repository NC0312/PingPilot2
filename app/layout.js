import { Geist, Geist_Mono, Poppins, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import SideBar from "./components/Layout/SideBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-manrope',
});

export const metadata = {
  title: "Ping Pilott",
  description:
    "Ping Pilott is a smart server health monitoring tool that checks server uptime, detects downtime instantly, and keeps your infrastructure reliable with real-time status updates. Perfect for developers, sysadmins, and businesses.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${manrope.variable} antialiased`}
      >
        <AuthProvider>
          {/* <SideBar /> */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}