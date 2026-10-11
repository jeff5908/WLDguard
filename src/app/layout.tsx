import MiniKitProvider from '../components/MiniKitProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          html, body {
            background-color: #020617;
            color: #f8fafc;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: none;
          }
        `}</style>
      </head>
<body className="bg-slate-950 text-white min-h-screen w-full m-0 p-0 overscroll-y-none overflow-y-auto overflow-x-hidden">
        {}
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </body>
    </html>
  );
}
