import type { Metadata } from "next";
// import { Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import SessionProvider from "@/components/providers/session-provider";
import { Toaster } from "react-hot-toast";
// const inter = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auth App",
  description: "Simple authentication app",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
      {/* <body className={`${inter.className}  antialiased`}> */}
        <StoreProvider>
          <Toaster position="top-center" reverseOrder={false} gutter={8} />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            <SessionProvider>{children}</SessionProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
