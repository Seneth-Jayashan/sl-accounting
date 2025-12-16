import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

import { FaUser, FaComment } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { PiPhoneCallFill } from "react-icons/pi";

// Base URL for direct axios calls (skipping interceptors)
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const translations = {
  si: {
    pageTitle: "අපව සම්බන්ධ කරගන්න",
    pageSubtitle: "ප්‍රශ්න හෝ අදහස් තියෙනවද? ඔබගෙන් ඇසීමට අපි කැමතියි!",
    infoTitle: "අප හා සම්බන්ධ වන්න",
    locationTitle: "මුලස්ථාන කාර්යාලය",
    locationAddress: "කොළඹ, ශ්‍රී ලංකාව",
    emailTitle: "අපට Email කරන්න",
    phoneTitle: "අපව අමතන්න",
    phoneHours: "සඳු–සිකු, පෙ.ව 9 – ප.ව 5",
    formTitle: "ඔබගේ පණිවිඩය අප වෙත එවන්න",
    nameLabel: "සම්පූර්ණ නම",
    namePlaceholder: "ඔබගේ නම",
    emailLabel: "Email ලිපිනය",
    phoneLabel: "දුරකථන අංකය",
    messageLabel: "ඔබගේ පණිවිඩය",
    messagePlaceholder: "අපෙන් ඔබට උදව් කළ හැක්කේ කුමක්ද?",
    minChars: "අවම අක්ෂර 15 ක්",
    send: "පණිවිඩය යවන්න",
    successTitle: "පණිවිඩය යවා අවසන්!",
    successText: "අපගේ කණ්ඩායම ඉක්මනින්ම ඔබව සම්බන්ධ කරගනී.",
    errorTitle: "දෝෂයක් සිදු විය!",
    errorText: "පණිවිඩය යැවීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
    characterCount: (len: number) => `${len}/500`,
  },
  en: {
    pageTitle: "Contact Us",
    pageSubtitle: "Have questions or feedback? We’d love to hear from you!",
    infoTitle: "Get in touch",
    locationTitle: "Head Office",
    locationAddress: "Colombo, Sri Lanka",
    emailTitle: "Email us",
    phoneTitle: "Call us",
    phoneHours: "Mon–Fri, 9am – 5pm",
    formTitle: "Send us your message",
    nameLabel: "Full Name",
    namePlaceholder: "Your name",
    emailLabel: "Email address",
    phoneLabel: "Phone number",
    messageLabel: "Your message",
    messagePlaceholder: "How can we help you?",
    minChars: "Minimum 15 characters",
    send: "Send Message",
    successTitle: "Message sent!",
    successText: "Our team will get back to you shortly.",
    errorTitle: "Something went wrong!",
    errorText: "Could not send the message. Please try again.",
    characterCount: (len: number) => `${len}/500`,
  },
};


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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useEnglish, setUseEnglish] = useState(false);

  const copy = useMemo(() => (useEnglish ? translations.en : translations.si), [useEnglish]);

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
      const payload = {
        name: input.name,
        email: input.email,
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
          title: copy.successTitle,
          text: copy.successText,
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
        title: copy.errorTitle,
        text: copy.errorText,
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#053A4E] bg-white/60 px-3 py-1 rounded-full border border-white/40">
                Language
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-[#053A4E]">
                <span className={!useEnglish ? "font-semibold" : "opacity-70"}>සිංහල</span>
                <div className="relative inline-flex h-6 w-11 items-center">
                  <input
                    type="checkbox"
                    className="peer h-0 w-0 opacity-0"
                    checked={useEnglish}
                    onChange={(e) => setUseEnglish(e.target.checked)}
                  />
                  <div className="absolute inset-0 rounded-full bg-[#053A4E]/30 transition peer-checked:bg-[#053A4E]" />
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </div>
                <span className={useEnglish ? "font-semibold" : "opacity-70"}>English</span>
              </label>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#053A4E] mb-3">
              {copy.pageTitle}
            </h1>
            <p className="text-xl text-[#053A4E] opacity-80 max-w-2xl mx-auto">
              {copy.pageSubtitle}
            </p>
          </header>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* CONTACT INFO */}
            <div className="w-full lg:w-2/5">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full">
                <h2 className="text-3xl font-semibold text-[#053A4E] mb-6">
                  {copy.infoTitle}
                </h2>

                <div className="space-y-6">
                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <FaLocationDot className="text-2xl text-brand-coral mt-1" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        {copy.locationTitle}
                      </h3>
                      <p className="opacity-80">{copy.locationAddress}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <MdEmail className="text-2xl text-brand-prussian mt-1" />
                    <div>
                      <h3 className="text-lg font-medium text-brand-prussian">
                        {copy.emailTitle}
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
                        {copy.phoneTitle}
                      </h3>
                      <a
                        href="tel:+94768826142"
                        className="opacity-80 hover:text-brand-cerulean"
                      >
                        0768826142
                      </a>
                      <div className="text-xs opacity-60 mt-1">
                        {copy.phoneHours}
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
                  {copy.formTitle}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* NAME */}
                  <div>
                    <label className="text-[10px] md:text-xs font-bold ml-1">
                      {copy.nameLabel}
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                      <input
                        type="text"
                        name="name"
                        placeholder={copy.namePlaceholder}
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
                      {copy.emailLabel}
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
                      {copy.phoneLabel}
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
                      {copy.messageLabel}
                    </label>
                    <div className="relative">
                      <FaComment className="absolute left-3 top-3 text-[#05668A]" />
                      <textarea
                        name="message"
                        rows={5}
                        placeholder={copy.messagePlaceholder}
                        value={input.message}
                        onChange={handleChange}
                        required
                        minLength={15}
                        maxLength={500}
                        className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-3 rounded-xl focus:border-[#05668A] shadow-sm"
                      ></textarea>
                    </div>

                    <div className="flex justify-between mt-1 text-sm opacity-70">
                      <span>{copy.minChars}</span>
                      <span>{copy.characterCount(input.message.length)}</span>
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
                      copy.send
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
