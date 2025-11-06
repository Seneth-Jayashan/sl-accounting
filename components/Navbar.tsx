"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Nav links data
  const navLinks = [
    { title: "මුල් පිටුව", href: "/" },
    { title: "පාඨමාලා", href: "/courses" },
    { title: "අප ගැන", href: "/about" },
    { title: "සම්බන්ධ වන්න", href: "/contact" },
  ];

  // Effect to detect scroll
  useEffect(() => {
    const handleScroll = () => {
      // Set to true if user scrolls more than 10px
      setIsScrolled(window.scrollY > 10);
    };

    // Add scroll listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine text color for links based on scroll state
  const textColorClass = isScrolled
    ? "text-primary-blue"
    : "text-white";
  const mobileMenuIconColor = isScrolled
    ? "text-primary-blue"
    : "text-white";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-white shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* --- LOGO / BRAND NAME (UPDATED) --- */}
        <Link href="/">
          {/* Replaced the text span with the Image component */}
          <Image
            src="/images/Logo.png"
            alt="SL Accounting Logo"
            width={160} // You can adjust this width
            height={40}  // You can adjust this height
            className="object-contain" // Ensures the logo scales nicely
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`font-body hover:text-primary-cerulean transition-colors ${textColorClass}`}
              >
                {link.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <span
              className={`font-body hover:text-primary-cerulean transition-colors ${textColorClass}`}
            >
              ඇතුල් වන්න
            </span>
          </Link>
          <Link href="/register">
            <span className="bg-accent-asparagus text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-green-700 transition-all">
              ලියාපදිංචි වන්න
            </span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <X className={`w-6 h-6 ${mobileMenuIconColor}`} />
            ) : (
              <Menu className={`w-6 h-6 ${mobileMenuIconColor}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full min-h-screen bg-white z-40 flex flex-col items-center pt-10">
          <div className="flex flex-col items-center space-y-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="text-2xl font-body text-primary-blue hover:text-primary-cerulean"
                  onClick={() => setIsOpen(false)} // Close menu on click
                >
                  {link.title}
                </span>
              </Link>
            ))}

            <hr className="w-3/4 my-4 border-primary-blue/10" />

            <Link href="/login">
              <span
                className="text-2xl font-body text-primary-blue hover:text-primary-cerulean"
                onClick={() => setIsOpen(false)}
              >
                ඇතුල් වන්න
              </span>
            </Link>
            <Link href="/register">
              <span
                className="bg-accent-asparagus text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-green-700 transition-all"
                onClick={() => setIsOpen(false)}
              >
                ලියාපදිංචි වන්න
              </span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}