import type { Metadata } from "next";
import { Merriweather, Public_Sans } from "next/font/google";
import "./globals.css";

// The two USWDS typefaces. The split carries meaning: Merriweather is used only
// for text quoted from patents, Public Sans for everything the app itself says.
const sans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const serif = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Claim Chart Explorer",
  description:
    "Map patent claim elements to prior-art passages, shaded by TF-IDF match strength.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
