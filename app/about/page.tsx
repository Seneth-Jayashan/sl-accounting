"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "About — Kalum Waduge LMS",
  description: "Kalum Waduge Learning Management System — කලුම් වඩුගේ ඉගෙනුම් පද්ධතිය ගැන",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 md:px-12">
      <section className="max-w-6xl mx-auto bg-white shadow-md rounded-2xl overflow-hidden">
        {/* HERO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-8 md:p-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Kalum Waduge LMS
            </h1>
            <p className="mt-4 text-gray-700 text-lg md:text-xl">
              කලුම් වඩුගේ ඉගෙනුම් පද්ධතිය — නිර්මාණාත්මක, ප්‍රායෝගික සහ සිංහල භාෂාවෙන් පරිපූර්ණ පාඨමාලා.
            </p>

            <ul className="mt-6 space-y-3 text-gray-600">
              <li>• සිංහලෙන් සරල සහ පැහැදිලි පාඨමාලා</li>
              <li>• ප්‍රායෝගික ව්‍යායාම සහ බහුමාධ්‍ය ද්‍රව්‍ය</li>
              <li>• සහය සහ නිර්නායක මාර්ගෝපදේශ</li>
            </ul>

            <div className="mt-8 flex gap-3">
              <Link href="/courses">
                <a className="inline-block px-5 py-3 rounded-lg bg-sky-600 text-white font-medium shadow">
                  පාඨමාලා නැරඹීමට
                </a>
              </Link>
              <Link href="/contact">
                <a className="inline-block px-5 py-3 rounded-lg border border-sky-600 text-sky-600 font-medium">
                  අපිට සම්බන්ධ වන්න
                </a>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <Image
                src="/images/kalum_waduge.png"
                alt="Kalum Waduge"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </div>
        </div>

        <hr />

        {/* MISSION & VISION */}
        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold">අපගේ මෙහෙවර</h2>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Kalum Waduge LMS හි මෙහෙවර වන්නේ සිංහල භාෂාවෙන් උසස් තත්ත්වයේ අන්තර්ජාල පාඨමාලා ලබා දීමයි. අපගේ පාඨමාලා practical-oriented වන අතර
              දිනපතා ක්ෂේත්‍රයේ භාවිතයට සුදුසු දැනුම සහ කුසලතා වර්ධනය කිරීමට සැලසුම් කර ඇත.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">දෘෂ්ටිය</h2>
            <p className="mt-3 text-gray-700 leading-relaxed">
              ශ්‍රී ලංකාවේ සහ ලොව පුරා සිංහල කියවන උගත් පුද්ගලයින්ට අත පහසු බුද්ධිමත්ව සහ ඉයුතු පාඨමාලා සකස් කිරීම —
              ඔවුන්ට ආරම්භක සිට උසස් මට්ටමට දක්වා යාමට සහය වීම.
            </p>
          </div>
        </div>

        <hr />

        {/* WHY CHOOSE US */}
        <div className="p-8 md:p-12">
          <h3 className="text-2xl font-semibold">ඇයි අපි තෝරා ගන්නා ද?</h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature title="සිංහල මාධ්‍ය" desc="සියලුම පාඨමාලා සිංහලෙන් — තේරුම් ගැනීම පහසුයි." />
            <Feature title="ප්‍රායෝගිකය" desc="අවශ්‍ය කේස්-ස්ටඩි, ව්‍යායාම සහ ප්‍රායෝගික ව්‍යාපෘති." />
            <Feature title="ගුණාත්මක උපාය" desc="පරිශීලක මෙන්ම ගුරුවරුන්ට-friendly UI/UX" />
            <Feature title="ආධාර සහ ප්‍රශස්තක" desc="උගැන්වීම් සහ සහය ඒකක — ප්‍රතිචාර වේගයෙන්." />
          </div>
        </div>

        <hr />

        {/* TEAM / INSTRUCTOR */}
        <div className="p-8 md:p-12">
          <h3 className="text-2xl font-semibold">ගුරුවරු සහ කණ්ඩායම</h3>
          <p className="mt-3 text-gray-700">
            Kalum Waduge සහ විශේෂඥ ප්‍රවීණ ගුරුවරු රැසක් මෙහි එක්වී ඇත — අත්දැකීම් සහ ක්ෂේත්‍රජ්ඥතාවය මත පාඨමාලා සකස් කරයි.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <TeamCard name="Kalum Waduge" role="Founder & Lead Instructor" imageSrc="/images/kalum_waduge.png" />
            <TeamCard name="Tharaka Perera" role="Senior Instructor" imageSrc="/images/team-placeholder.png" />
            <TeamCard name="Nadeesha Silva" role="Curriculum Designer" imageSrc="/images/team-placeholder.png" />
          </div>
        </div>

        <hr />

        {/* CTA */}
        <div className="p-8 md:p-12 bg-gradient-to-r from-sky-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h4 className="text-2xl md:text-3xl font-bold">ලියාපදිංචි වීමට අදම අරඹන්න</h4>
            <p className="mt-3 text-gray-700">ඔබේ ඉගෙනුම් ගමන අදම ආරම්භ කරන්න — සුළු ගාස්තු, තත්ත්වය උසස්.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/signup">
                <a className="px-6 py-3 rounded-lg bg-sky-600 text-white font-semibold">ලියාපදිංචි වන්න</a>
              </Link>
              <Link href="/contact">
                <a className="px-6 py-3 rounded-lg border border-sky-600 text-sky-600">වැඩි විස්තර</a>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} Kalum Waduge LMS</div>
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h5 className="font-semibold">{title}</h5>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function TeamCard({ name, role, imageSrc }: { name: string; role: string; imageSrc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-4 border rounded-lg bg-white shadow-sm">
      <div className="w-24 h-24 relative rounded-full overflow-hidden">
        <Image src={imageSrc} alt={name} fill style={{ objectFit: "cover" }} />
      </div>
      <div className="mt-3">
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-gray-600">{role}</div>
      </div>
    </div>
  );
}
