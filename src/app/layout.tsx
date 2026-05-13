import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Freeman Analytics — TOR (Auth v2)",
  description: "Upload injection molding TOR spreadsheets and explore downtime analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ClerkProvider
          appearance={{
            variables: { colorPrimary: "#3b82f6" },
            elements: {
              userButtonPopoverCard: "border border-[#243041]",
            },
          }}
        >
          <SiteHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
