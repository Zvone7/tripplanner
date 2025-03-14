import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserInfo } from './components/UserInfo';
import Link from 'next/link';
import { Home } from 'lucide-react';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Trip planner app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="p-4 flex justify-between items-center">
          <Link href="/trips" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
            <Home className="w-5 h-5" />
            <span className="ml-2 text-sm font-medium">Home</span>
          </Link>
          <UserInfo />
        </header>
        {children}
      </body>
    </html>
  );
}