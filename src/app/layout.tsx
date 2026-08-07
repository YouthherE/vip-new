import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "儿童会员管理系统 | 自主管理",
  description: "独立VIP管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} antialiased min-h-screen font-sans bg-bg text-ink`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
