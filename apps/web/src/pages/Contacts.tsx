import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

import { FaUser, FaComment } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { PiPhoneCallFill } from "react-icons/pi";

// Base URL for direct axios calls (skipping interceptors)
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";


export default function ContactUsForm(): React.ReactElement {
  type InputState = {
    name: string;
    email: string; // frontend email → backend "gmail"
    phoneNumber: string;
    message: string;
  };

  const [input, setInputs] = useState<InputState>({
    name: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // HANDLE INPUT CHANGES
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;

    if (name === "phoneNumber") value = value.replace(/\D/g, "");
    if (name === "email") value = value.replace(/\s+/g, "");

    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // SUBMIT FORM
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // backend expects gmail instead of email
      const payload = {
        name: input.name,
        gmail: input.email,
        phoneNumber: input.phoneNumber,
        message: input.message,
      };

      const response = await axios.post(
        `${API_BASE}/contact/`,
        payload
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "පණිවිඩය යවා අවසන්!",
          text: "අපගේ කණ්ඩායම ඉක්මනින්ම ඔබව සම්බන්ධ කරගනී.",
          confirmButtonColor: "#053A4E",
        });

        // RESET FORM
        setInputs({
          name: "",
          email: "",
          phoneNumber: "",
          message: "",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "දෝෂයක් සිදු විය!",
        text: "පණිවිඩය යැවීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsSubmitting(false);
    }
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

          <div className="flex flex-col lg:flex-row gap-8">
            {/* CONTACT INFO */}
            <div className="w-full lg:w-2/5">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full">
                <h2 className="text-3xl font-semibold text-[#053A4E] mb-6">
                  අප හා සම්බන්ධ වන්න
                </h2>

                <div className="space-y-6">
                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <FaLocationDot className="text-2xl text-brand-coral mt-1" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        මුලස්ථාන කාර්යාලය
                      </h3>
                      <p className="opacity-80">කොළඹ, ශ්‍රී ලංකාව</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <MdEmail className="text-2xl text-brand-prussian mt-1" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        අපට Email කරන්න
                      </h3>
                      <a
                        href="mailto:info@slaccounting.lk"
                        className="opacity-80 hover:text-brand-cerulean"
                      >
                        info@slaccounting.lk
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <PiPhoneCallFill className="text-2xl text-brand-cerulean mt-1" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        අපව අමතන්න
                      </h3>
                      <a
                        href="tel:+94768826142"
                        className="opacity-80 hover:text-brand-cerulean"
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

            {/* CONTACT FORM */}
            <div className="w-full lg:w-3/5">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full">
                <h2 className="text-3xl font-semibold text-[#053A4E] mb-6">
                  ඔබගේ පණිවිඩය අප වෙත එවන්න
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* NAME */}
                  <div>
                    <label className="text-[10px] md:text-xs font-bold ml-1">
                      සම්පූර්ණ නම
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="text"
                        name="name"
                        placeholder="ඔබගේ නම"
                        value={input.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={50}
                        className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-2.5 rounded-xl focus:border-[#05668A] shadow-sm"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="text-[10px] md:text-xs font-bold ml-1">
                      Email ලිපිනය
                    </label>
                    <div className="relative">
                      <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="email"
                        name="email"
                        placeholder="your.email@example.com"
                        value={input.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-2.5 rounded-xl focus:border-[#05668A] shadow-sm"
                      />
                    </div>
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="text-[10px] md:text-xs font-bold ml-1">
                      දුරකථන අංකය
                    </label>
                    <div className="relative">
                      <PiPhoneCallFill className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="070 123 4567"
                        value={input.phoneNumber}
                        onChange={handleChange}
                        pattern="\d{10}"
                        required
                        className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-2.5 rounded-xl focus:border-[#05668A] shadow-sm"
                      />
                    </div>
                  </div>

                  {/* MESSAGE */}
                  <div>
                    <label className="text-[10px] md:text-xs font-bold ml-1">
                      ඔබගේ පණිවිඩය
                    </label>
                    <div className="relative">
                      <FaComment className="absolute left-3 top-3 text-[#05668A]" />
                      <textarea
                        name="message"
                        rows={5}
                        placeholder="අපෙන් ඔබට උදව් කළ හැක්කේ කුමක්ද?"
                        value={input.message}
                        onChange={handleChange}
                        required
                        minLength={15}
                        maxLength={500}
                        className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-3 rounded-xl focus:border-[#05668A] shadow-sm"
                      ></textarea>
                    </div>

                    <div className="flex justify-between mt-1 text-sm opacity-70">
                      <span>අවම අක්ෂර 15 ක්</span>
                      <span>{input.message.length}/500</span>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
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
