import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freeman Analytics",
  description:
    "Manufacturing intelligence: TOR downtime, exterior alarms & faults, and supervisor overtime—imports, dashboards, and governed lookup data in one place.",
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
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
