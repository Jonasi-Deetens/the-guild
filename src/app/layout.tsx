import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { TRPCReactProvider } from "@/trpc/react";
import "@/lib/startup"; // Initialize mission system services

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Guild - Isekai RPG Social Experiment",
  description:
    "A living society where players can be who they want - thieves, heroes, merchants, or anything in between.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} overflow-x-hidden`}>
        <TRPCReactProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900">
              {children}
            </div>
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
