import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

// SWIPER CSS IMPORTS
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export const metadata: Metadata = {
  title: "SL Accounting by Kalum Waduge",
  description: "A/L ගිණුම්කරණය කලුම් වඩුගේ සමඟ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="si">
      <body className="font-body">
        <Navbar /> {/* Your new transparent navbar */}
        {children}
      </body>
    </html>
  );
}