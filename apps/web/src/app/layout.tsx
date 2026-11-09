import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

// Neobrutalist skin for Clerk's sign-in / account UI.
const clerkAppearance = {
  variables: {
    colorPrimary: "#0d0d0d",
    colorBackground: "#ffffff",
    colorText: "#0d0d0d",
    colorInputBackground: "#ffffff",
    colorInputText: "#0d0d0d",
    borderRadius: "0px",
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
  },
  elements: {
    card: { border: "3px solid #0d0d0d", boxShadow: "8px 8px 0 #0d0d0d" },
    formButtonPrimary: {
      background: "#ff6eb4",
      color: "#0d0d0d",
      border: "3px solid #0d0d0d",
      boxShadow: "4px 4px 0 #0d0d0d",
      fontWeight: 700,
      textTransform: "uppercase",
    },
    formFieldInput: { border: "3px solid #0d0d0d" },
  },
};

export const metadata: Metadata = {
  title: "Language Tutor MCP",
  icons: { icon: "/logo.png", shortcut: "/logo.png", apple: "/logo.png" },
  description: "Local-first AI language learning with intelligent spaced drills, stories, and vocabulary mastery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY} appearance={clerkAppearance}>
          <Navbar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
