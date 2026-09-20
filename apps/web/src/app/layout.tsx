import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Language Tutor MCP",
  description: "Local-first AI language learning with intelligent spaced drills, stories, and vocabulary mastery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY}>
          <Navbar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
