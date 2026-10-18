import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { CursorGlow } from "@/components/cursor-glow";
import { AuthProvider } from "@/components/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuizGen — Intelligent Quiz Generator",
  description: "Upload documents and auto-generate quizzes with AI-powered NLP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <CursorGlow />
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <footer className="border-t border-border">
                <div className="max-w-6xl mx-auto px-6 py-10 text-center text-sm text-muted-foreground">
                  QuizGen — Open-source quiz generator
                </div>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

