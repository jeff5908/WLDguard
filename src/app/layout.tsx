import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WLDguard',
  description: 'AI-Powered Yield Optimizer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}