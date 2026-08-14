import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Dock } from "@/components/nav/dock";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

/* One display serif for the nameplate and every headline. Instrument Serif only
   ships a 400 weight, so nothing here may ask for bold — the browser would
   synthesise it and smear the thin strokes. Size and tracking carry emphasis. */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-editorial",
  weight: ["500"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Title Fight",
    template: "%s | Title Fight",
  },
  description: "Same name. Different song. Crown the best in an eight-song bracket.",
  applicationName: "Title Fight",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Title Fight",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Title Fight",
    description: "Same name. Different song. Who does it better?",
    siteName: "Title Fight",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F4ED",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /* Font variables go on <html>, not <body>: the theme's --font-* stacks are
     declared on :root, and a custom property can only reference variables
     visible at that level. On <body> they resolve to invalid and silently fall
     back to the default sans. */
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        {/* Art and audio both come straight from Deezer — warm the sockets. */}
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnt-preview.dzcdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://cdnt-preview.dzcdn.net" />
      </head>
      <body>
        <div className="app-shell">{children}</div>
        <Dock />
        <InstallPrompt />
        <Toaster position="top-center" toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
