import type { Metadata } from "next";
import "./globals.css"; // <-- THIS IS THE MAGIC LINE WE WERE MISSING!
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
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </body>
    </html>
  );
}