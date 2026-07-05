// import './globals.css';
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
    <div id="html-mock" lang="en">
      <div id="body-mock" className="bg-slate-950 text-white antialiased min-h-screen">
        {children}
      </div>
    </div>
  );
}