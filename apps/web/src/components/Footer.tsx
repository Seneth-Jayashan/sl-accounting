import React, { memo } from 'react';
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

// We will use a standard path for the actual WhatsApp Logo to ensure recognition
const WhatsAppLogo = ({ size = 24 }: { size?: number }) => (
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

// Custom Icon for TikTok (Matches Lucide Style)
const TiktokIcon = ({ size = 24 }: { size?: number }) => (
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

const FooterComponent: React.FC = () => {

  // Social Media Links Configuration
  const socialLinks = [
    {
      Icon: Youtube,
      href: "https://youtube.com/@slaccounting-kalumwaduge5626?si=Iily215mFs0GvEWz",
      label: "YouTube"
    },
    {
      Icon: WhatsAppLogo,
      href: "https://whatsapp.com/channel/0029Va5mmNGJf05WQhSOTn1W",
      label: "WhatsApp Channel"
    },
    {
      Icon: Facebook,
      href: "https://www.facebook.com/share/16WFNtfLDx/?mibextid=wwXIfr",
      label: "Facebook"
    },
    {
      Icon: TiktokIcon,
      href: "https://www.tiktok.com/@kalumwadugeaccounting?_r=1&_t=ZS-93jMMe9irZ9",
      label: "TikTok"
    },
    {
      Icon: Instagram,
      href: "https://www.instagram.com/kalum_waduge?igsh=YjE5Y3l4YXFhYzl0&utm_source=qr",
      label: "Instagram"
    }
  ];

  return (
    <footer id="contact" className="w-full bg-[#0d4b5b] text-white pt-16 sm:pt-20 pb-10 px-6 border-t border-white/5 relative overflow-hidden">

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 mb-12 md:mb-16">

          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6db3c2] flex items-center justify-center text-white font-bold text-xl shadow-sm">
                S
              </div>
              <h2 className="text-2xl font-bold tracking-tight">SL <span className="text-[#f88f89]">ACCOUNTING</span></h2>
            </div>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-sm font-sinhala">
              තාරුණ්‍යයේ ගිණුම්කරණ හඬ, උසස් පෙළ ගිණුම්කරණය සඳහා ශ්‍රී ලංකාවේ විශ්වාසනීයම Online පන්තිය.
            </p>

            <div className="pt-4">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3">Led By</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">KW</div>
                <div>
                  <p className="font-bold text-white text-sm sm:text-base">Kalum Waduge</p>
                  <p className="text-xs text-white/60">BSc. Accounting (Sp) USJP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Column */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-[#f88f89] mb-6 md:mb-8 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-4 text-sm text-white/80 font-sinhala">
              <li>
                <Link to="/" className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-[#f88f89] transition-colors"></span>
                  මුල් පිටුව
                </Link>
              </li>
              <li>
                <Link to="/classes" className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-[#f88f89] transition-colors"></span>
                  පාඨමාලා
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-[#f88f89] transition-colors"></span>
                  අපි ගැන
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-[#f88f89] transition-colors"></span>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-[#f88f89] transition-colors"></span>
                  Privacy & Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-4">
            <h4 className="font-bold text-[#f88f89] mb-6 md:mb-8 uppercase text-xs tracking-widest">Get in Touch</h4>
            <ul className="space-y-6 text-sm text-white/80">
              <li className="flex items-start gap-4 group">
                <Phone size={18} className="text-white mt-1 flex-shrink-0" />
                <div>
                  <a href="tel:+94768826142" className="block text-white font-bold text-base hover:text-[#f88f89] transition-colors mb-1">076 88 26 142</a>
                  <span className="text-xs text-white/60">Mon - Fri, 9am - 5pm</span>
                </div>
              </li>
              <li className="flex items-center gap-4 group">
                <Mail size={18} className="text-white flex-shrink-0" />
                <a href="mailto:info@kalumwaduge.com" className="group-hover:text-white transition-colors">info@kalumwaduge.com</a>
              </li>
              <li className="flex items-center gap-4 group">
                <MapPin size={18} className="text-white flex-shrink-0" />
                <span className="group-hover:text-white transition-colors">Galle, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/50 text-center md:text-left">
          <p>© {new Date().getFullYear()} SL Accounting. All rights reserved.<br className="md:hidden" /> Developed by <span className="text-white/80"> <a href='https://onexuniverse.com' target='_blank' rel="noopener noreferrer">One X Universe (Pvt) Ltd</a></span></p>

          <div className="flex gap-4">
            {socialLinks.map(({ Icon, href, label }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white/60 hover:text-white hover:scale-110 transition-all transform"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// Export as a Named Export wrapped in memo
export const Footer = memo(FooterComponent);