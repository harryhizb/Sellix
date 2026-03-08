import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Sellix - WhatsApp AI Sales Agent",
  description: "Automate your WhatsApp sales with AI. 24/7 customer support, order management, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${dmSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
