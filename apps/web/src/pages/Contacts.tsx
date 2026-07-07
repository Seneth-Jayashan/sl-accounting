import React, { useMemo, useState, memo } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Base URL
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

// --- Translations ---
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
    sending: "යවමින් පවතී...",
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
    locationAddress: "Galle, Sri Lanka",
    emailTitle: "Email us",
    phoneTitle: "Call us",
    phoneHours: "Mon–Fri, 9am – 5pm",
    formTitle: "Send us your message",
    nameLabel: "Full Name",
    namePlaceholder: "Your Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    messageLabel: "Your Message",
    messagePlaceholder: "How can we help you?",
    minChars: "Minimum 15 characters",
    send: "Send Message",
    sending: "Sending...",
    successTitle: "Message sent!",
    successText: "Our team will get back to you shortly.",
    errorTitle: "Something went wrong!",
    errorText: "Could not send the message. Please try again.",
    characterCount: (len: number) => `${len}/500`,
  },
};

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- OPTIMIZED INFO SIDEBAR (Memoized) ---
const ContactInfo = memo(({ copy }: { copy: any }) => (
  <div className="bg-[#0d4b5b] text-white p-8 md:p-10 rounded-[1.5rem] shadow-sm relative overflow-hidden h-full">
    <div className="relative z-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-10 font-sans tracking-wide">
        {copy.infoTitle}
      </h2>

      <div className="space-y-8">
        {/* Location */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-[#facc15]" />
          </div>
          <div className="pt-1">
            <h3 className="text-sm font-bold text-[#facc15] mb-0.5 font-sans">
              {copy.locationTitle}
            </h3>
            <p className="text-white/70 font-sans text-xs">{copy.locationAddress}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-[#f88f89]" />
          </div>
          <div className="pt-1">
            <h3 className="text-sm font-bold text-[#f88f89] mb-0.5 font-sans">
              {copy.emailTitle}
            </h3>
            <a href="mailto:info@kalumwaduge.com" className="text-white/70 hover:text-white transition-colors font-sans block text-xs">
              info@kalumwaduge.com
            </a>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Phone size={18} className="text-white" />
          </div>
          <div className="pt-1">
            <h3 className="text-sm font-bold text-white mb-0.5 font-sans">
              {copy.phoneTitle}
            </h3>
            <a href="tel:+94768826142" className="text-white/70 hover:text-white transition-colors font-sans block text-xs mb-0.5">
              076 882 6142
            </a>
            <p className="text-xs text-white/50 font-sans">{copy.phoneHours}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
));

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
  const [useEnglish, setUseEnglish] = useState(true); // Defaulted to English based on screenshot

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

      const response = await axios.post(`${API_BASE}/contact/`, payload);

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: copy.successTitle,
          text: copy.successText,
          confirmButtonColor: "#0d4b5b",
          background: "#fff",
          iconColor: "#0d4b5b",
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
        confirmButtonColor: "#f88f89",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9] text-gray-900 font-sans pt-28 sm:pt-36 pb-16 relative overflow-hidden">

      <main className="flex-grow relative z-10">
        <section className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <motion.header
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-10 sm:mb-14"
          >
            {/* Language Switcher */}
            <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100 mb-8">
              <span className={!useEnglish ? "text-gray-800 font-bold text-sm cursor-pointer" : "text-gray-400 text-sm font-medium cursor-pointer"} onClick={() => setUseEnglish(false)}>
                සිංහල
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useEnglish}
                  onChange={(e) => setUseEnglish(e.target.checked)}
                />
                <div className="w-11 h-6 bg-[#0d4b5b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <span className={useEnglish ? "text-[#0d4b5b] font-bold text-sm cursor-pointer" : "text-gray-400 text-sm font-medium cursor-pointer"} onClick={() => setUseEnglish(true)}>
                English
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-[#0d4b5b] mb-4 font-sans leading-tight">
              {copy.pageTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-sans">
              {copy.pageSubtitle}
            </p>
          </motion.header>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row gap-8 items-stretch"
          >
            {/* --- LEFT: CONTACT INFO --- */}
            <motion.div variants={fadeInUp} className="w-full lg:w-2/5">
              <ContactInfo copy={copy} />
            </motion.div>

            {/* --- RIGHT: CONTACT FORM --- */}
            <motion.div variants={fadeInUp} className="w-full lg:w-3/5">
              <div className="bg-white p-8 sm:p-10 rounded-[1.5rem] shadow-sm border border-gray-100 h-full">
                <h2 className="text-xl font-bold text-[#0d4b5b] mb-8 font-sans">
                  {copy.formTitle}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NAME */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">
                        {copy.nameLabel}
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder={copy.namePlaceholder}
                        value={input.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={50}
                        className="w-full bg-white border border-gray-200 px-4 py-3 rounded-lg focus:border-[#0d4b5b] focus:ring-1 focus:ring-[#0d4b5b] outline-none transition-all font-sans text-sm text-gray-700 placeholder-gray-300"
                      />
                    </div>

                    {/* PHONE */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">
                        {copy.phoneLabel}
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="070 112 3456"
                        value={input.phoneNumber}
                        onChange={handleChange}
                        pattern="\d{10}"
                        required
                        className="w-full bg-white border border-gray-200 px-4 py-3 rounded-lg focus:border-[#0d4b5b] focus:ring-1 focus:ring-[#0d4b5b] outline-none transition-all font-sans text-sm text-gray-700 placeholder-gray-300"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">
                      {copy.emailLabel}
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="your.email@example.com"
                      value={input.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-gray-200 px-4 py-3 rounded-lg focus:border-[#0d4b5b] focus:ring-1 focus:ring-[#0d4b5b] outline-none transition-all font-sans text-sm text-gray-700 placeholder-gray-300"
                    />
                  </div>

                  {/* MESSAGE */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">
                      {copy.messageLabel}
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder={copy.messagePlaceholder}
                      value={input.message}
                      onChange={handleChange}
                      required
                      minLength={15}
                      maxLength={500}
                      className="w-full bg-white border border-gray-200 px-4 py-3 rounded-lg focus:border-[#0d4b5b] focus:ring-1 focus:ring-[#0d4b5b] outline-none transition-all font-sans resize-none text-sm text-gray-700 placeholder-gray-300"
                    ></textarea>

                    <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-medium text-gray-400">
                      <span className={input.message.length < 15 ? "text-red-400 flex items-center gap-1" : "text-green-500 flex items-center gap-1"}>
                        {input.message.length < 15 ? (
                          <><AlertCircle size={12} /> {copy.minChars}</>
                        ) : (
                          <><CheckCircle2 size={12} /> Ready to send</>
                        )}
                      </span>
                      <span>{copy.characterCount(input.message.length)}</span>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-[#0d4b5b] hover:bg-[#093946] text-white font-bold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm mt-4 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {copy.sending}
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {copy.send}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}