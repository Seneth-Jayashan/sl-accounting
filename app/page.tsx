"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// --- SWIPER IMPORTS ---
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// --- LUCIDE ICON IMPORTS ---
import {
  BookOpen,
  Clock,
  ClipboardCheck,
  Award,
  Users,
  CheckCircle,
} from "lucide-react";

// --- SLIDER DATA ---
const heroSlides = [
  {
    title: "A/L ගිණුම්කරණය කලුම් වඩුගේ සමඟ",
    description: "සංකීර්ණ ගිණුම්කරණ සංකල්ප සරලව, පහසුවෙන් තේරුම් ගෙන විභාගයට සාර්ථකව මුහුණ දෙන්න.",
    img: "/images/hero-slider-1.jpg", // Replace with your image
    link: "/courses",
  },
  {
    title: "2026 A/L Theory (නව පන්තිය)",
    description: "මුල සිට සරලව A/L ගිණුම්කරණ සිද්ධාන්ත ඉගෙන ගැනීමට අදම ලියාපදිංචි වන්න.",
    img: "/images/hero-slider-2.jpg", // Replace with your image
    link: "/courses/2026-theory",
  },
  {
    title: "2024 A/L Revision (පුනරීක්ෂණ)",
    description: "විභාගයට ඉහළම ලකුණු සඳහා සූදානම් වීමට අපගේ පුනරීක්ෂණ පන්තියට එක්වන්න.",
    img: "/images/hero-slider-3.jpg", // Replace with your image
    link: "/courses/2024-revision",
  },
];

export default function Home() {
  // Animation variants for fading in
  const fadeIn = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
  };

  // --- PAGE DATA (from previous step) ---
  const features = [
    {
      title: "සජීවී දේශන (Live)",
      desc: "සජීවීව පන්තියට සම්බන්ධ වී ගැටළු නිරාකරණය කරගන්න.",
      icon: <BookOpen className="w-12 h-12 text-primary-cerulean" />,
    },
    {
      title: "පටිගත කල දේශන",
      desc: "නැවත නැවත නැරඹීමට හැකි පටිගත කරන ලද දේශන.",
      icon: <Clock className="w-12 h-12 text-primary-cerulean" />,
    },
    {
      title: "සම්පූර්ණ විෂය නිර්දේශය",
      desc: "නව විෂය නිර්දේශය සම්පූර්ණයෙන්ම ආවරණය කෙරේ.",
      icon: <ClipboardCheck className="w-12 h-12 text-primary-cerulean" />,
    },
    {
      title: "පසුගිය විභාග ප්‍රශ්න",
      desc: "පසුගිය විභාග ප්‍රශ්න පත්‍ර සහ ආදර්ශ ප්‍රශ්න සාකච්ඡා කිරීම.",
      icon: <Award className="w-12 h-12 text-primary-cerulean" />,
    },
    {
      title: "සතිපතා Online පරීක්ෂණ",
      desc: "සෑම සතියකම Online MCQ සහ රචනා පරීක්ෂණ.",
      icon: <Users className="w-12 h-12 text-primary-cerulean" />,
    },
    {
      title: "Tutes සහ PDFs",
      desc: "සියලුම Tutes සහ පාඩම් සටහන් PDF ලෙස ලබාගන්න.",
      icon: <CheckCircle className="w-12 h-12 text-primary-cerulean" />,
    },
  ];

  const courses = [
    {
      title: "2026 A/L Theory (නව පන්තිය)",
      desc: "මුල සිට සරලව A/L ගිණුම්කරණ සිද්ධාන්ත.",
      link: "/courses/2026-theory",
    },
    {
      title: "2025 A/L Theory",
      desc: "2025 විභාගය ඉලක්ක කරගත් සම්පූර්ණ සිද්ධාන්ත.",
      link: "/courses/2025-theory",
    },
    {
      title: "2024 A/L Revision (පුනරීක්ෂණ)",
      desc: "විභාගයට මුහුණ දෙන සිසුන් සඳහා වන පුනරීක්ෂණ පන්තිය.",
      link: "/courses/2024-revision",
    },
  ];

  return (
    // Note: Switched to text-text-dark for better contrast on white
    <main className="min-h-screen bg-secondary-alice text-text-dark">
      {/* --- NEW HERO SLIDER SECTION --- */}
      <section className="relative h-screen w-full">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          className="h-full w-full"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index} className="relative">
              {/* Background Image */}
              <Image
                src={slide.img}
                alt={slide.title}
                fill
                className="object-cover -z-20"
                priority={index === 0} // Prioritize loading the first image
              />
              {/* Dark Overlay for text readability */}
              <div className="absolute inset-0 bg-black/50 -z-10" />

              {/* Slide Content */}
              <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center text-center md:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-4xl md:text-6xl font-heading text-white leading-tight mb-6 max-w-3xl"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl font-body"
                >
                  {slide.description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  <Link
                    href={slide.link}
                    className="bg-primary-cerulean text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-primary-cerulean transition-all shadow-lg"
                  >
                    වැඩි විස්තර
                  </Link>
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* --- ALL OTHER PAGE SECTIONS --- */}
      
      {/* Stats Section */}
      <section className="bg-white py-16 shadow-md">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-6">
          <motion.div {...fadeIn} transition={{ duration: 0.6, delay: 0.1 }}>
            <Users className="w-12 h-12 text-primary-cerulean mx-auto mb-3" />
            <h3 className="text-3xl font-heading text-primary-blue">100,000+</h3>
            <p className="font-body text-primary-blue/80">සහභාගී වූ සිසුන්</p>
          </motion.div>
          <motion.div {...fadeIn} transition={{ duration: 0.6, delay: 0.3 }}>
            <Award className="w-12 h-12 text-primary-cerulean mx-auto mb-3" />
            <h3 className="text-3xl font-heading text-primary-blue">15+</h3>
            <p className="font-body text-primary-blue/80">වසරක පළපුරුද්ද</p>
          </motion.div>
          <motion.div {...fadeIn} transition={{ duration: 0.6, delay: 0.5 }}>
            <CheckCircle className="w-12 h-12 text-primary-cerulean mx-auto mb-3" />
            <h3 className="text-3xl font-heading text-primary-blue">Online LMS</h3>
            <p className="font-body text-primary-blue/80">නවීනතම ඉගෙනුම් පද්ධතිය</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary-alice">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-heading text-primary-blue mb-12">
            SL Accounting LMS විශේෂාංග
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-white hover:shadow-xl transition text-center flex flex-col items-center"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-2xl font-heading text-primary-blue mb-4">
                  {item.title}
                </h3>
                <p className="text-primary-blue/80 font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Preview Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-heading text-primary-blue mb-12">
            අපගේ පාඨමාලා
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map((course, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="bg-secondary-alice p-8 rounded-2xl shadow-lg border border-primary-blue/5 text-left flex flex-col"
              >
                <h3 className="text-2xl font-heading text-primary-cerulean mb-3 flex-grow">
                  {course.title}
                </h3>
                <p className="text-primary-blue/80 mb-5 font-body">
                  {course.desc}
                </p>
                <Link href={course.link}>
                  <span className="font-semibold text-primary-blue hover:text-primary-cerulean transition-all">
                    වැඩි විස්තර →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <Link
              href="/courses"
              className="mt-12 inline-block bg-primary-cerulean text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-primary-blue transition-all shadow-lg"
            >
              සියලුම පාඨමාලා බලන්න
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-accent-yellow">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="md:w-1/3 flex justify-center"
          >
            <Image
              src="/images/kalum_waduge.png"
              alt="Kalum Waduge"
              width={350}
              height={350}
              className="rounded-full shadow-2xl border-4 border-white object-cover w-64 h-64 md:w-80 md:h-80"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:w-2/3 text-center md:text-left"
          >
            <h2 className="text-3xl md:text-5xl font-heading text-primary-blue mb-6">
              කලුම් වඩුගේ
            </h2>
            <p className="text-xl font-body text-primary-cerulean font-semibold mb-4">
              BSc. Accounting (Sp). - University of Sri Jayewardenepura
            </p>
            <p className="text-lg font-body text-primary-blue/90 leading-relaxed">
              SL Accounting යනු උසස් පෙළ ගිණුම්කරණ අධ්‍යාපනය සඳහා වූ
              ප්‍රමුඛතම ඔන්ලයින් වේදිකාවකි. සිංහල භාෂාව කතා කරන
              සිසුන්ට සංකීර්ණ ගිණුම්කරණ සංකල්ප සරලව තේරුම් ගෙන
              විභාග සඳහා ඵලදායී ලෙස යෙදවීමට අප මග පෙන්වයි.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-accent-coral text-center">
        <motion.div {...fadeIn} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-5xl font-heading text-white mb-6">
            අදම ඔබේ ගමන අරඹන්න!
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 font-body max-w-2xl mx-auto">
            SL Accounting සමඟ එක්වී A/L ගිණුම්කරණ විභාගයෙන් ඉහළම
            ප්‍රතිඵලයක් ලබා ගැනීමට සූදානම් වන්න.
          </p>
          <Link
            href="/register"
            className="bg-primary-blue text-white px-10 py-4 rounded-full font-semibold text-xl hover:bg-text-dark transition-all shadow-xl"
          >
            නොමිලේ ලියාපදිංචි වන්න
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-blue text-white py-10 mt-0">
        <div className="max-w-6xl mx-auto text-center text-sm px-6">
          <p className="mb-2">
            © {new Date().getFullYear()} SL Accounting by Kalum Waduge. සියලු
            හිමිකම් ඇවිරිණි.
          </p>
          <p>Developed by OneX Universe (Pvt) Ltd</p>
        </div>
      </footer>
    </main>
  );
}