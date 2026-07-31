import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intent Lock Console",
  description: "Campaign 03 recipient-bound hash-lock workbench",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
