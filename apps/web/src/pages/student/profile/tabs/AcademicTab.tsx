import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  ListVideo,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../../../contexts/AuthContext";
import BatchService, {
  type BatchData,
} from "../../../../services/BatchService";
import EnrollmentService, {
  type EnrollmentResponse,
} from "../../../../services/EnrollmentService";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function AcademicTab() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAcademicData = async () => {
      try {
        const enrollRes = await EnrollmentService.getMyEnrollments();
        if (isMounted) {
          setEnrollments(Array.isArray(enrollRes) ? enrollRes : []);
        }

        const batchId =
          typeof user?.batch === "string"
            ? user.batch
            : (user?.batch as any)?._id;

        if (batchId) {
          const batchRes = await BatchService.getBatchById(batchId);
          if (isMounted && batchRes.batch) {
            setBatchData(batchRes.batch);
          }
        }
      } catch (error) {
        console.error("Failed to fetch academic data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user) fetchAcademicData();
    else setLoading(false);

    return () => {
      isMounted = false;
    };
  }, [user]);

  const classEnrollments = useMemo(
    () => enrollments.filter((e) => !e.lessonPack),
    [enrollments]
  );

  const packEnrollments = useMemo(
    () => enrollments.filter((e) => Boolean(e.lessonPack)),
    [enrollments]
  );

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-3xl bg-white border border-gray-100 p-6 space-y-4">
          <div className="h-5 w-40 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-56 rounded-3xl bg-white border border-gray-100 p-6 space-y-3">
          <div className="h-5 w-44 bg-gray-200 rounded-lg" />
          <div className="h-16 bg-gray-50 rounded-2xl" />
          <div className="h-16 bg-gray-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* --- 1. BATCH INFORMATION --- */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
              Batch Information
            </h2>
            <p className="text-xs text-gray-400">
              Your assigned academic cohort
            </p>
          </div>
        </div>

        {batchData ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-5 sm:p-6 text-white shadow-md">
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-jasmine/20 blur-2xl" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-brand-jasmine">
                  <Sparkles size={11} />
                  Assigned Batch
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {batchData.name}
                </h3>
                <p className="text-sm text-white/75 mt-1 leading-relaxed">
                  {batchData.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2.5">
                  <Calendar
                    size={16}
                    className="text-brand-jasmine shrink-0"
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                      Start Date
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {formatDate(batchData.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2.5">
                  <Calendar
                    size={16}
                    className="text-brand-jasmine shrink-0"
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                      End Date
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {formatDate(batchData.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center">
            <p className="text-sm font-semibold text-gray-500">
              No batch information assigned yet.
            </p>
          </div>
        )}
      </section>

      {/* --- 2. ENROLLED CLASSES --- */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
              <BookOpen size={19} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                Enrolled Classes
              </h2>
              <p className="text-xs text-gray-400">
                Your live & physical class enrollments
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-bold shrink-0">
            {classEnrollments.length}
          </span>
        </div>

        {classEnrollments.length > 0 ? (
          <div className="space-y-3">
            {classEnrollments.map((enroll) => {
              const classData = enroll.class as any;
              const classId =
                typeof classData === "string" ? classData : classData?._id;
              const className = classData?.name || "Class Name Unavailable";

              return (
                <Link
                  key={enroll._id}
                  to={classId ? `/student/class/${classId}` : "/student/classes"}
                  className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-brand-cerulean/35 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean group-hover:bg-brand-cerulean group-hover:text-white flex items-center justify-center font-extrabold text-base shrink-0 transition-colors">
                      {className.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-brand-prussian group-hover:text-brand-cerulean truncate transition-colors">
                        {className}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize truncate mt-0.5">
                        {classData?.subject || "General Subject"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${enroll.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          : "bg-red-50 text-red-600 border-red-200/80"
                        }`}
                    >
                      {enroll.isActive ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {enroll.isActive ? "Active" : "Expired"}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all hidden sm:block"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
            <BookOpen size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">
              No Enrolled Classes Yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Classes you join will appear here automatically.
            </p>
          </div>
        )}
      </section>

      {/* --- 3. ENROLLED LESSON PACKS --- */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ListVideo size={19} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                Enrolled Lesson Packs
              </h2>
              <p className="text-xs text-gray-400">
                Purchased revision bundles & playlists
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold shrink-0">
            {packEnrollments.length}
          </span>
        </div>

        {packEnrollments.length > 0 ? (
          <div className="space-y-3">
            {packEnrollments.map((enroll) => {
              const packData = enroll.lessonPack as any;
              const packId =
                typeof packData === "string" ? packData : packData?._id;
              const packTitle =
                packData?.title || "Lesson Pack Name Unavailable";

              return (
                <Link
                  key={enroll._id}
                  to={
                    packId
                      ? `/student/lesson-packs/${packId}`
                      : "/student/lesson-packs"
                  }
                  className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-purple-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center font-extrabold text-base shrink-0 transition-colors">
                      {packTitle.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-brand-prussian group-hover:text-purple-600 truncate transition-colors">
                        {packTitle}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {packData?.description || "Video lesson bundle"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${enroll.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          : "bg-red-50 text-red-600 border-red-200/80"
                        }`}
                    >
                      {enroll.isActive ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {enroll.isActive ? "Active" : "Expired"}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all hidden sm:block"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
            <ListVideo size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">
              No Lesson Packs Yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Purchased revision playlists will appear here.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}