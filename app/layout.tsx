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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
