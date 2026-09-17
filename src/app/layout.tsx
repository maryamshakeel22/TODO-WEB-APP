import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers";
import { InstallPrompt } from "@/components/InstallPrompt"; // <-- Import karein
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TaskTogether — Collaborative Todo App",
  description: "Personal and team tasks, groups, and real-time collaboration.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <InstallPrompt /> {/* <-- Yahan render kardein */}
        </ThemeProvider>
      </body>
    </html>
  );
}