import React, { memo, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Youtube,
  Instagram,
  ArrowUpRight,
  ArrowUp,
  Copy,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";

// WhatsApp Logo (matches Lucide stroke aesthetic)
const WhatsAppLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// TikTok Logo (matches Lucide stroke aesthetic)
const TiktokIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const QUICK_LINKS = [
  { label: "මුල් පිටුව", to: "/" },
  { label: "පංති", to: "/classes" },
  { label: "පාඨමාලා", to: "/lesson-packs" },
  { label: "පුවත්", to: "/news" },
  { label: "අප ගැන", to: "/about" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
];

const SOCIAL_LINKS = [
  {
    Icon: Youtube,
    href: "https://youtube.com/@slaccounting-kalumwaduge5626?si=Iily215mFs0GvEWz",
    label: "YouTube",
    hoverClass: "hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-400/40",
  },
  {
    Icon: WhatsAppLogo,
    href: "https://whatsapp.com/channel/0029Va5mmNGJf05WQhSOTn1W",
    label: "WhatsApp Channel",
    hoverClass: "hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-400/40",
  },
  {
    Icon: Facebook,
    href: "https://www.facebook.com/share/16WFNtfLDx/?mibextid=wwXIfr",
    label: "Facebook",
    hoverClass: "hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-400/40",
  },
  {
    Icon: TiktokIcon,
    href: "https://www.tiktok.com/@kalumwadugeaccounting?_r=1&_t=ZS-93jMMe9irZ9",
    label: "TikTok",
    hoverClass: "hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-400/40",
  },
  {
    Icon: Instagram,
    href: "https://www.instagram.com/kalum_waduge?igsh=YjE5Y3l4YXFhYzl0&utm_source=qr",
    label: "Instagram",
    hoverClass: "hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-400/40",
  },
];

const FooterComponent: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<"phone" | "email" | null>(null);

  const handleCopy = async (value: string, key: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      id="contact"
      className="w-full bg-gradient-to-b from-[#041C2C] via-[#02121E] to-[#010B12] text-white pt-16 sm:pt-20 pb-10 px-4 sm:px-6 border-t border-white/10 relative overflow-hidden"
    >
      {/* Subtle Dot-Grid Pattern & Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -top-24 -right-24 w-72 h-72 sm:w-[460px] sm:h-[460px] rounded-full bg-brand-cerulean blur-[110px] opacity-20 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 sm:w-[400px] sm:h-[400px] rounded-full bg-brand-coral blur-[110px] opacity-15 pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-12">
          {/* 1. BRAND & INSTRUCTOR COLUMN (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-cerulean to-brand-prussian border border-white/15 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform">
                S
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  SL <span className="text-brand-jasmine">ACCOUNTING</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  A/L Accounting LMS
                </p>
              </div>
            </Link>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-md font-sinhala">
              තාරුණ්‍යයේ ගිණුම්කරණ හඬ. උසස් පෙළ ගිණුම්කරණය සඳහා ශ්‍රී ලංකාවේ විශ්වාසනීයම Online පන්තිය.
            </p>

            {/* Instructor Badge Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-aliceBlue/10 border border-brand-jasmine/25 flex items-center justify-center text-brand-jasmine font-black text-sm shrink-0">
                KW
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-jasmine block">
                  Lead Instructor
                </span>
                <p className="font-bold text-white text-sm sm:text-base truncate">
                  Kalum Waduge
                </p>
                <p className="text-xs text-white/60 truncate">
                  BSc. Accounting (Sp) USJP
                </p>
              </div>
            </div>
          </div>

          {/* 2. QUICK LINKS COLUMN (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-brand-jasmine mb-5 uppercase text-xs tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-white/70 font-sinhala">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-white hover:translate-x-1.5 transition-all inline-flex items-center gap-2.5 group py-0.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cerulean group-hover:bg-brand-coral transition-colors shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. GET IN TOUCH COLUMN (4 cols) */}
          <div className="lg:col-span-4">
            <h3 className="font-bold text-brand-coral mb-5 uppercase text-xs tracking-widest">
              Get in Touch
            </h3>

            <div className="space-y-3 text-sm text-white/75">
              {/* Phone */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <a
                      href="tel:+94768826142"
                      className="block text-white font-bold text-base hover:text-brand-jasmine transition-colors font-mono tabular-nums"
                    >
                      076 88 26 142
                    </a>
                    <span className="text-[11px] text-white/50 block">
                      Mon – Fri, 9:00 AM – 5:00 PM
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("0768826142", "phone")}
                  title="Copy phone number"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors shrink-0"
                >
                  {copiedKey === "phone" ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>

              {/* Email */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <a
                    href="mailto:info@kalumwaduge.com"
                    className="text-white/85 hover:text-white transition-colors truncate text-xs sm:text-sm font-medium"
                  >
                    info@kalumwaduge.com
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("info@kalumwaduge.com", "email")}
                  title="Copy email address"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors shrink-0"
                >
                  {copiedKey === "email" ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>

              {/* Location */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-cerulean/15 text-brand-cerulean flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <span className="text-white/85 text-xs sm:text-sm font-medium">
                  Galle, Sri Lanka
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/10 pt-7 flex flex-col sm:flex-row justify-between items-center gap-5 text-xs text-white/50">
          <p className="text-center sm:text-left leading-relaxed">
            © {new Date().getFullYear()} SL Accounting. All rights reserved.{" "}
            <span className="hidden sm:inline">•</span>{" "}
            <br className="sm:hidden" />
            Developed by{" "}
            <a
              href="https://sjaywebsolutions.lk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-white/75 hover:text-brand-jasmine font-semibold transition-colors"
            >
              <span>S JAY Web Solutions (Pvt) Ltd</span>
              <ArrowUpRight size={13} />
            </a>
          </p>

          <div className="flex items-center gap-2.5">
            {SOCIAL_LINKS.map(({ Icon, href, label, hoverClass }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/65 transition-all active:scale-95 ${hoverClass}`}
              >
                <Icon size={17} />
              </a>
            ))}

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              title="Back to top"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-brand-cerulean border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 ml-1"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);