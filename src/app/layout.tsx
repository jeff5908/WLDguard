// IMPORTANT: Please UNCOMMENT the line below in your local project before pushing to Vercel!
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
    /* IMPORTANT: For Next.js and Vercel, you MUST replace the <div> tags below 
      with standard <html> and <body> tags! 
      
      We are temporarily using <div> tags here because this preview environment 
      renders inside an existing <div>, which causes a DOM nesting error if 
      an <html> tag is used.
    */
    <div id="html-mock" lang="en">
      <div id="body-mock" className="bg-slate-950 text-white antialiased min-h-screen">
        {children}
      </div>
    </div>
  );
}