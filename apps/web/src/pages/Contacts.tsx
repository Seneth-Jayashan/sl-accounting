import React, { useMemo, useState, memo } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  MessageSquare, 
  Send, 
  Globe,
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

// --- 1. OPTIMIZED BACKGROUND (Memoized) ---
const BackgroundDecor = memo(() => (
  <>
    <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-brand-cerulean/5 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none will-change-transform" />
    <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-brand-coral/10 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none will-change-transform" />
  </>
));

// --- 2. OPTIMIZED INFO SIDEBAR (Memoized) ---
// This prevents the left side from re-rendering when typing in the form
const ContactInfo = memo(({ copy }: { copy: any }) => (
  <div className="bg-brand-prussian text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-full">
    {/* Decorative Pattern */}
    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-cerulean rounded-full blur-3xl opacity-50"></div>

    <div className="relative z-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-sinhala">
        {copy.infoTitle}
      </h2>

      <div className="space-y-8">
        {/* Location */}
        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-cerulean transition-colors">
            <MapPin className="text-brand-jasmine" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-jasmine mb-1 font-sinhala">
              {copy.locationTitle}
            </h3>
            <p className="text-brand-aliceBlue/80 font-sans text-sm sm:text-base">{copy.locationAddress}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-cerulean transition-colors">
            <Mail className="text-brand-coral" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-coral mb-1 font-sinhala">
              {copy.emailTitle}
            </h3>
            <a href="mailto:info@slaccounting.lk" className="text-brand-aliceBlue/80 hover:text-white transition-colors font-sans block text-sm sm:text-base">
              info@slaccounting.lk
            </a>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-cerulean transition-colors">
            <Phone className="text-brand-aliceBlue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1 font-sinhala">
              {copy.phoneTitle}
            </h3>
            <a href="tel:+94768826142" className="text-brand-aliceBlue/80 hover:text-white transition-colors font-sans block text-lg font-semibold">
              076 882 6142
            </a>
            <p className="text-[10px] sm:text-xs text-white/40 mt-1 uppercase tracking-wider font-sans">{copy.phoneHours}</p>
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

      const response = await axios.post(`${API_BASE}/contact/`, payload);

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: copy.successTitle,
          text: copy.successText,
          confirmButtonColor: "#053A4E",
          background: "#fff",
          iconColor: "#05668A",
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
        confirmButtonColor: "#EF8D8E",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-aliceBlue/40 text-brand-prussian font-sans pt-24 sm:pt-32 pb-12 relative overflow-hidden">
      
      {/* Optimized Background */}
      <BackgroundDecor />

      <main className="flex-grow relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <motion.header 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-8 sm:mb-12"
          >
            {/* Language Switcher - Optimized Styling */}
            <div className="inline-flex items-center gap-3 mb-6 bg-white border border-brand-cerulean/20 px-4 py-2 rounded-full shadow-sm">
                <Globe size={16} className="text-brand-cerulean" />
                <label className="inline-flex items-center gap-3 cursor-pointer select-none text-sm text-brand-prussian font-medium">
                    <span className={!useEnglish ? "text-brand-cerulean font-bold" : "opacity-50"}>සිංහල</span>
                    <div className="relative inline-flex h-6 w-11 items-center">
                    <input
                        type="checkbox"
                        className="peer h-0 w-0 opacity-0"
                        checked={useEnglish}
                        onChange={(e) => setUseEnglish(e.target.checked)}
                    />
                    <div className="absolute inset-0 rounded-full bg-gray-200 transition peer-checked:bg-brand-prussian" />
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </div>
                    <span className={useEnglish ? "text-brand-cerulean font-bold" : "opacity-50"}>English</span>
                </label>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-prussian mb-4 font-sinhala leading-tight">
              {copy.pageTitle}
            </h1>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-sans">
              {copy.pageSubtitle}
            </p>
          </motion.header>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row gap-8 items-stretch"
          >
            {/* --- LEFT: CONTACT INFO (ISOLATED) --- */}
            <motion.div variants={fadeInUp} className="w-full lg:w-2/5">
                <ContactInfo copy={copy} />
            </motion.div>

            {/* --- RIGHT: CONTACT FORM --- */}
            <motion.div variants={fadeInUp} className="w-full lg:w-3/5">
              <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 h-full">
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-prussian mb-8 font-sinhala flex items-center gap-3">
                  <MessageSquare className="text-brand-cerulean" /> {copy.formTitle}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                      {/* NAME */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                          {copy.nameLabel}
                        </label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-cerulean transition-colors" size={18} />
                          <input
                            type="text"
                            name="name"
                            placeholder={copy.namePlaceholder}
                            value={input.name}
                            onChange={handleChange}
                            required
                            minLength={2}
                            maxLength={50}
                            className="w-full bg-brand-aliceBlue/30 border border-gray-200 pl-11 pr-4 py-3 rounded-xl focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all font-sans text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      {/* PHONE */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                          {copy.phoneLabel}
                        </label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-cerulean transition-colors" size={18} />
                          <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="070 123 4567"
                            value={input.phoneNumber}
                            onChange={handleChange}
                            pattern="\d{10}"
                            required
                            className="w-full bg-brand-aliceBlue/30 border border-gray-200 pl-11 pr-4 py-3 rounded-xl focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all font-sans text-sm sm:text-base"
                          />
                        </div>
                      </div>
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                      {copy.emailLabel}
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-cerulean transition-colors" size={18} />
                      <input
                        type="email"
                        name="email"
                        placeholder="your.email@example.com"
                        value={input.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-brand-aliceBlue/30 border border-gray-200 pl-11 pr-4 py-3 rounded-xl focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all font-sans text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* MESSAGE */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                      {copy.messageLabel}
                    </label>
                    <div className="relative group">
                      <textarea
                        name="message"
                        rows={5}
                        placeholder={copy.messagePlaceholder}
                        value={input.message}
                        onChange={handleChange}
                        required
                        minLength={15}
                        maxLength={500}
                        className="w-full bg-brand-aliceBlue/30 border border-gray-200 p-4 rounded-xl focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all font-sans resize-none text-sm sm:text-base"
                      ></textarea>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] sm:text-xs font-medium text-gray-400">
                      <span className={input.message.length < 15 ? "text-brand-coral" : "text-green-600 flex items-center gap-1"}>
                        {input.message.length < 15 ? (
                            <><AlertCircle size={12} className="inline mr-1"/> {copy.minChars}</>
                        ) : (
                            <><CheckCircle2 size={12} className="inline mr-1"/> Ready to send</>
                        )}
                      </span>
                      <span>{copy.characterCount(input.message.length)}</span>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {copy.sending}
                      </>
                    ) : (
                      <>
                        <Send size={20} />
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