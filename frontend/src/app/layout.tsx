import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { DataStoreProvider } from "@/lib/DataStore";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synthetic Communities",
  description: "A 3D visualization platform for synthetic communities simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <DataStoreProvider>
          <Navbar />
          {children}
        </DataStoreProvider>
      </body>
    </html>
  );
}
