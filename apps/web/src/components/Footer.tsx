import React from 'react';
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="w-full bg-[#02121E] text-white pt-20 pb-10 px-6 border-t border-[#05668A]/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#05668A] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#053A4E] blur-[100px]"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-12 gap-12 mb-16">

          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#05668A] to-[#053A4E] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                S
              </div>
              <h2 className="text-2xl font-bold tracking-tight">SL <span className="text-[#FFE787]">ACCOUNTING</span></h2>
            </div>

            <p className="text-[#E8EFF7]/70 text-base leading-relaxed max-w-sm font-sinhala">
              තාරුණ්‍යයේ ගිණුම්කරණ හඩ. උසස් පෙළ ගිණුම්කරණය සඳහා ශ්‍රී ලංකාවේ විශ්වාසනීයම Online පන්තිය.
            </p>

            <div className="pt-4">
              <p className="text-xs text-[#05668A] font-bold uppercase tracking-widest mb-3">Led By</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8EFF7]/10 flex items-center justify-center text-[#FFE787] font-bold border border-[#E8EFF7]/20">KW</div>
                <div>
                  <p className="font-bold text-white">Kalum Waduge</p>
                  <p className="text-xs text-[#E8EFF7]/60">BSc. Accounting Sp. USJ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Column */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-[#FFE787] mb-8 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-4 text-sm text-[#E8EFF7]/70 font-sinhala">
              {['මුල් පිටුව', 'පාඨමාලා', 'අප ගැන', 'LMS Login'].map((item, i) => (
                <li key={i}>
                  <a href="#" className="hover:text-white hover:translate-x-2 transition-all inline-flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#05668A] group-hover:bg-[#EF8D8E] transition-colors"></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-4">
            <h4 className="font-bold text-[#EF8D8E] mb-8 uppercase text-xs tracking-widest">Get in Touch</h4>
            <ul className="space-y-6 text-sm text-[#E8EFF7]/70">
              <li className="flex items-start gap-4 group">
                <div className="p-3 rounded-lg bg-[#05668A]/10 group-hover:bg-[#05668A]/20 transition-colors text-[#05668A]">
                  <Phone size={18} />
                </div>
                <div>
                  <span className="block text-white font-bold text-lg">076 88 26 142</span>
                  <span className="text-xs text-[#E8EFF7]/50">Mon - Fri, 9am - 5pm</span>
                </div>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="p-3 rounded-lg bg-[#05668A]/10 group-hover:bg-[#05668A]/20 transition-colors text-[#05668A]">
                  <Mail size={18} />
                </div>
                <span className="group-hover:text-white transition-colors">info@slaccounting.lk</span>
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
        <div className="border-t border-[#E8EFF7]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#E8EFF7]/40">
          <p>© 2025 SL Accounting. All rights reserved.</p>

          <div className="flex gap-4">
            {[Facebook, Youtube, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="p-2 hover:bg-[#E8EFF7]/10 rounded-full transition-colors text-[#E8EFF7]/60 hover:text-white">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};