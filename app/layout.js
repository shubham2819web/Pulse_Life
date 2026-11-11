import Script from "next/script";
import "./globals.css";
import { CHAT_WIDGET_ENABLED } from "@/lib/site-config";


export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Pulse & Life Medicine Trading L.L.C. | Dubai",
    template: "%s | Pulse & Life Medicine Trading L.L.C.",
  },
  description:
    "Pulse & Life Medicine Trading L.L.C. is a Dubai-based trading company for para pharmaceutical products, medical and surgical articles, and paper products.",
  applicationName: "Pulse & Life Medicine Trading L.L.C.",
  keywords: [
    "Pulse & Life", "medicine trading Dubai", "para pharmaceutical products trading",
    "medical articles trading", "surgical articles", "paper products trading", "Dubai UAE",
  ],
  openGraph: {
    title: "Pulse & Life Medicine Trading L.L.C. | Dubai",
    description:
      "A Dubai-based trading company for para pharmaceutical products, medical and surgical articles, and paper products.",
    type: "website",
    locale: "en_AE",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#092b43",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-chat-widget={CHAT_WIDGET_ENABLED ? "enabled" : "disabled"}>
        {children}
        <Script src="/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
