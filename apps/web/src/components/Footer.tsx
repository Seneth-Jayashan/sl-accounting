import React, { memo } from 'react';
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

const FooterComponent: React.FC = () => {
  return (
    <footer id="contact" className="w-full bg-[#02121E] text-white pt-16 sm:pt-20 pb-10 px-6 border-t border-[#05668A]/20 relative overflow-hidden">
      
      {/* Optimized Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-[#05668A] blur-[80px] sm:blur-[120px] will-change-transform"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-[#053A4E] blur-[60px] sm:blur-[100px] will-change-transform"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 mb-12 md:mb-16">

          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#05668A] to-[#053A4E] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                S
              </div>
              <h2 className="text-2xl font-bold tracking-tight">SL <span className="text-[#FFE787]">ACCOUNTING</span></h2>
            </div>

            <p className="text-[#E8EFF7]/70 text-sm sm:text-base leading-relaxed max-w-sm font-sinhala">
              තාරුණ්‍යයේ ගිණුම්කරණ හඩ. උසස් පෙළ ගිණුම්කරණය සඳහා ශ්‍රී ලංකාවේ විශ්වාසනීයම Online පන්තිය.
            </p>

            <div className="pt-4">
              <p className="text-[10px] text-[#05668A] font-bold uppercase tracking-widest mb-3">Led By</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8EFF7]/10 flex items-center justify-center text-[#FFE787] font-bold border border-[#E8EFF7]/20">KW</div>
                <div>
                  <p className="font-bold text-white text-sm sm:text-base">Kalum Waduge</p>
                  <p className="text-xs text-[#E8EFF7]/60">BSc. Accounting Sp. USJP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Column */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-[#FFE787] mb-6 md:mb-8 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-4 text-sm text-[#E8EFF7]/70 font-sinhala">
              <li>
                <Link to="/" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                  මුල් පිටුව
                </Link>
              </li>
              <li>
                <Link to="/classes" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                  පාඨමාලා
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                  අප ගැන
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                  LMS Login
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-4">
            <h4 className="font-bold text-[#EF8D8E] mb-6 md:mb-8 uppercase text-xs tracking-widest">Get in Touch</h4>
            <ul className="space-y-6 text-sm text-[#E8EFF7]/70">
              <li className="flex items-start gap-4 group">
                <div className="p-3 rounded-lg bg-[#05668A]/10 group-hover:bg-[#05668A]/20 transition-colors text-[#05668A]">
                  <Phone size={18} />
                </div>
                <div>
                  <a href="tel:+94768826142" className="block text-white font-bold text-lg hover:text-[#FFE787] transition-colors">076 88 26 142</a>
                  <span className="text-xs text-[#E8EFF7]/50">Mon - Fri, 9am - 5pm</span>
                </div>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="p-3 rounded-lg bg-[#05668A]/10 group-hover:bg-[#05668A]/20 transition-colors text-[#05668A]">
                  <Mail size={18} />
                </div>
                <a href="mailto:info@kalumwaduge.com" className="group-hover:text-white transition-colors">info@kalumwaduge.com</a>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="p-3 rounded-lg bg-[#05668A]/10 group-hover:bg-[#05668A]/20 transition-colors text-[#05668A]">
                  <MapPin size={18} />
                </div>
                <span className="group-hover:text-white transition-colors">Colombo, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E8EFF7]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#E8EFF7]/40 text-center md:text-left">
          <p>© {new Date().getFullYear()} SL Accounting. All rights reserved.<br className="md:hidden"/> Developed by <span className="text-white/60"> <a href='https://onexuniverse.com' target='_blank'>One X Universe (Pvt) Ltd</a></span></p>

          <div className="flex gap-4">
            {[
              { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
              { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
              { Icon: Instagram, href: "https://instagram.com", label: "Instagram" }
            ].map(({ Icon, href, label }, i) => (
              <a 
                key={i} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={label}
                className="p-2 hover:bg-[#E8EFF7]/10 rounded-full transition-colors text-[#E8EFF7]/60 hover:text-white hover:scale-110 transform"
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