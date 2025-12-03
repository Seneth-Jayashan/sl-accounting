import React, { useState } from "react";
//import Swal from "sweetalert2";
import {

  FaUser,
  FaComment,
} from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { PiPhoneCallFill } from "react-icons/pi";

export default function ContactUsForm(): React.ReactElement {
  type InputState = {
    name: string;
    email: string;
    phoneNumber: string;
    message: string;
  };

  const [input, setInputs] = useState<InputState>({
    name: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  const [isSubmitting] = useState(false);

 /* const validate = (values: InputState) => {
    const errors: string[] = [];
    if (!values.name.trim()) errors.push("නම අවශ්‍යයි.");
    if (!values.email.trim()) errors.push("Email එක අවශ්‍යයි.");
    else if (!/^[\w-.]+@[\w-]+\.[A-Za-z]{2,}$/.test(values.email))
      errors.push("වලංගු Email ලිපිනයක් ඇතුළත් කරන්න.");
    if (!values.phoneNumber.trim()) errors.push("දුරකථන අංකය අවශ්‍යයි.");
    else if (!/^\d{10,15}$/.test(values.phoneNumber.replace(/\s+/g, "")))
      errors.push("වලංගු දුරකථන අංකයක් (10–15 ලකුණු) ඇතුළත් කරන්න.");
    if (!values.message.trim()) errors.push("පණිවිඩයක් අවශ්‍යයි.");
    else if (values.message.trim().length < 15)
      errors.push("පණිවිඩයේ දිග අවම වශයෙන් අක්ෂර 15 ක් විය යුතුයි.");
    return errors;
  };*/

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target as HTMLInputElement & HTMLTextAreaElement;

    if (name === "phoneNumber") {
      value = value.replace(/\D/g, "");
    }

    if (name === "email") {
      value = value.replace(/\s+/g, "");
    }

    setInputs((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return;
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-aliceBlue text-brand-prussian font-sans">
      <main className="flex-grow">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          {/* Contact Header */}
          <header className="text-center mb-12 mt-6">
            <h1 className="text-4xl md:text-5xl font-bold text-[#053A4E] mb-3">
              අපව සම්බන්ධ කරගන්න
            </h1>
            <p className="text-xl text-[#053A4E] opacity-80 max-w-2xl mx-auto">
              ප්‍රශ්න හෝ අදහස් තියෙනවද? ඔබගෙන් ඇසීමට අපි කැමතියි!
            </p>
          </header>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Contact Info Section */}
            <div className="w-full lg:w-2/5">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full">
                <h2 className="text-3xl font-semibold text-[#053A4E] mb-6">
                  අප හා සම්බන්ධ වන්න
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <FaLocationDot className="text-2xl text-brand-coral mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        මුලස්ථාන කාර්යාලය
                      </h3>
                      <p className="text-brand-prussian opacity-80">
                        කොළඹ, ශ්‍රී ලංකාව
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MdEmail className="text-2xl text-brand-prussian mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        අපට Email කරන්න
                      </h3>
                      <a
                        href="mailto:info@slaccounting.lk"
                        className="text-brand-prussian opacity-80 hover:text-brand-cerulean transition-colors"
                      >
                        info@slaccounting.lk
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <PiPhoneCallFill className="text-2xl text-brand-cerulean mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        අපව අමතන්න
                      </h3>
                      <a
                        href="tel:+94768826142"
                        className="text-brand-prussian opacity-80 hover:text-brand-cerulean transition-colors inline-block"
                      >
                        0768826142
                      </a>
                      <div className="text-xs opacity-60 mt-1">
                        සඳු–සිකු, පෙ.ව 9 – ප.ව 5
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="w-full lg:w-3/5">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full">
                <h2 className="text-3xl font-semibold text-[#053A4E] mb-6">
                  ඔබගේ පණිවිඩය අප වෙත එවන්න
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="name"
                      className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1"
                    >
                      සම්පූර්ණ නම
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                        placeholder="ඔබගේ නම"
                        value={input.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1"
                    >
                      Email ලිපිනය
                    </label>
                    <div className="relative">
                      <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                        placeholder="your.email@example.com"
                        value={input.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="phoneNumber"
                      className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1"
                    >
                      දුරකථන අංකය
                    </label>
                    <div className="relative">
                      <PiPhoneCallFill className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                        placeholder="070 123 4567"
                        value={input.phoneNumber}
                        onChange={handleChange}
                        pattern="[\+]\d{2}\s\d{2}\s\d{3}\s\d{4}|[\+]\d{11}|\d{10}"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="message"
                      className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1"
                    >
                      ඔබගේ පණිවිඩය
                    </label>
                    <div className="relative">
                      <FaComment className="absolute left-3 top-3 text-[#05668A]" />
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-3 rounded-xl outline-none transition-all shadow-sm text-sm"
                        placeholder="අපෙන් ඔබට උදව් කළ හැක්කේ කුමක්ද?"
                        value={input.message}
                        onChange={handleChange}
                        required
                        minLength={15}
                        maxLength={500}
                      ></textarea>
                    </div>
                    <div className="flex justify-between mt-1 text-sm text-[#053A4E] opacity-70">
                      <span>අවම අක්ෂර 15 ක්</span>
                      <span>{input.message.length}/500 අක්ෂර</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 ${
                      isSubmitting
                        ? "disabled:opacity-70 disabled:cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "පණිවිඩය යවන්න"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
