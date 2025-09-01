import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Import Provider sẽ tạo ở bước sau
import I18nProvider from "@/components/ui/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TomiWixoss",
  description: "Game thẻ bài Wixoss!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="vi" sẽ là mặc định, i18next sẽ tự cập nhật sau
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        {/* Bọc children trong I18nProvider */}
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
