import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vendor Discovery Tool",
  description: "Search existing vendor records before onboarding a new solution."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
