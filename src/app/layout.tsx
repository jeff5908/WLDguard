export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          html, body {
            background-color: #020617;
            color: #f8fafc;
          }
        `}</style>
      </head>
      <body className="bg-slate-950 text-white min-h-screen w-full m-0 p-0">
        {children}
      </body>
    </html>
  );
}