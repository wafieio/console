import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wafie Console - Dashboard",
  description: "Kubernetes Native Web Application and API Security Platform",
};

// Log on server startup
if (typeof window === 'undefined') {
  console.log('🚀 Wafie Console Server Started');
  console.log('📡 WAFIE_API_HOST:', process.env.WAFIE_API_HOST || '(not set)');
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
