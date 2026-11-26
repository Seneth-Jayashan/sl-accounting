import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  FileText,
  Download,
  Presentation,
  Image as ImageIcon,
  File as FileIcon,
  FileEdit,
  Lock,
  AlertCircle,
  ChevronDown,
  Search,
  X,
  Calendar,
  CreditCard,
} from "lucide-react";
import MaterialService, {
  type MaterialData,
} from "../../../../services/MaterialService";
import EnrollmentService, {
  type EnrollmentResponse,
} from "../../../../services/EnrollmentService";

// --- HELPERS ---
const getMonthString = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

type FileFilter = "all" | "pdf" | "docs" | "images";

const getFileVisuals = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t === "pdf") {
    return {
      icon: FileText,
      bg: "bg-red-50",
      text: "text-red-500",
      badge: "bg-red-50 text-red-600 border-red-100",
      label: "PDF",
      group: "pdf" as const,
    };
  }
  if (t === "pptx" || t === "ppt") {
    return {
      icon: Presentation,
      bg: "bg-orange-50",
      text: "text-orange-500",
      badge: "bg-orange-50 text-orange-600 border-orange-100",
      label: t.toUpperCase(),
      group: "docs" as const,
    };
  }
  if (t === "docx" || t === "doc") {
    return {
      icon: FileEdit,
      bg: "bg-blue-50",
      text: "text-blue-600",
      badge: "bg-blue-50 text-blue-600 border-blue-100",
      label: t.toUpperCase(),
      group: "docs" as const,
    };
  }
  if (["jpg", "jpeg", "png", "webp"].includes(t)) {
    return {
      icon: ImageIcon,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
      label: t.toUpperCase(),
      group: "images" as const,
    };
  }
  return {
    icon: FileIcon,
    bg: "bg-gray-100",
    text: "text-gray-500",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: t ? t.toUpperCase() : "FILE",
    group: "docs" as const,
  };
};

export default function ResourcesTab({ classId }: { classId: string }) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [fileFilter, setFileFilter] = useState<FileFilter>("all");

  // 1. Fetch Data (Materials + Enrollment)
  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [matRes, enrollRes] = await Promise.all([
          MaterialService.getStudentMaterials(classId),
          EnrollmentService.getMyEnrollments(),
        ]);

        if (isMounted) {
          const data = (matRes as any).data || matRes;
          if (Array.isArray(data)) {
            setMaterials(data);
          } else if (data && typeof data === "object") {
            setMaterials(Array.isArray(data.data) ? data.data : [data]);
          } else {
            setMaterials([]);
          }

          const match = enrollRes.find((e: any) => {
            const currentId = e.class?._id || e.class;
            return currentId?.toString() === classId?.toString();
          });
          setEnrollment(match || null);
        }
      } catch (err) {
        console.error("Failed to load resources data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [classId]);

  // 2. Access Logic Helper
  const getAccessStatus = (file: MaterialData) => {
    if (!enrollment) return { locked: true, reason: "Not Enrolled" };

    const fileMonth = getMonthString(file.createdAt);
    const paidMonths = enrollment.paidMonths || [];

    if (!paidMonths.includes(fileMonth)) {
      const monthName = new Date(file.createdAt).toLocaleDateString("en-US", {
        month: "long",
      });
      return { locked: true, reason: `Pay for ${monthName}` };
    }

    return { locked: false, reason: "" };
  };

  // 3. Sorted & Filtered Materials
  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...materials]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .filter((file) => {
        const visuals = getFileVisuals(file.fileType);
        if (fileFilter !== "all" && visuals.group !== fileFilter) return false;

        if (q) {
          const catName =
            typeof file.category === "object" && file.category?.name
              ? file.category.name
              : "Uncategorized";
          return (
            file.title?.toLowerCase().includes(q) ||
            file.description?.toLowerCase().includes(q) ||
            catName.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [materials, searchQuery, fileFilter]);

  // 4. Group by Category
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, MaterialData[]> = {};
    filteredMaterials.forEach((file) => {
      const categoryName =
        typeof file.category === "object" && file.category?.name
          ? file.category.name
          : "Uncategorized";

      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(file);
    });
    return groups;
  }, [filteredMaterials]);

  // 5. Open first category by default
  useEffect(() => {
    const keys = Object.keys(groupedMaterials);
    if (keys.length > 0 && Object.keys(expandedCategories).length === 0) {
      setExpandedCategories({ [keys[0]]: true });
    }
  }, [groupedMaterials, expandedCategories]);

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-3xl border border-gray-100" />
        <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4">
          <div className="h-10 w-56 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-gray-50 rounded-2xl border border-gray-100"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- EMPTY LIBRARY STATE ---
  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 sm:p-20 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center mb-4">
          <FolderOpen size={30} />
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
          No Study Materials Yet
        </h3>
        <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
          Your instructor hasn't uploaded any lecture notes, slides, or handouts for this class yet.
        </p>
      </div>
    );
  }

  const isFiltering = Boolean(searchQuery.trim()) || fileFilter !== "all";
  const categoryEntries = Object.entries(groupedMaterials);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* --- TOP TOOLBAR: HEADER, FILTERS & SEARCH --- */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
            <FolderOpen size={21} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-prussian tracking-tight">
                Study Materials
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-bold">
                {materials.length} {materials.length === 1 ? "File" : "Files"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Downloadable notes, slides & handouts
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* File Type Filter Pills */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "all", label: "All" },
                { key: "pdf", label: "PDF" },
                { key: "docs", label: "Docs" },
                { key: "images", label: "Images" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFileFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${fileFilter === tab.key
                    ? "bg-white text-brand-prussian shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- NO FILTER MATCHES --- */}
      {categoryEntries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-base font-bold text-brand-prussian mb-1">
            No matching files found
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try clearing your search or switching the file type filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFileFilter("all");
            }}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* --- CATEGORY ACCORDIONS --- */
        <div className="space-y-4">
          {categoryEntries.map(([category, files]) => {
            const isCatExpanded =
              isFiltering || expandedCategories[category] || false;

            return (
              <section
                key={category}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Category Header */}
                <button
                  onClick={() =>
                    setExpandedCategories((prev) => ({
                      ...prev,
                      [category]: !prev[category],
                    }))
                  }
                  className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors ${isCatExpanded
                      ? "bg-brand-aliceBlue/35"
                      : "hover:bg-gray-50/80"
                    }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isCatExpanded
                          ? "bg-brand-cerulean text-white shadow-sm"
                          : "bg-brand-cerulean/10 text-brand-cerulean"
                        }`}
                    >
                      {isCatExpanded ? (
                        <FolderOpen size={20} />
                      ) : (
                        <Folder size={20} />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-base sm:text-lg font-extrabold text-brand-prussian truncate">
                        {category}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {files.length} {files.length === 1 ? "Document" : "Documents"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isCatExpanded
                        ? "bg-brand-prussian text-white rotate-180"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {/* Category Files Grid */}
                <AnimatePresence initial={false}>
                  {isCatExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.map((file) => {
                            const { locked, reason } = getAccessStatus(file);
                            const visuals = getFileVisuals(file.fileType);
                            const FileTypeIcon = visuals.icon;

                            return (
                              <article
                                key={file._id}
                                className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${locked
                                    ? "bg-white/70 border-gray-200/80"
                                    : "bg-white border-gray-100 shadow-sm hover:border-brand-cerulean/35 hover:shadow-lg hover:shadow-brand-prussian/5 hover:-translate-y-0.5"
                                  }`}
                              >
                                {/* Top Row: Icon + Type Badge */}
                                <div>
                                  <div className="flex items-start justify-between gap-3 mb-3.5">
                                    <div
                                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${locked
                                          ? "bg-gray-100 text-gray-400"
                                          : `${visuals.bg} ${visuals.text}`
                                        }`}
                                    >
                                      {locked ? (
                                        <Lock size={19} />
                                      ) : (
                                        <FileTypeIcon size={20} />
                                      )}
                                    </div>

                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${locked
                                          ? "bg-red-50 text-red-500 border-red-100"
                                          : visuals.badge
                                        }`}
                                    >
                                      {locked ? "Locked" : visuals.label}
                                    </span>
                                  </div>

                                  {/* Title & Description */}
                                  <h4
                                    title={file.title}
                                    className={`text-sm sm:text-base font-extrabold line-clamp-2 leading-snug transition-colors ${locked
                                        ? "text-gray-400"
                                        : "text-brand-prussian group-hover:text-brand-cerulean"
                                      }`}
                                  >
                                    {file.title}
                                  </h4>

                                  {file.description && !locked && (
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                                      {file.description}
                                    </p>
                                  )}

                                  {/* Meta Info */}
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-400 mt-3">
                                    {locked ? (
                                      <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                                        <AlertCircle size={12} />
                                        {reason}
                                      </span>
                                    ) : (
                                      <>
                                        <span>{file.fileSize || "Document"}</span>
                                        {file.createdAt && (
                                          <>
                                            <span className="text-gray-300">•</span>
                                            <span className="inline-flex items-center gap-1">
                                              <Calendar size={11} />
                                              {formatDate(file.createdAt)}
                                            </span>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Action Button */}
                                <div className="mt-5 pt-3.5 border-t border-gray-100">
                                  {locked ? (
                                    <button
                                      onClick={() =>
                                        navigate(`/student/payment/create/${classId}`)
                                      }
                                      className="w-full py-2.5 px-4 rounded-xl bg-brand-prussian text-white text-xs font-bold hover:bg-brand-cerulean transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                    >
                                      <CreditCard size={14} />
                                      <span>Pay to Unlock</span>
                                    </button>
                                  ) : (
                                    <a
                                      href={`${import.meta.env.VITE_API_BASE_URL}${file.fileUrl}`}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="w-full py-2.5 px-4 rounded-xl bg-brand-aliceBlue/70 text-brand-prussian hover:bg-brand-prussian hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                      <Download size={15} />
                                      <span>Download File</span>
                                    </a>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}