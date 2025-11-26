export default function Footer() {
  return (
    <footer
      className="
        bg-gradient-to-r from-[#05668A] to-[#EF8D8E]
        text-white py-14 mt-20 rounded-t-3xl shadow-xl backdrop-blur-xl mt-40
      "
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 ">

        {/* Brand Section */}
        <div>
          <h2 className="text-2xl font-bold mb-3">SL Accounting</h2>
          <p className="text-sm leading-6 opacity-90">
            A/L Accounting Online Classes by Kalum Waduge — helping Sinhala-speaking
            students master Accounting with clear explanations, structured lessons,
            and a modern online learning experience.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#02121E]">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-[#02121E] transition">Home</li>
            <li className="hover:text-[#02121E] transition">Online Classes</li>
            <li className="hover:text-[#02121E] transition">YouTube Lessons</li>
            <li className="hover:text-[#02121E] transition">Past Papers</li>
            <li className="hover:text-[#02121E] transition">Contact</li>
          </ul>
        </div>

        {/* Why Join */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#02121E]">Why Join?</h3>
          <ul className="space-y-2 text-sm opacity-95">
            <li>✔ Clear Sinhala Explanations</li>
            <li>✔ A/L Accounting Theory + Practicals</li>
            <li>✔ Past Paper Discussions</li>
            <li>✔ Learn Anytime / Anywhere</li>
            <li>✔ Modern teaching style</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#02121E]">Contact</h3>
          <p className="text-sm opacity-90">For class enrollment & inquiries:</p>

          <p className="mt-3 text-sm">📩 slaccounting.lk@gmail.com</p>
          <p className="text-sm mt-1">📞 +94 76 000 0000</p>

          <button
            className="
              mt-5 bg-[#FFE787] text-black font-semibold px-5 py-2 rounded-full 
              hover:bg-white hover:text-[#02121E] transition
            "
          >
            Join වෙන්න
          </button>
        </div>

      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-white/40 mt-10" />

      {/* Bottom Text */}
      <div className="text-center text-xs mt-6 opacity-80">
        © {new Date().getFullYear()} SL Accounting — Kalum Waduge. All Rights Reserved.
      </div>
    </footer>
  );
}
