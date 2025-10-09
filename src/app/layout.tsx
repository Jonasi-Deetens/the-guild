import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { TRPCReactProvider } from "@/trpc/react";

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
      <body className={inter.className}>
        <TRPCReactProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
              {children}
            </div>
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
