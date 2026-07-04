import type { Metadata } from "next";
import "./globals.css";
import MiniKitProvider from "../components/MiniKitProvider";

export const metadata: Metadata = {
  title: "WLDguard | Institutional Yield",
  description: "Protect. Yield. Compound WLD. The premier automated quant engine for the World Network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
        {/* We wrap the entire app in the MiniKitProvider to wake up the World App SDK */}
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </body>
    </html>
  );
}