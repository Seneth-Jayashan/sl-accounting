import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Presentation,
  FileEdit,
  Image as ImageIcon,
  File as FileIcon,
  RefreshCw,
  Search,
  Download,
  Pencil,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers,
  UploadCloud,
  Filter,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import moment from "moment";

// Services
import MaterialService, {
  type MaterialData,
} from "../../../services/MaterialService";
import ClassService, { type ClassData } from "../../../services/ClassService";
import MaterialCategoryService, {
  type MaterialCategoryData,
} from "../../../services/MaterialCategoryService";

// --- Helpers ---

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileMeta = (type: string) => {
  switch (type?.toLowerCase()) {
    case "pdf":
      return {
        icon: <FileText className="w-5 h-5 text-rose-600" />,
        bg: "bg-rose-50 ring-rose-100",
        badge: "bg-rose-50 text-rose-700 ring-rose-600/15",
        label: "PDF",
      };
    case "pptx":
    case "ppt":
      return {
        icon: <Presentation className="w-5 h-5 text-amber-600" />,
        bg: "bg-amber-50 ring-amber-100",
        badge: "bg-amber-50 text-amber-700 ring-amber-600/15",
        label: "PPTX",
      };
    case "image":
    case "png":
    case "jpg":
    case "jpeg":
      return {
        icon: <ImageIcon className="w-5 h-5 text-sky-600" />,
        bg: "bg-sky-50 ring-sky-100",
        badge: "bg-sky-50 text-sky-700 ring-sky-600/15",
        label: "IMG",
      };
    case "docx":
    case "doc":
      return {
        icon: <FileEdit className="w-5 h-5 text-blue-600" />,
        bg: "bg-blue-50 ring-blue-100",
        badge: "bg-blue-50 text-blue-700 ring-blue-600/15",
        label: "DOCX",
      };
    default:
      return {
        icon: <FileIcon className="w-5 h-5 text-slate-500" />,
        bg: "bg-slate-100 ring-slate-200",
        badge: "bg-slate-100 text-slate-600 ring-slate-300/60",
        label: type ? type.toUpperCase() : "FILE",
      };
  }
};

// --- Skeleton Loader ---

function MaterialsSkeleton() {
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
      <div className="h-20 bg-white rounded-2xl border border-slate-100" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-56 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-slate-50 rounded-xl" />
              <div className="h-32 bg-slate-50 rounded-xl" />
              <div className="h-32 bg-slate-50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Accordion State
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Upload / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: "",
    categoryId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Reusable Delete Confirmation State
  const [deleteDialog, setDeleteDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Fetch Data ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, classRes, catRes] = await Promise.all([
        MaterialService.getAllMaterials(filterClass),
        ClassService.getAllClasses(),
        MaterialCategoryService.getAllCategories(),
      ]);

      let extractedMaterials: MaterialData[] = [];
      if (Array.isArray(matRes)) {
        extractedMaterials = matRes;
      } else if ((matRes as any)?.data && Array.isArray((matRes as any).data)) {
        extractedMaterials = (matRes as any).data;
      } else if (
        (matRes as any)?.materials &&
        Array.isArray((matRes as any).materials)
      ) {
        extractedMaterials = (matRes as any).materials;
      }
      setMaterials(extractedMaterials);

      let extractedClasses: ClassData[] = [];
      if (classRes?.classes && Array.isArray(classRes.classes)) {
        extractedClasses = classRes.classes;
      } else if (Array.isArray(classRes)) {
        extractedClasses = classRes as unknown as ClassData[];
      } else if ((classRes as any).data && Array.isArray((classRes as any).data)) {
        extractedClasses = (classRes as any).data;
      }
      setClasses(extractedClasses);

      setCategories(catRes || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Filtered & Grouped Data ---
  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((mat) => {
      const catName =
        typeof mat.category === "object" && mat.category ? mat.category.name : "";
      return (
        mat.title.toLowerCase().includes(q) ||
        (mat.description || "").toLowerCase().includes(q) ||
        (mat.fileType || "").toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q)
      );
    });
  }, [materials, searchQuery]);

  const groupedByClass = useMemo(() => {
    const groups: Record<
      string,
      {
        className: string;
        totalFiles: number;
        categories: Record<string, MaterialData[]>;
      }
    > = {};

    filteredMaterials.forEach((mat) => {
      const classObj =
        mat.classDetails || (typeof mat.class === "object" ? mat.class : null);
      const classId = classObj?._id || (mat.class as string) || "unknown";
      const className = classObj?.name || "Unknown Class";

      const catObj = mat.category;
      const catName =
        typeof catObj === "object" && catObj ? catObj.name : "Uncategorized";

      if (!groups[classId]) {
        groups[classId] = { className, totalFiles: 0, categories: {} };
      }
      if (!groups[classId].categories[catName]) {
        groups[classId].categories[catName] = [];
      }
      groups[classId].categories[catName].push(mat);
      groups[classId].totalFiles += 1;
    });

    return Object.entries(groups);
  }, [filteredMaterials]);

  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedFile(null);
    setFormError(null);
    setFormData({
      title: "",
      description: "",
      classId: filterClass || "",
      categoryId: "",
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (mat: MaterialData) => {
    setEditingId(mat._id);
    setSelectedFile(null);
    setFormError(null);

    const cid =
      typeof mat.class === "object" && mat.class !== null
        ? (mat.class as any)._id
        : mat.class;

    const catId =
      typeof mat.category === "object" && mat.category !== null
        ? (mat.category as any)._id
        : mat.category;

    setFormData({
      title: mat.title,
      description: mat.description || "",
      classId: cid || "",
      categoryId: catId || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isUploading) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", description: "", classId: "", categoryId: "" });
    setSelectedFile(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingId && !selectedFile) {
      return setFormError("Please select a file to upload.");
    }
    if (!formData.classId) {
      return setFormError("Please select a target academic class.");
    }
    if (!formData.categoryId) {
      return setFormError("Please select a category.");
    }

    const data = new FormData();
    if (selectedFile) data.append("file", selectedFile);
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("classId", formData.classId);
    data.append("categoryId", formData.categoryId);

    setIsUploading(true);
    try {
      await MaterialService.uploadMaterial(data);
      setIsModalOpen(false);
      setEditingId(null);
      setSelectedFile(null);
      setFormData({ title: "", description: "", classId: "", categoryId: "" });
      loadData();
    } catch {
      setFormError("Upload failed. Please check file size and server constraints.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      await MaterialCategoryService.createCategory(newCategoryName.trim());
      setNewCategoryName("");
      loadData();
    } catch {
      alert("Failed to create category.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const requestDeleteMaterial = (mat: MaterialData) => {
    setDeleteDialog({
      title: "Delete material?",
      message: `Are you sure you want to permanently remove "${mat.title}"? Students will no longer be able to download it.`,
      onConfirm: async () => {
        await MaterialService.deleteMaterial(mat._id);
        await loadData();
      },
    });
  };

  const requestDeleteCategory = (cat: MaterialCategoryData) => {
    setDeleteDialog({
      title: `Delete "${cat.name}" category?`,
      message:
        "Are you sure you want to delete this category? Existing files may become uncategorized.",
      onConfirm: async () => {
        await MaterialCategoryService.deleteCategory(cat._id);
        await loadData();
      },
    });
  };

  const executeDelete = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      await deleteDialog.onConfirm();
      setDeleteDialog(null);
    } catch {
      alert("Delete action failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAllClasses = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    groupedByClass.forEach(([classId]) => {
      next[classId] = expand;
    });
    setExpandedClasses(next);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Academic Materials
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize and distribute lecture notes, tutes, and study resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-brand-prussian border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Layers className="w-4 h-4 text-brand-cerulean" />
            <span>Categories</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Material</span>
          </button>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && materials.length === 0 ? (
        <MaterialsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Resources
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {materials.length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Classes
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {groupedByClass.length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Folder className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Categories
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {categories.length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources by title, description, or file type..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative md:w-64">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none appearance-none cursor-pointer transition-all"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">All Academic Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {groupedByClass.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleAllClasses(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => toggleAllClasses(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          {/* GROUPED MATERIALS ACCORDION */}
          {groupedByClass.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <FileIcon className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-brand-prussian">
                No materials found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {materials.length === 0
                  ? "Upload your first PDF, presentation, or study guide for students."
                  : "Try adjusting your search query or class filter."}
              </p>
              {materials.length === 0 && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Upload First Material
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByClass.map(([classId, classGroup]) => {
                const isClassExpanded = expandedClasses[classId] ?? true;
                const catEntries = Object.entries(classGroup.categories);

                return (
                  <div
                    key={classId}
                    className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Class Accordion Header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedClasses((p) => ({
                          ...p,
                          [classId]: !isClassExpanded,
                        }))
                      }
                      className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/80 hover:bg-brand-aliceBlue/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                          {isClassExpanded ? (
                            <FolderOpen className="w-5 h-5" />
                          ) : (
                            <Folder className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-brand-prussian truncate">
                            {classGroup.className}
                          </h3>
                          <p className="text-xs text-slate-400 tabular-nums">
                            {catEntries.length}{" "}
                            {catEntries.length === 1 ? "category" : "categories"} •{" "}
                            {classGroup.totalFiles}{" "}
                            {classGroup.totalFiles === 1 ? "file" : "files"}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-400 shrink-0 ml-2">
                        {isClassExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Categories & Resource Cards */}
                    {isClassExpanded && (
                      <div className="p-4 sm:p-5 space-y-4 border-t border-slate-100">
                        {catEntries.map(([catName, mats]) => {
                          const catKey = `${classId}-${catName}`;
                          const isCatExpanded = expandedCategories[catKey] ?? true;

                          return (
                            <div
                              key={catKey}
                              className="border border-slate-200/70 rounded-xl overflow-hidden"
                            >
                              {/* Category Header */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCategories((p) => ({
                                    ...p,
                                    [catKey]: !isCatExpanded,
                                  }))
                                }
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/60 hover:bg-slate-100/70 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Layers className="w-4 h-4 text-brand-cerulean shrink-0" />
                                  <span className="font-semibold text-sm text-brand-prussian">
                                    {catName}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full tabular-nums">
                                    {mats.length}
                                  </span>
                                </div>
                                <div className="text-slate-400">
                                  {isCatExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </div>
                              </button>

                              {/* Materials Grid */}
                              {isCatExpanded && (
                                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border-t border-slate-100">
                                  {mats.map((mat) => {
                                    const meta = getFileMeta(mat.fileType);
                                    return (
                                      <div
                                        key={mat._id}
                                        className="group p-4 rounded-xl border border-slate-200/70 hover:border-brand-cerulean/40 hover:shadow-md transition-all flex flex-col bg-white"
                                      >
                                        {/* Top Row */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2.5">
                                            <div
                                              className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0 ${meta.bg}`}
                                            >
                                              {meta.icon}
                                            </div>
                                            <span
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 uppercase tracking-wider ${meta.badge}`}
                                            >
                                              {meta.label}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleEditClick(mat)}
                                              title="Edit material"
                                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                requestDeleteMaterial(mat)
                                              }
                                              title="Delete material"
                                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 mb-4">
                                          <h4 className="text-sm font-bold text-brand-prussian line-clamp-2 leading-snug">
                                            {mat.title}
                                          </h4>
                                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">
                                            {mat.description || "No description provided."}
                                          </p>
                                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mt-2.5 tabular-nums">
                                            <span>{mat.fileSize || "—"}</span>
                                            <span>•</span>
                                            <span>
                                              {moment(mat.createdAt).format(
                                                "DD MMM YYYY"
                                              )}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Download CTA */}
                                        <a
                                          href={`${import.meta.env.VITE_API_BASE_URL}${mat.fileUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-brand-prussian text-brand-prussian hover:text-white border border-slate-200/70 hover:border-brand-prussian rounded-xl text-xs font-semibold transition-all"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Download File</span>
                                        </a>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- CREATE / EDIT RESOURCE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-brand-prussian">
                  {editingId ? "Update Resource" : "Upload New Material"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach a file and assign it to a class and category.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form
              id="material-form"
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Academic Class <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                      value={formData.classId}
                      onChange={(e) =>
                        setFormData({ ...formData, classId: e.target.value })
                      }
                    >
                      <option value="">Select class...</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                    >
                      <option value="">Select category...</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  placeholder="e.g., Week 01 Lecture Notes — Cash Flow Statements"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none resize-none"
                  placeholder="Briefly explain what this file covers..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* File Dropzone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Attachment {!editingId && <span className="text-rose-500">*</span>}
                </label>
                {selectedFile ? (
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-aliceBlue/50 border border-brand-cerulean/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white text-brand-cerulean flex items-center justify-center shadow-sm shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-prussian truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {formatBytes(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-cerulean bg-slate-50/70 hover:bg-brand-aliceBlue/20 cursor-pointer transition-all text-center">
                    <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-brand-cerulean mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-brand-prussian">
                      Click to choose a file
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PDF, PPTX, DOCX, or Image files
                    </span>
                    <input
                      type="file"
                      onChange={(e) =>
                        e.target.files?.[0] && setSelectedFile(e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                )}
                {editingId && (
                  <p className="text-[11px] text-slate-400 italic">
                    Leave empty to keep the existing file.
                  </p>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                disabled={isUploading}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="material-form"
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold bg-brand-prussian hover:bg-brand-cerulean text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {isUploading
                    ? "Uploading..."
                    : editingId
                      ? "Save Changes"
                      : "Upload Resource"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MANAGE CATEGORIES MODAL --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-brand-prussian">
                  Manage Categories
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organize materials into reusable sections.
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-brand-prussian hover:bg-brand-cerulean text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {isCreatingCategory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Add</span>
                </button>
              </form>

              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                    No categories created yet.
                  </p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl"
                    >
                      <span className="font-semibold text-brand-prussian text-sm">
                        {cat.name}
                      </span>
                      <button
                        onClick={() => requestDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  {deleteDialog.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {deleteDialog.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteDialog(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}