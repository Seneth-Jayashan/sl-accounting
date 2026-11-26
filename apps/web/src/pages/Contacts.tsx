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
  AlertCircle,
  Copy,
  Check,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

// Base URL
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

type Language = "si" | "en";

// --- Translations ---
const translations = {
  si: {
    badge: "24/7 ශිෂ්‍ය සහාය සේවාව",
    pageTitle: "අපව සම්බන්ධ කරගන්න",
    pageSubtitle:
      "පංති, ගෙවීම් හෝ LMS පද්ධතිය පිළිබඳ ඕනෑම ගැටලුවක් සඳහා අප හා සම්බන්ධ වන්න. අපගේ කණ්ඩායම ඔබට උදව් කිරීමට සූදානම්.",
    infoTitle: "සෘජු සම්බන්ධතා",
    infoSubtitle: "පහත මාධ්‍ය ඔස්සේද ඔබට අපව සම්බන්ධ කරගත හැක.",
    responseTime: "සාමාන්‍යයෙන් පැය 24ක් ඇතුළත පිළිතුරු ලබා දේ",
    locationTitle: "මුලස්ථාන කාර්යාලය",
    locationAddress: "ගාල්ල, ශ්‍රී ලංකාව",
    emailTitle: "Email ලිපිනය",
    phoneTitle: "දුරකථන ඇමතුම්",
    phoneHours: "සඳුදා – සිකුරාදා, පෙ.ව 9.00 – ප.ව 5.00",
    whatsappTitle: "නිල WhatsApp නාලිකාව",
    whatsappDesc: "නවතම පංති තොරතුරු සහ නිවේදන සඳහා එක්වන්න",
    copy: "පිටපත් කරන්න",
    copied: "පිටපත් විය",
    formTitle: "ඔබගේ පණිවිඩය අප වෙත එවන්න",
    formSubtitle: "පහත තොරතුරු පුරවා අප වෙත යොමු කරන්න.",
    nameLabel: "සම්පූර්ණ නම",
    namePlaceholder: "උදා: කසුන් පෙරේරා",
    emailLabel: "Email ලිපිනය",
    phoneLabel: "දුරකථන අංකය",
    phoneHint: "ඉලක්කම් 10",
    messageLabel: "ඔබගේ පණිවිඩය",
    messagePlaceholder: "අපෙන් ඔබට උදව් කළ හැක්කේ කුමක්ද? විස්තරාත්මකව සඳහන් කරන්න...",
    minChars: "අවම අක්ෂර 15 ක් අවශ්‍යයි",
    readyToSend: "පණිවිඩය යැවීමට සූදානම්",
    send: "පණිවිඩය යවන්න",
    sending: "යවමින් පවතී...",
    successTitle: "පණිවිඩය යවා අවසන්!",
    successText: "අපගේ කණ්ඩායම ඉක්මනින්ම ඔබව සම්බන්ධ කරගනී.",
    errorTitle: "දෝෂයක් සිදු විය!",
    errorText: "පණිවිඩය යැවීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
    characterCount: (len: number) => `${len} / 500`,
    faqHeading: "නිතර අසන ප්‍රශ්න (Quick Help)",
    faqs: [
      {
        q: "බැංකු රිසිට්පත (Bank Slip) අනුමත වීමට කොපමණ වේලාවක් ගතවේද?",
        a: "බැංකු තැන්පතු රිසිට්පත් සාමාන්‍යයෙන් පැය 6–12ක් ඇතුළත පරීක්ෂා කර පංති ප්‍රවේශය සක්‍රීය කරනු ලැබේ.",
      },
      {
        q: "Zoom සබැඳි සහ පටිගත කිරීම් (Recordings) ලබා ගන්නේ කෙසේද?",
        a: "LMS Login හරහා ඔබගේ Student Dashboard වෙත පිවිස අදාළ පංතිය තේරීමෙන් සියලුම සජීවී පංති සහ Recordings නැරඹිය හැක.",
      },
      {
        q: "මුද්‍රිත නිබන්ධන (Tutes) නිවසටම ලැබෙන්නේ කෙසේද?",
        a: "ඔබගේ Profile හි නිවැරදි තැපැල් ලිපිනය සහ ආසන්නතම තැපැල් කාර්යාලය ඇතුළත් කර ඇති බව තහවුරු කරන්න.",
      },
    ],
  },
  en: {
    badge: "24/7 Student Support Desk",
    pageTitle: "Contact Us",
    pageSubtitle:
      "Have questions about classes, payments, or the LMS? Reach out to our team and we’ll be happy to assist you.",
    infoTitle: "Get in Touch",
    infoSubtitle: "Reach us directly through any of the channels below.",
    responseTime: "Typically replies within 24 hours",
    locationTitle: "Head Office",
    locationAddress: "Galle, Sri Lanka",
    emailTitle: "Email Us",
    phoneTitle: "Call Us",
    phoneHours: "Mon – Fri, 9:00 AM – 5:00 PM",
    whatsappTitle: "Official WhatsApp Channel",
    whatsappDesc: "Join for instant class alerts and exam notices",
    copy: "Copy",
    copied: "Copied",
    formTitle: "Send Us a Message",
    formSubtitle: "Fill out the details below and our team will respond shortly.",
    nameLabel: "Full Name",
    namePlaceholder: "e.g., Kasun Perera",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    phoneHint: "10 digits",
    messageLabel: "Your Message",
    messagePlaceholder: "How can we help you? Please describe your inquiry...",
    minChars: "Minimum 15 characters required",
    readyToSend: "Ready to send",
    send: "Send Message",
    sending: "Sending...",
    successTitle: "Message Sent!",
    successText: "Thank you for reaching out. Our team will get back to you shortly.",
    errorTitle: "Something Went Wrong",
    errorText: "Could not send your message. Please try again.",
    characterCount: (len: number) => `${len} / 500`,
    faqHeading: "Quick Answers Before You Write",
    faqs: [
      {
        q: "How long does bank slip verification take?",
        a: "Bank transfer receipts are typically verified within 6–12 hours, after which your class access activates automatically.",
      },
      {
        q: "Where can I find Zoom links and lesson recordings?",
        a: "Log in to your Student Dashboard and open your enrolled class to access live session links and HD replays anytime.",
      },
      {
        q: "How are printed tute packs delivered?",
        a: "Ensure your complete postal address and nearest post office are saved in your student profile for timely courier dispatch.",
      },
    ],
  },
};

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// --- ISOLATED CONTACT INFO SIDEBAR (Memoized) ---
const ContactInfo = memo(({ copy }: { copy: typeof translations.en }) => {
  const [copiedField, setCopiedField] = useState<"email" | "phone" | null>(null);

  const handleCopy = async (text: string, field: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white p-7 sm:p-9 rounded-3xl shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
      {/* Subtle CSS Dot Pattern & Ambient Glows */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-cerulean rounded-full blur-3xl opacity-35 pointer-events-none" />

      <div className="relative z-10 space-y-7">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-jasmine text-[11px] font-semibold mb-4">
            <Clock size={12} />
            <span>{copy.responseTime}</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-sinhala tracking-tight">
            {copy.infoTitle}
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-1.5 leading-relaxed">
            {copy.infoSubtitle}
          </p>
        </div>

        <div className="space-y-4">
          {/* Location Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 text-brand-jasmine flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-jasmine">
                {copy.locationTitle}
              </h3>
              <p className="text-white font-semibold text-sm sm:text-base mt-0.5 font-sinhala">
                {copy.locationAddress}
              </p>
            </div>
          </div>

          {/* Email Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 text-brand-coral flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-coral">
                  {copy.emailTitle}
                </h3>
                <a
                  href="mailto:info@kalumwaduge.com"
                  className="text-white hover:text-brand-jasmine transition-colors font-semibold text-sm sm:text-base block truncate mt-0.5"
                >
                  info@kalumwaduge.com
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy("info@kalumwaduge.com", "email")}
              title={copy.copy}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
            >
              {copiedField === "email" ? (
                <Check size={15} className="text-emerald-400" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>

          {/* Phone Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 text-sky-300 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  {copy.phoneTitle}
                </h3>
                <a
                  href="tel:+94768826142"
                  className="text-white hover:text-brand-jasmine transition-colors font-bold text-base sm:text-lg font-mono tabular-nums block mt-0.5"
                >
                  076 882 6142
                </a>
                <p className="text-[11px] text-white/50 mt-0.5 font-sinhala">
                  {copy.phoneHours}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy("0768826142", "phone")}
              title={copy.copy}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
            >
              {copiedField === "phone" ? (
                <Check size={15} className="text-emerald-400" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Channel Link */}
      <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
        <a
          href="https://whatsapp.com/channel/0029Va5mmNGJf05WQhSOTn1W"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/25 transition-colors group"
        >
          <div>
            <p className="text-xs sm:text-sm font-bold text-emerald-300 font-sinhala">
              {copy.whatsappTitle}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5 font-sinhala">
              {copy.whatsappDesc}
            </p>
          </div>
          <ExternalLink
            size={17}
            className="text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0"
          />
        </a>
      </div>
    </div>
  );
});

// --- MAIN COMPONENT ---
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

  const lang: Language = useEnglish ? "en" : "si";
  const copy = useMemo(() => translations[lang], [lang]);

  // HANDLE INPUT CHANGES
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;

    if (name === "phoneNumber") value = value.replace(/\D/g, "").slice(0, 10);
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
        name: input.name.trim(),
        email: input.email.trim(),
        phoneNumber: input.phoneNumber,
        message: input.message.trim(),
      };

      const response = await axios.post(`${API_BASE}/contact/`, payload);

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: "success",
          title: copy.successTitle,
          text: copy.successText,
          confirmButtonColor: "#053A4E",
          background: "#fff",
          iconColor: "#05668A",
        });

        setInputs({
          name: "",
          email: "",
          phoneNumber: "",
          message: "",
        });
      }
    } catch {
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

  const messageLen = input.message.length;
  const isMessageReady = messageLen >= 15;
  const progressPct = Math.min(100, Math.round((messageLen / 500) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFF] text-brand-prussian font-sans pb-24 selection:bg-brand-cerulean selection:text-white">
      {/* HERO HEADER */}
      <header className="relative bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3rem] shadow-xl pt-32 pb-16 sm:pt-36 sm:pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
        <div className="absolute -top-32 -left-20 w-[480px] h-[480px] bg-brand-cerulean rounded-full blur-[130px] opacity-25 pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] bg-brand-coral rounded-full blur-[130px] opacity-20 pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          {/* Language Switcher Pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 p-1.5 rounded-full mb-6">
            <Globe size={15} className="text-brand-jasmine ml-2.5" />
            {(
              [
                { key: false, label: "සිංහල" },
                { key: true, label: "English" },
              ] as const
            ).map((option) => {
              const active = useEnglish === option.key;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setUseEnglish(option.key)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${active
                      ? "text-brand-prussian"
                      : "text-white/75 hover:text-white"
                    }`}
                >
                  {active && (
                    <motion.span
                      layoutId="contact-lang-pill"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                      className="absolute inset-0 rounded-full bg-white shadow-sm -z-10"
                    />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight font-sinhala leading-[1.12]">
            {copy.pageTitle}
          </h1>
          <p className="text-sm sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed font-sinhala">
            {copy.pageSubtitle}
          </p>
        </motion.div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 relative -mt-8 z-20 space-y-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch"
        >
          {/* LEFT: CONTACT INFO SIDEBAR (5 cols) */}
          <motion.div variants={fadeInUp} className="lg:col-span-5">
            <ContactInfo copy={copy} />
          </motion.div>

          {/* RIGHT: CONTACT FORM CARD (7 cols) */}
          <motion.div variants={fadeInUp} className="lg:col-span-7">
            <div className="bg-white p-6 sm:p-9 rounded-3xl shadow-xl shadow-brand-prussian/5 border border-slate-200/80 h-full">
              <div className="flex items-center gap-3.5 pb-5 mb-6 border-b border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                  <MessageSquare size={21} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-prussian font-sinhala">
                    {copy.formTitle}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sinhala">
                    {copy.formSubtitle}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* NAME */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sinhala">
                      {copy.nameLabel} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <User
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-cerulean transition-colors pointer-events-none"
                        size={17}
                      />
                      <input
                        type="text"
                        name="name"
                        placeholder={copy.namePlaceholder}
                        value={input.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={50}
                        className="w-full bg-slate-50 border border-slate-200/80 pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* PHONE */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sinhala">
                        {copy.phoneLabel} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {input.phoneNumber.length}/10 ({copy.phoneHint})
                      </span>
                    </div>
                    <div className="relative group">
                      <Phone
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-cerulean transition-colors pointer-events-none"
                        size={17}
                      />
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="076 882 6142"
                        value={input.phoneNumber}
                        onChange={handleChange}
                        pattern="\d{10}"
                        required
                        className="w-full bg-slate-50 border border-slate-200/80 pl-10 pr-4 py-3 rounded-xl text-sm font-mono font-medium text-brand-prussian placeholder:font-sans placeholder:text-slate-400 tabular-nums focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sinhala">
                    {copy.emailLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-cerulean transition-colors pointer-events-none"
                      size={17}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="your.email@example.com"
                      value={input.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200/80 pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* MESSAGE */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sinhala">
                    {copy.messageLabel} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder={copy.messagePlaceholder}
                    value={input.message}
                    onChange={handleChange}
                    required
                    minLength={15}
                    maxLength={500}
                    className="w-full bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-sm text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all resize-none"
                  />

                  {/* Live Character Progress Bar */}
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${isMessageReady ? "bg-emerald-500" : "bg-brand-coral"
                        }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold font-sinhala ${isMessageReady ? "text-emerald-600" : "text-brand-coral"
                        }`}
                    >
                      {isMessageReady ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>{copy.readyToSend}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} />
                          <span>{copy.minChars}</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums">
                      {copy.characterCount(messageLen)}
                    </span>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-brand-prussian/15 hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed font-sinhala"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{copy.sending}</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{copy.send}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* QUICK HELP / FAQ SECTION */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-brand-prussian font-sinhala">
              {copy.faqHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {copy.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <HelpCircle
                    size={17}
                    className="text-brand-cerulean shrink-0 mt-0.5"
                  />
                  <h3 className="text-sm font-bold text-brand-prussian leading-snug font-sinhala">
                    {faq.q}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-6 font-sinhala">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}