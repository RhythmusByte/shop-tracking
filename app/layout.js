import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ThemeScript from "@/components/ThemeScript";

export const metadata = {
  title: "Store Tracker",
  description: "Daily operations tracker for stores",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body className="flex flex-col min-h-screen">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6 animate-page flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
