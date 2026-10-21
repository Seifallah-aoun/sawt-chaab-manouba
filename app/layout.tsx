import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "النائب أسماء درويش | مجلس نواب الشعب بالجمهورية التونسية",
  description: "المنصة الرسمية للنائب أسماء درويش، نائب الشعب عن دائرة معتمدية منوبة - الدندان | مجلس نواب الشعب بالجمهورية التونسية. التواصل المباشر، تقديم العرائض، تسجيل الشكاوى الصوتية، ومتابعة المراسلات الوزارية والمشاريع.",
  icons: {
    icon: [
      { url: "/tunisia-flag.jpg" },
      { url: "/icon.png" },
    ],
    shortcut: "/tunisia-flag.jpg",
    apple: "/tunisia-flag.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
