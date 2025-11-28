import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'මුල් පිටුව', href: '/' }, // Updated to / for home
    { name: 'අපි ගැන', href: '/#about' }, // Anchor links need / prefix if on other pages
    { name: 'පාඨමාලා', href: '/#courses' },
    { name: 'විශේෂාංග', href: '/#features' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4' : 'py-6'
          }`}
      >
        <div className="container mx-auto px-6 flex justify-center">
          <div className={`
            w-full max-w-5xl backdrop-blur-xl border transition-all duration-300 rounded-full px-6 py-3 flex items-center justify-between
            ${isScrolled
              ? 'bg-white/80 border-white/50 shadow-lg shadow-[#05668A]/5'
              : 'bg-white/60 border-white/30 shadow-sm'
            }
          `}>

            {/* Logo Area */}
            <Link to="/" className="flex items-center gap-2 group">
              {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#05668A] to-[#053A4E] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                S
              </div>
              <div className="text-lg font-bold text-[#053A4E] tracking-tight leading-none">
                SL <span className="text-[#05668A]">ACCOUNTING</span>
              </div> */}
              <div className='w-24 h-12'>
                <img src="/kalumwaduge Logo.png" alt="SL Accounting Logo" className="w-full h-full object-cover"/>
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex gap-8 text-sm font-medium text-[#053A4E] font-sinhala items-center">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover:text-[#05668A] transition-colors relative group py-2"
                >
                  {link.name}
                  <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-[#05668A] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
                </a>
              ))}
            </div>

            {/* Action Button & Mobile Toggle */}
            <div className="flex items-center gap-4">
              {/* Desktop Login Button - Changed to Link */}
              <Link 
                to="/login"
                className="hidden md:flex bg-[#053A4E] hover:bg-[#05668A] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all transform hover:scale-105 items-center gap-2 shadow-lg shadow-[#053A4E]/20 hover:shadow-[#05668A]/30"
              >
                LMS Login <ArrowRight size={14} />
              </Link>

              <button
                className="md:hidden text-[#053A4E] p-2 hover:bg-[#05668A]/10 rounded-full transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl md:hidden flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <div className="text-xl font-bold text-[#053A4E]">Menu</div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-8 p-8">
              {navLinks.map((link, idx) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold text-[#053A4E] font-sinhala hover:text-[#05668A] transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}

              {/* Mobile Login Button - Changed to Link */}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full max-w-xs">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full bg-[#053A4E] text-white py-4 rounded-xl font-bold text-lg shadow-xl"
                >
                  LMS Login
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};