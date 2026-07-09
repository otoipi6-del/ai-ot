import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-OT — Эксперт по охране труда РБ",
  description: "ИИ-ассистент по охране труда в Республике Беларусь. Анализ нормативной базы, точные ответы, рекомендации.",
  keywords: "охрана труда, Беларусь, ИИ, нормативная база, Трудовой кодекс, безопасность",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
