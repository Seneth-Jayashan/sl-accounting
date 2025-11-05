"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-secondary-alice text-primary-blue font-body">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 py-16">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="md:w-1/2 text-center md:text-left"
        >
          <h1 className="text-4xl md:text-6xl font-heading text-primary-blue leading-tight mb-4">
            A/L ගිණුම්කරණය <br />
            <span className="text-primary-cerulean">
              කලුම් වඩුගේ සමඟ
            </span>
          </h1>
          <p className="text-lg md:text-xl text-primary-blue/80 mb-8 leading-relaxed">
            සිංහල භාෂාවෙන් ගිණුම්කරණය ඉගෙන ගන්න — සරලව, නිරවද්‍යව, 
            සහ විභාගයට සූදානම්ව!  
            <br />SL Accounting LMS එක මඟින් ඔබේ අනාගතය පාලනය කරන්න.
          </p>
          <a
            href="/courses"
            className="bg-primary-cerulean text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-blue transition"
          >
            ඉගෙනීම අරඹන්න
          </a>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-10 md:mt-0 md:w-1/2 flex justify-center"
        >
          <Image
            src="/images/kalum_waduge.png"
            alt="Kalum Waduge"
            width={480}
            height={480}
            className="rounded-2xl shadow-lg"
            priority
          />
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading text-primary-blue mb-6">
            අපගේ අරමුණ
          </h2>
          <p className="text-lg md:text-xl text-primary-blue/80 font-body leading-relaxed">
            “අපේ මූලික අරමුණ වන්නේ සිසුන්ට Accounting විෂයය 
            සාර්ථකව අත්දැකීමට සහ ඔවුන්ගේ අනාගත වෘත්තිය සඳහා 
            ශක්තිමත් පදනමක් ලබා දීමයි.”
          </p>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 px-6 bg-secondary-blue/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            {
              title: "උසස් තත්ත්වයේ පන්ති",
              desc: "ඔබේ විභාගය සඳහා නිවැරදි මගපෙන්වීම සහ විශ්වාසනීය විෂය දැක්ම.",
            },
            {
              title: "සජීවී සහ වීඩියෝ පාඩම්",
              desc: "කාලය අනුව ඉගෙනීම — ඔබේ වේලාවට පරිපූර්ණව ගැලපෙන LMS පද්ධතියක්.",
            },
            {
              title: "10000+ සිසුන්ගේ විශ්වාසය",
              desc: "SL Accounting සමඟ A/L Accounting විභාගය සාර්ථක කර ගත් සිසුන්ගේ සතුට.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-secondary-alice hover:shadow-xl transition"
            >
              <h3 className="text-2xl font-heading text-primary-blue mb-4">
                {item.title}
              </h3>
              <p className="text-primary-blue/80">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-accent-jasmine">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading text-primary-blue mb-6">
            SL Accounting ගැන
          </h2>
          <p className="text-lg md:text-xl font-body text-primary-blue/90 leading-relaxed">
            SL Accounting යනු A/L ගිණුම්කරණය ඉගෙනීමට 
            ශ්‍රී ලංකාවේ සිසුන් සඳහා නිර්මාණය වූ 
            නවීන Online Learning Platform එකකි.  
            කලුම් වඩුගේ මහතාගේ විශේෂඥත්වය සහ 
            උනන්දුව සිසුන්ට සරලව සහ විශ්වාසවත වශයෙන් 
            Accounting දැනුම ලබා ගැනීමට උපකාරී වේ.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-blue text-white py-10 mt-16">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <p className="mb-2">
            © {new Date().getFullYear()} SL Accounting by Kalum Waduge. සියලු හිමිකම් ඇවිරිණි.
          </p>
          <p>Developed by OneX Universe (Pvt) Ltd</p>
        </div>
      </footer>
    </main>
  );
}
