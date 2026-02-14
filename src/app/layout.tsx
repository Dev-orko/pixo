import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0b0b0b",
};

export const metadata: Metadata = {
  title: "Pixo — Turn Photos into Stunning Grid Art | Free Online Tool",
  description:
    "Pixo is a free, browser-based tool that transforms any photo into beautiful grid-based artwork. Choose from 7 unique pattern styles — lines, dots, waves, crosshatch & more — with real-time preview, fine-tuned controls for contrast, brightness & sharpness, and instant hi-res PNG/JPG/WebP export. No sign-up, no uploads to servers — 100% client-side and private.",
  keywords: [
    "pixo",
    "grid art",
    "image converter",
    "halftone",
    "line art",
    "dot pattern",
    "pixel art",
    "photo to art",
    "image to pixel",
  ],
  icons: {
    icon: [
      { url: "/pixo.ico", sizes: "any" },
    ],
    apple: "/pixo.svg",
  },
  openGraph: {
    title: "Pixo — Turn Photos into Grid Art",
    description:
      "Transform any photo into stunning grid-based art with 7 pattern styles, real-time preview, and instant export.",
    type: "website",
    siteName: "Pixo",
    locale: "en_US",
    images: [
      {
        url: "/pixo_pixo.png",
        width: 150,
        height: 150,
        alt: "Pixo — Turn Photos into Grid Art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixo — Turn Photos into Grid Art",
    description:
      "Transform any photo into stunning grid-based art with 7 pattern styles, real-time preview, and instant export.",
    images: ["/pixo_pixo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  metadataBase: null,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
