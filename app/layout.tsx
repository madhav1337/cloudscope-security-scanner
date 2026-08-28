import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudScope Security Scanner",
  description: "Scan a public domain's HTTPS posture, security headers, information leakage, and common web endpoints.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
