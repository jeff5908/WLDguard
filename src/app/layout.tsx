import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-950 text-white min-h-screen w-full">
      <style>{`
        html, body {
          background-color: #020617 !important;
          color: #f8fafc !important;
          margin: 0;
          padding: 0;
        }
      `}</style>
      {children}
    </div>
  );
}