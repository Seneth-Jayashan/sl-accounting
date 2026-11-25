import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    NewspaperIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    PhotoIcon,
    ExclamationTriangleIcon,
    MegaphoneIcon,
} from "@heroicons/react/24/outline";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import NewsService, { type NewsItem } from "../../../services/NewsService";

// --- Helpers ---

const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
};

function NewsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
                        <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
                        <div className="h-7 w-16 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="h-10 w-64 bg-slate-100 rounded-xl" />
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-slate-50 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

// --- Main Component ---

export default function AdminNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal & Delete Confirmation State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<"all" | "News" | "Update">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState<"News" | "Update">("News");
    const [isPublished, setIsPublished] = useState(true);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fetchNews = useCallback(async () => {
        try {
            setLoading(true);
            const data = await NewsService.getAllNews();
            setNews(data);
        } catch (error) {
            console.error("Failed to fetch news", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Manage local image preview URL
    useEffect(() => {
        if (!coverImage) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(coverImage);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [coverImage]);

    // Derived KPI stats
    const stats = useMemo(() => {
        const published = news.filter((n) => n.isPublished).length;
        return {
            total: news.length,
            published,
            drafts: news.length - published,
        };
    }, [news]);

    // Filtered list
    const filteredNews = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return news.filter((item) => {
            if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
            if (statusFilter === "published" && !item.isPublished) return false;
            if (statusFilter === "draft" && item.isPublished) return false;
            if (!q) return true;

            return (
                item.title.toLowerCase().includes(q) ||
                stripHtml(item.content).toLowerCase().includes(q)
            );
        });
    }, [news, searchQuery, categoryFilter, statusFilter]);

    const handleOpenModal = (item?: NewsItem) => {
        if (item) {
            setEditingNews(item);
            setTitle(item.title);
            setContent(item.content);
            setCategory(item.category);
            setIsPublished(item.isPublished);
            setCoverImage(null);
        } else {
            setEditingNews(null);
            setTitle("");
            setContent("");
            setCategory("News");
            setIsPublished(true);
            setCoverImage(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (saving) return;
        setIsModalOpen(false);
        setEditingNews(null);
        setCoverImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", content);
            formData.append("category", category);
            formData.append("isPublished", String(isPublished));
            if (coverImage) {
                formData.append("coverImage", coverImage);
            }

            if (editingNews) {
                await NewsService.updateNews(editingNews._id || editingNews.id, formData);
            } else {
                await NewsService.createNews(formData);
            }

            handleCloseModal();
            fetchNews();
        } catch (error) {
            console.error("Failed to save news", error);
            alert("Failed to save news. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await NewsService.deleteNews(deleteTarget._id || deleteTarget.id);
            setDeleteTarget(null);
            fetchNews();
        } catch (error) {
            console.error("Failed to delete news", error);
            alert("Failed to delete news item.");
        } finally {
            setDeleting(false);
        }
    };

    const activeImageSrc = previewUrl || editingNews?.coverImage || null;

    return (
        <div className="space-y-6 md:space-y-8 pb-20 md:pb-10">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
                        News & Updates
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Publish accounting news, announcements, and platform updates for students.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        onClick={fetchNews}
                        disabled={loading}
                        title="Refresh"
                        className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
                    >
                        <ArrowPathIcon
                            className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
                        />
                    </button>

                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                    >
                        <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>Create Post</span>
                    </button>
                </div>
            </div>

            {/* LOADING SKELETON */}
            {loading && news.length === 0 ? (
                <NewsSkeleton />
            ) : (
                <div className="space-y-6">
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                            <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-500/10 blur-2xl" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Total Posts
                                    </p>
                                    <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                                        {stats.total}
                                    </h3>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                    <NewspaperIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                            <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Published
                                    </p>
                                    <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                                        {stats.published}
                                    </h3>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                    <CheckCircleIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                            <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Drafts
                                    </p>
                                    <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                                        {stats.drafts}
                                    </h3>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                                    <DocumentTextIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by title or content..."
                                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Category Filter */}
                                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                                    {(["all", "News", "Update"] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${categoryFilter === cat
                                                    ? "bg-white text-brand-prussian shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                                }`}
                                        >
                                            {cat === "all" ? "All Types" : cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                                    {(["all", "published", "draft"] as const).map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === st
                                                    ? "bg-white text-brand-prussian shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                                }`}
                                        >
                                            {st === "all" ? "All Status" : st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        {filteredNews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                                    <NewspaperIcon className="w-7 h-7 text-slate-300" />
                                </div>
                                <h3 className="text-sm font-semibold text-brand-prussian">
                                    No posts found
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    {news.length === 0
                                        ? "Get started by creating your first news article or platform update."
                                        : "Try adjusting your search query or filters."}
                                </p>
                                {news.length === 0 && (
                                    <button
                                        onClick={() => handleOpenModal()}
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Create First Post
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3.5">Article</th>
                                            <th className="px-6 py-3.5">Category</th>
                                            <th className="px-6 py-3.5">Status</th>
                                            <th className="px-6 py-3.5">Published Date</th>
                                            <th className="px-6 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredNews.map((item) => {
                                            const excerpt = stripHtml(item.content);
                                            return (
                                                <tr
                                                    key={item._id || item.id}
                                                    className="hover:bg-slate-50/80 transition-colors group"
                                                >
                                                    <td className="px-6 py-4 max-w-md">
                                                        <div className="flex items-center gap-3.5">
                                                            {item.coverImage ? (
                                                                <img
                                                                    src={item.coverImage}
                                                                    alt={item.title}
                                                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200/70 shrink-0 bg-slate-100"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                                                                    {item.category === "Update" ? (
                                                                        <MegaphoneIcon className="w-5 h-5" />
                                                                    ) : (
                                                                        <NewspaperIcon className="w-5 h-5" />
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-brand-prussian text-sm truncate">
                                                                    {item.title}
                                                                </div>
                                                                {excerpt && (
                                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                                        {excerpt}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${item.category === "News"
                                                                    ? "bg-blue-50 text-blue-700 ring-blue-600/15"
                                                                    : "bg-purple-50 text-purple-700 ring-purple-600/15"
                                                                }`}
                                                        >
                                                            {item.category}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${item.isPublished
                                                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                                                    : "bg-slate-100 text-slate-600 ring-slate-300/60"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${item.isPublished ? "bg-emerald-500" : "bg-slate-400"
                                                                    }`}
                                                            />
                                                            {item.isPublished ? "Published" : "Draft"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 tabular-nums">
                                                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenModal(item)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                                                                title="Edit post"
                                                            >
                                                                <PencilSquareIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteTarget(item)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                title="Delete post"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/70 overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-brand-prussian">
                                    {editingNews ? "Edit Post" : "Create New Post"}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Fill in the details below to publish or save as a draft.
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form
                            id="news-form"
                            onSubmit={handleSubmit}
                            className="p-6 space-y-5 overflow-y-auto flex-1"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-brand-prussian focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                                        placeholder="e.g., 2026 A/L Accounting Syllabus Update"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as "News" | "Update")}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-brand-prussian bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                                    >
                                        <option value="News">News</option>
                                        <option value="Update">Update</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cover Image Upload */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Cover Image
                                </label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60">
                                    {activeImageSrc ? (
                                        <div className="relative shrink-0">
                                            <img
                                                src={activeImageSrc}
                                                alt="Cover preview"
                                                className="w-24 h-16 object-cover rounded-lg border border-slate-200 bg-white"
                                            />
                                            {coverImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCoverImage(null)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm hover:bg-rose-600"
                                                    title="Remove selected image"
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-24 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
                                            <PhotoIcon className="w-7 h-7" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-brand-prussian hover:border-brand-cerulean hover:text-brand-cerulean cursor-pointer transition-colors shadow-sm">
                                            <PhotoIcon className="w-4 h-4" />
                                            <span>{activeImageSrc ? "Change Image" : "Upload Image"}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-slate-400 mt-1.5 truncate">
                                            {coverImage
                                                ? coverImage.name
                                                : "PNG, JPG, or WEBP recommended (16:9 ratio)."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Rich Text Editor */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Content
                                </label>
                                <div className="rounded-xl border border-slate-200 overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm">
                                    <ReactQuill theme="snow" value={content} onChange={setContent} />
                                </div>
                            </div>

                            {/* Publish Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                                <div>
                                    <p className="text-sm font-semibold text-brand-prussian">
                                        Publish immediately
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Turn off to save this post as a private draft.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isPublished}
                                    onClick={() => setIsPublished(!isPublished)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${isPublished ? "bg-brand-cerulean" : "bg-slate-300"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isPublished ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="news-form"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-prussian hover:bg-brand-cerulean rounded-xl shadow-sm transition-all disabled:opacity-50"
                            >
                                {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                                <span>
                                    {saving
                                        ? "Saving..."
                                        : editingNews
                                            ? "Save Changes"
                                            : "Publish Post"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <ExclamationTriangleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-brand-prussian">
                                    Delete this post?
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Are you sure you want to delete{" "}
                                    <strong className="text-brand-prussian">"{deleteTarget.title}"</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {deleting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                                <span>{deleting ? "Deleting..." : "Delete"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}