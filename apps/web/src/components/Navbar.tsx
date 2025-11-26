import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="
        fixed top-4 left-1/2 transform -translate-x-1/2 
        w-[95%] md:w-[90%] lg:w-[85%]
        bg-gradient-to-r from-[#05668A] to-[#EF8D8E]
        backdrop-blur-xl shadow-lg rounded-3xl z-50
      "
    >
      <div className="flex justify-between items-center px-6 py-4">
        
        {/* Logo */}
        <h1 className="text-white font-bold text-xl">
          SL ACCOUNTING
        </h1>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-10 text-white font-semibold">
          <li className="hover:text-[#02121E] transition">Home</li>
          <li className="hover:text-[#02121E] transition">Class</li>
          <li className="hover:text-[#02121E] transition">Contact</li>

          {/* Join Button */}
          <li>
            <button
              className="
                bg-[#02121E] px-5 py-2 rounded-full text-white 
                hover:bg-white hover:text-[#02121E]
                transition font-semibold
              "
            >
              Join වෙන්න
            </button>
          </li>

          {/* Login Button */}
          <li>
            <button
              className="
                bg-white px-5 py-2 rounded-full text-[#795056] 
                hover:bg-[#F7C6C7] transition font-semibold
              "
            >
              Login
            </button>
          </li>
        </ul>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white text-3xl"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-4 text-white font-medium">
          <a className="hover:text-[#02121E]">Home</a>
          <a className="hover:text-[#02121E]">Class</a>
          <a className="hover:text-[#02121E]">Contact</a>

          <button className="bg-[#02121E] px-5 py-2 rounded-full">
            Join වෙන්න
          </button>

          <button className="bg-white text-[#795056] px-5 py-2 rounded-full">
            Login
          </button>
        </div>
      )}
    </nav>
  );
}
