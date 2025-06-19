import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Onest } from "next/font/google";

const onestFont = Onest({
  subsets: ["cyrillic"],
});

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Admin Dashboard for event aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${onestFont.className} ${onestFont.className} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
