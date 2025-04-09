import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans as FontSans } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "OpenCV Image Editor",
  description:
    "A single-page web app built with OpenCV.js for adjusting images. Supports brightness, contrast, saturation, and filter controls, with a strong focus on smooth, responsive UI/UX.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={cn(
          "min-h-dvh bg-gray-50 font-sans antialiased ",
          fontSans.variable,
        )}
        suppressHydrationWarning>
        <main className=' flex w-full flex-col items-center'>
          <div className='size-full max-w-md overflow-hidden bg-white'>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
