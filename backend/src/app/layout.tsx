import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Billboardify - Billboard Marketplace & Design Studio",
  description: "Create, customize, and publish your billboard designs effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF9FE] text-slate-800 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
