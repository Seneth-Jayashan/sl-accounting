import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Clock,
    Tag,
    Share2,
    Check,
    Newspaper,
    BookOpen,
} from "lucide-react";
import NewsService, { type NewsItem } from "../services/NewsService";

// --- Configuration ---
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
)
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/+$/, "");

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
        month: "long",
        day: "numeric",
    });
};

// --- Skeleton Loader ---
function NewsDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAFCFF] pb-24 animate-pulse">
            <div className="h-[340px] bg-slate-200 rounded-b-[2.5rem]" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-sm">
                    <div className="h-72 sm:h-96 bg-slate-100" />
                    <div className="p-6 sm:p-10 space-y-4">
                        <div className="h-4 w-32 bg-slate-100 rounded-full" />
                        <div className="h-8 w-4/5 bg-slate-200 rounded-lg" />
                        <div className="space-y-2.5 pt-4">
                            <div className="h-4 w-full bg-slate-100 rounded" />
                            <div className="h-4 w-full bg-slate-100 rounded" />
                            <div className="h-4 w-5/6 bg-slate-100 rounded" />
                            <div className="h-4 w-3/4 bg-slate-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
export default function NewsDetails() {
    const { id } = useParams<{ id: string }>();
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
    const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [coverFailed, setCoverFailed] = useState(false);
    const [copied, setCopied] = useState(false);

    // Smooth Reading Progress Bar
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 200,
        damping: 30,
        restDelta: 0.001,
    });

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadArticle = async () => {
            setLoading(true);
            setError(false);
            setCoverFailed(false);
            window.scrollTo({ top: 0, behavior: "smooth" });

            try {
                const [articleData, allPublished] = await Promise.all([
                    NewsService.getNewsById(id),
                    NewsService.getAllNews(true).catch(() => [] as NewsItem[]),
                ]);

                if (!isMounted) return;

                setNewsItem(articleData);

                const currentId = articleData?._id || (articleData as any)?.id || id;
                const others = (allPublished || []).filter(
                    (item) => (item._id || (item as any).id) !== currentId
                );
                setRelatedNews(others.slice(0, 3));
            } catch (err) {
                console.error("Failed to fetch news item", err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadArticle();
        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            const input = document.createElement("input");
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const readTime = useMemo(
        () => estimateReadTime(newsItem?.content),
        [newsItem?.content]
    );

    if (loading) return <NewsDetailsSkeleton />;

    if (error || !newsItem) {
        return (
            <div className="min-h-screen bg-[#FAFCFF] flex flex-col items-center justify-center text-center px-6 py-28">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-5 border border-rose-100">
                    <Newspaper className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-prussian mb-2 font-sinhala">
                    සමාවන්න! Article Not Found
                </h2>
                <p className="text-slate-500 mb-8 max-w-md text-sm sm:text-base leading-relaxed">
                    The news article or announcement you are looking for does not exist or may have been unpublished.
                </p>
                <Link
                    to="/news"
                    className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-3.5 rounded-xl font-semibold text-sm shadow-md transition-colors"
                >
                    <ArrowLeft size={17} />
                    <span>Back to All News</span>
                </Link>
            </div>
        );
    }

    const coverSrc = getImageUrl(newsItem.coverImage);

    return (
        <div className="min-h-screen bg-[#FAFCFF] font-sans text-brand-prussian pb-24 selection:bg-brand-cerulean selection:text-white">
            {/* Top Reading Progress Indicator */}
            <motion.div
                style={{ scaleX }}
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cerulean via-brand-jasmine to-brand-coral origin-left z-50"
            />

            {/* HERO HEADER */}
            <header className="relative bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3rem] shadow-xl pt-28 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
                <div className="absolute -top-28 -right-24 w-96 h-96 bg-brand-cerulean rounded-full blur-[130px] opacity-25 pointer-events-none" />
                <div className="absolute -bottom-28 -left-24 w-80 h-80 bg-brand-coral rounded-full blur-[120px] opacity-20 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                    {/* Top Navigation Bar */}
                    <div className="flex items-center justify-between gap-3">
                        <Link
                            to="/news"
                            className="group inline-flex items-center gap-2 text-xs font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 transition-all"
                        >
                            <ArrowLeft
                                size={15}
                                className="group-hover:-translate-x-0.5 transition-transform"
                            />
                            <span>Back to News</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleShare}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border backdrop-blur-md transition-all ${copied
                                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                                    : "bg-white/10 hover:bg-white/15 border-white/15 text-white/90"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check size={14} />
                                    <span>Link Copied</span>
                                </>
                            ) : (
                                <>
                                    <Share2 size={14} />
                                    <span>Share</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Article Metadata & Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cerulean/90 text-white font-bold uppercase tracking-wider border border-white/15 shadow-sm">
                                <Tag size={12} />
                                {newsItem.category || "General"}
                            </span>

                            {newsItem.createdAt && (
                                <span className="inline-flex items-center gap-1.5 text-white/75 font-medium tabular-nums">
                                    <Calendar size={13} className="text-brand-jasmine" />
                                    {formatPublishedDate(newsItem.createdAt)}
                                </span>
                            )}

                            <span className="text-white/30">•</span>

                            <span className="inline-flex items-center gap-1.5 text-white/75 font-medium tabular-nums">
                                <Clock size={13} className="text-brand-jasmine" />
                                {readTime}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-[1.15] font-sinhala tracking-tight">
                            {newsItem.title}
                        </h1>
                    </motion.div>
                </div>
            </header>

            {/* MAIN ARTICLE CONTENT */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-8 z-20 space-y-12">
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="bg-white rounded-3xl shadow-xl shadow-brand-prussian/5 border border-slate-200/80 overflow-hidden"
                >
                    {/* Featured Cover Image */}
                    {coverSrc && !coverFailed && (
                        <div className="w-full max-h-[480px] overflow-hidden bg-slate-100 border-b border-slate-100">
                            <img
                                src={coverSrc}
                                alt={newsItem.title}
                                onError={() => setCoverFailed(true)}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Body */}
                    <div className="p-6 sm:p-10 md:p-12">
                        <div
                            className="prose prose-base sm:prose-lg max-w-none text-slate-600 font-sans leading-relaxed prose-headings:text-brand-prussian prose-headings:font-bold prose-a:text-brand-cerulean prose-a:font-semibold hover:prose-a:underline prose-strong:text-brand-prussian prose-img:rounded-2xl prose-img:border prose-img:border-slate-200/80"
                            dangerouslySetInnerHTML={{ __html: newsItem.content }}
                        />

                        {/* Article Footer Bar */}
                        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center font-bold text-xs shrink-0">
                                    SL
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-prussian">
                                        SL Accounting Editorial Desk
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Official student announcement & syllabus update
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${copied
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-slate-50 hover:bg-brand-aliceBlue border-slate-200/80 text-brand-prussian hover:text-brand-cerulean"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check size={15} />
                                            <span>Link Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 size={15} />
                                            <span>Share Article</span>
                                        </>
                                    )}
                                </button>

                                <Link
                                    to="/news"
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors shadow-sm"
                                >
                                    <span>All Updates</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.article>

                {/* RELATED UPDATES SECTION */}
                {relatedNews.length > 0 && (
                    <section className="space-y-5">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center">
                                    <BookOpen size={16} />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-brand-prussian">
                                    More News & Updates
                                </h2>
                            </div>
                            <Link
                                to="/news"
                                className="text-xs font-semibold text-brand-cerulean hover:text-brand-prussian inline-flex items-center gap-1 transition-colors"
                            >
                                <span>View All</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {relatedNews.map((rel) => {
                                const relId = rel._id || (rel as any).id;
                                const relExcerpt = stripHtml(rel.content);
                                return (
                                    <Link
                                        key={relId}
                                        to={`/news/${relId}`}
                                        className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-cerulean/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                                <span className="px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean text-[10px] font-bold uppercase tracking-wider">
                                                    {rel.category || "General"}
                                                </span>
                                                <span className="text-[11px] text-slate-400 tabular-nums">
                                                    {formatPublishedDate(rel.createdAt)}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors line-clamp-2 font-sinhala leading-snug mb-2">
                                                {rel.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {relExcerpt || "Read full announcement."}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-brand-cerulean group-hover:text-brand-prussian transition-colors">
                                            <span>Read Article</span>
                                            <ArrowRight
                                                size={13}
                                                className="group-hover:translate-x-0.5 transition-transform"
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}