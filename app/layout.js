import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Store Tracker",
  description: "Daily operations tracker for stores",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
