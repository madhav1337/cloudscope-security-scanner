import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudScope Security Scanner",
  description: "Get a fast, actionable security posture report for any authorized public domain—no account required.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
