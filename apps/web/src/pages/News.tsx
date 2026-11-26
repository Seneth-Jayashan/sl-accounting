import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Search,
    Newspaper,
    ArrowRight,
    Calendar,
    Clock,
    Sparkles,
    X,
    RotateCcw,
    ArrowUpDown,
    ChevronDown,
    Tag,
} from "lucide-react";
import NewsService, { type NewsItem } from "../services/NewsService";

// --- Configuration ---
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
)
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/+$/, "");

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// --- Helpers ---
const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
};

const stripHtml = (html?: string): string => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();
};

const estimateReadTime = (html?: string): string => {
    const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
};

const formatPublishedDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// --- Skeleton Loader ---
function NewsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-6 h-64 lg:h-80 bg-slate-100" />
                <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
                    <div className="h-4 w-28 bg-slate-100 rounded-full" />
                    <div className="h-7 w-4/5 bg-slate-200 rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-3.5 w-full bg-slate-100 rounded" />
                        <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                        <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
                    </div>
                    <div className="h-10 w-36 bg-slate-200 rounded-xl pt-4" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden flex flex-col"
                    >
                        <div className="h-48 bg-slate-100" />
                        <div className="p-6 space-y-3 flex-1">
                            <div className="h-3.5 w-24 bg-slate-100 rounded-full" />
                            <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                            <div className="h-3.5 w-full bg-slate-100 rounded" />
                            <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Cover Image with Branded Fallback ---
function NewsCover({
    src,
    alt,
    className = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
}: {
    src: string | null;
    alt: string;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-brand-prussian via-[#07273D] to-brand-cerulean flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-jasmine mb-2.5 relative z-10">
                    <Newspaper className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 relative z-10">
                    SL Accounting News
                </span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            className={className}
            loading="lazy"
        />
    );
}

// --- Main Component ---
export default function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    useEffect(() => {
        const fetchPublishedNews = async () => {
            try {
                setLoading(true);
                const data = await NewsService.getAllNews(true);
                setNews(data || []);
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedNews();
    }, []);

    // Build dynamic categories with counts
    const categories = useMemo(() => {
        const map = new Map<string, number>();
        news.forEach((item) => {
            const cat = (item.category || "General").trim();
            map.set(cat, (map.get(cat) || 0) + 1);
        });
        return [
            { key: "All", label: "All Updates", count: news.length },
            ...Array.from(map.entries()).map(([key, count]) => ({
                key,
                label: key,
                count,
            })),
        ];
    }, [news]);

    // Filtered & Sorted Articles
    const filteredNews = useMemo(() => {
        const q = search.toLowerCase().trim();

        const filtered = news.filter((item) => {
            const cat = (item.category || "General").trim();
            if (selectedCategory !== "All" && cat !== selectedCategory) return false;

            if (!q) return true;
            const plainContent = stripHtml(item.content).toLowerCase();
            return (
                item.title.toLowerCase().includes(q) ||
                cat.toLowerCase().includes(q) ||
                plainContent.includes(q)
            );
        });

        return [...filtered].sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return sortOrder === "newest" ? db - da : da - db;
        });
    }, [news, search, selectedCategory, sortOrder]);

    const hasActiveFilters =
        search.trim() !== "" ||
        selectedCategory !== "All" ||
        sortOrder !== "newest";

    const resetFilters = () => {
        setSearch("");
        setSelectedCategory("All");
        setSortOrder("newest");
    };

    // Show featured banner card when browsing unfiltered with at least 3 articles
    const showFeatured = !hasActiveFilters && filteredNews.length >= 3;
    const featuredArticle = showFeatured ? filteredNews[0] : null;
    const gridArticles = showFeatured ? filteredNews.slice(1) : filteredNews;

    return (
        <div className="min-h-screen bg-[#FAFCFF] font-sans text-brand-prussian pb-24 selection:bg-brand-cerulean selection:text-white">
            {/* HERO SECTION */}
            <header className="relative bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3rem] shadow-xl pt-32 pb-16 sm:pt-36 sm:pb-20 px-4 sm:px-6">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
                <div className="absolute -top-32 -left-20 w-[480px] h-[480px] bg-brand-cerulean rounded-full blur-[130px] opacity-25 pointer-events-none" />
                <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] bg-brand-coral rounded-full blur-[130px] opacity-20 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-brand-jasmine text-[11px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md"
                    >
                        <Sparkles size={13} />
                        <span>Announcements, Exam Alerts & Articles</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="text-3xl sm:text-5xl md:text-6xl font-black mb-5 tracking-tight font-sans leading-[1.1]"
                    >
                        Latest{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">
                            News & Updates
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.16 }}
                        className="text-sm sm:text-lg text-white/75 max-w-2xl mx-auto mb-9 leading-relaxed font-sans"
                    >
                        Stay informed with A/L syllabus updates, class schedule notices, exam tips, and official announcements from SL Accounting.
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/20 p-1.5 border border-white/20 focus-within:ring-4 focus-within:ring-brand-cerulean/30 transition-all">
                            <div className="pl-3.5 pr-2.5 text-slate-400">
                                <Search size={19} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search articles, exam notices, or keywords..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full py-2.5 px-1 text-sm sm:text-base text-brand-prussian outline-none placeholder:text-slate-400 font-medium bg-transparent"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="p-2 mr-1 rounded-xl text-slate-400 hover:text-brand-prussian hover:bg-slate-100 transition-colors"
                                >
                                    <X size={17} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 space-y-8">
                {/* Filter & Sort Toolbar */}
                {!loading && news.length > 0 && (
                    <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Category Tabs */}
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70 overflow-x-auto self-start max-w-full">
                                {categories.map((tab) => {
                                    const active = selectedCategory === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setSelectedCategory(tab.key)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${active
                                                    ? "bg-brand-prussian text-white shadow-sm"
                                                    : "text-slate-600 hover:text-brand-prussian hover:bg-white/60"
                                                }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                                                        ? "bg-white/20 text-white"
                                                        : "bg-slate-200/70 text-slate-500"
                                                    }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative sm:min-w-[190px]">
                                <ArrowUpDown
                                    size={14}
                                    className="text-brand-cerulean absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                />
                                <select
                                    value={sortOrder}
                                    onChange={(e) =>
                                        setSortOrder(e.target.value as "newest" | "oldest")
                                    }
                                    aria-label="Sort articles"
                                    className="w-full appearance-none bg-slate-50 border border-slate-200/80 text-brand-prussian py-2.5 pl-9 pr-9 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none cursor-pointer text-xs font-semibold transition-all"
                                >
                                    <option value="newest">Sort: Newest First</option>
                                    <option value="oldest">Sort: Oldest First</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Summary & Reset Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Newspaper size={14} className="text-brand-cerulean" />
                                <span>
                                    Showing{" "}
                                    <strong className="text-brand-prussian tabular-nums">
                                        {filteredNews.length}
                                    </strong>{" "}
                                    {filteredNews.length === 1 ? "article" : "articles"}
                                </span>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors"
                                >
                                    <RotateCcw size={13} />
                                    <span>Reset Filters</span>
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* CONTENT AREA */}
                {loading ? (
                    <NewsSkeleton />
                ) : filteredNews.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-white rounded-3xl shadow-sm border border-dashed border-slate-200 max-w-xl mx-auto">
                        <div className="w-16 h-16 bg-brand-aliceBlue/70 text-brand-cerulean rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Newspaper className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-prussian mb-1.5">
                            {news.length === 0
                                ? "No news or updates yet"
                                : "No matching articles found"}
                        </h3>
                        <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto leading-relaxed">
                            {news.length === 0
                                ? "Check back soon for the latest class announcements and accounting updates."
                                : "We couldn't find any articles matching your current search or category filter."}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors shadow-sm"
                            >
                                <RotateCcw size={14} />
                                <span>Clear All Filters</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* FEATURED LATEST ARTICLE */}
                        {featuredArticle && (() => {
                            const articleId =
                                featuredArticle._id || (featuredArticle as any).id;
                            const coverSrc = getImageUrl(featuredArticle.coverImage);
                            const excerpt = stripHtml(featuredArticle.content);
                            const readTime = estimateReadTime(featuredArticle.content);

                            return (
                                <motion.article
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className="group bg-white rounded-3xl border border-slate-200/80 hover:border-brand-cerulean/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    <Link
                                        to={`/news/${articleId}`}
                                        className="grid grid-cols-1 lg:grid-cols-12 focus:outline-none"
                                    >
                                        <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto min-h-[280px] overflow-hidden bg-slate-100">
                                            <NewsCover src={coverSrc} alt={featuredArticle.title} />
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-prussian/60 via-transparent to-transparent lg:hidden" />
                                            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-prussian/90 backdrop-blur-md text-brand-jasmine text-[10px] font-bold uppercase tracking-widest border border-white/15 shadow-sm">
                                                <Sparkles size={11} /> Latest Update
                                            </span>
                                        </div>

                                        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-aliceBlue text-brand-cerulean text-xs font-bold uppercase tracking-wider rounded-full">
                                                        <Tag size={11} />
                                                        {featuredArticle.category || "General"}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium tabular-nums">
                                                        <Calendar size={13} />
                                                        {formatPublishedDate(featuredArticle.createdAt)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium tabular-nums">
                                                        <Clock size={13} />
                                                        {readTime}
                                                    </span>
                                                </div>

                                                <h2 className="text-2xl sm:text-3xl font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors font-sinhala leading-snug mb-4">
                                                    {featuredArticle.title}
                                                </h2>

                                                <p className="text-slate-500 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
                                                    {excerpt || "Read the full announcement for details."}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-prussian group-hover:bg-brand-cerulean text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm">
                                                    <span>Read Full Article</span>
                                                    <ArrowRight
                                                        size={15}
                                                        className="group-hover:translate-x-1 transition-transform"
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            );
                        })()}

                        {/* NEWS ARTICLES GRID */}
                        <motion.div
                            key={`${selectedCategory}-${sortOrder}-${search}`}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                        >
                            {gridArticles.map((item) => {
                                const articleId = item._id || (item as any).id;
                                const coverSrc = getImageUrl(item.coverImage);
                                const excerpt = stripHtml(item.content);
                                const readTime = estimateReadTime(item.content);

                                return (
                                    <motion.article
                                        key={articleId}
                                        variants={cardVariants}
                                        className="group bg-white rounded-3xl border border-slate-200/80 hover:border-brand-cerulean/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                                    >
                                        <Link
                                            to={`/news/${articleId}`}
                                            className="flex flex-col h-full focus:outline-none"
                                        >
                                            {/* Cover Image */}
                                            <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                                                <NewsCover src={coverSrc} alt={item.title} />
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-prussian/70 via-transparent to-transparent opacity-60" />

                                                <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1 px-3 py-1 bg-white/95 backdrop-blur-md text-brand-cerulean text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                                                    {item.category || "General"}
                                                </span>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-2.5 tabular-nums">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatPublishedDate(item.createdAt)}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {readTime}
                                                    </span>
                                                </div>

                                                <h2 className="text-lg font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors line-clamp-2 font-sinhala leading-snug mb-2.5">
                                                    {item.title}
                                                </h2>

                                                <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-5 flex-1">
                                                    {excerpt || "Click to read the full update."}
                                                </p>

                                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-cerulean group-hover:text-brand-prussian transition-colors">
                                                    <span>Read Article</span>
                                                    <ArrowRight
                                                        size={15}
                                                        className="group-hover:translate-x-1 transition-transform"
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.article>
                                );
                            })}
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}