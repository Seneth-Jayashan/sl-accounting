import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import KnowledgeBaseAdminService from "../../../services/KnowledgeBaseAdminService";
import Dropdown from "../../../components/Dropdown";
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

const CATEGORIES = [
  "Lecture Notes",
  "Reading Materials",
  "Past Papers",
  "Assignments",
  "Other",
];

type FileDetailsProps = {
  file: File;
  displayName: string;
  category: string;
  onDisplayNameChange: (name: string) => void;
  formatBytes: (bytes?: number) => string;
  className?: string;
};

const FileDetails: React.FC<FileDetailsProps> = ({
  file,
  displayName,
  category,
  onDisplayNameChange,
  formatBytes,
  className = "",
}) => {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()?.toUpperCase()
    : "FILE";

  return (
    <div
      className={`p-4 border border-slate-200/80 rounded-xl bg-slate-50/80 flex flex-col sm:flex-row sm:items-start gap-4 ${className}`}
    >
      <div className="w-11 h-11 bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0">
        {ext}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-prussian truncate">
              {displayName || file.name}
            </p>
            <p className="text-xs text-slate-400 tabular-nums">
              {file.type || "Document"}
              {file.size ? ` • ${formatBytes(file.size)}` : ""}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold bg-white border border-slate-200/80 text-brand-cerulean rounded-full shrink-0">
            {category}
          </span>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Display File Name
          </label>
          <input
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Rename file before upload..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white text-sm font-medium text-brand-prussian focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

const AdminKnowledgeBase: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPublished, setIsPublished] = useState(true);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishAt, setPublishAt] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fileAreaRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFileError(null);
    setTitleError(null);
    setDescriptionError(null);
    setMessage(null);

    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const allowedExt = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".zip",
        ".csv",
      ];
      const name = (f.name || "").toLowerCase();
      const hasAllowedExt = allowedExt.some((ext) => name.endsWith(ext));

      if (!hasAllowedExt) {
        setError(
          "Unsupported file type. Please select PDF, Office docs, ZIP, or CSV."
        );
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
          setFilePreviewUrl(null);
        }
        return;
      }

      setFile(f);
      setDisplayName(f.name);

      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }

      if (f.type === "application/pdf" || f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        setFilePreviewUrl(url);
      }
    }
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    setFile(null);
    setDisplayName("");
    setFileError(null);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFileError(null);
    setTitleError(null);
    setDescriptionError(null);

    if (!title.trim()) {
      setTitleError("Title is required");
      setTimeout(
        () =>
          titleRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        50
      );
      return;
    }

    if (!file) {
      setFileError("Please attach a file.");
      setTimeout(
        () =>
          fileAreaRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        50
      );
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      if (description) form.append("description", description.trim());
      form.append("category", category);

      if (schedulePublish && publishAt) {
        form.append("publishAt", new Date(publishAt).toISOString());
        form.append("isPublished", String(false));
      } else {
        form.append("isPublished", String(isPublished));
      }

      if (displayName) form.append("fileName", displayName);

      const originalName = file!.name || "";
      const ext = originalName.includes(".")
        ? originalName.substring(originalName.lastIndexOf("."))
        : "";
      let sendName = displayName || originalName;
      if (displayName && !displayName.includes(".")) sendName = displayName + ext;

      form.set("file", file as Blob, sendName);

      const res = await KnowledgeBaseAdminService.create(form);

      if (res?.success) {
        setTitle("");
        setDescription("");
        setCategory(CATEGORIES[0]);
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
          setFilePreviewUrl(null);
        }
        setFile(null);
        setDisplayName("");

        const scheduled =
          schedulePublish &&
          publishAt &&
          new Date(publishAt).getTime() > Date.now();

        if (scheduled && publishAt) {
          const isMobile = window.matchMedia("(max-width: 639px)").matches;
          const scheduledHtml = isMobile
            ? `<div class="text-sm">You have successfully scheduled this material.</div><div class="mt-3 text-base font-mono"><span id="kb-countdown">--:--:--</span></div>`
            : `<div class="text-sm">You have successfully scheduled this material.</div><div class="mt-3 text-lg font-mono"><span id="kb-countdown">--:--:--</span></div>`;
          Swal.fire({
            title: "Scheduled",
            html: scheduledHtml,
            icon: "success",
            confirmButtonText: "Go to list",
            allowOutsideClick: false,
            ...(isMobile
              ? { width: "92%", padding: "1rem", heightAuto: false }
              : {}),
            didOpen: () => {
              const el = document.getElementById("kb-countdown");
              const target = new Date(publishAt as string).getTime();
              const timer = setInterval(() => {
                const diff = target - Date.now();
                if (!el) return;
                if (diff <= 0) {
                  el.textContent = "00:00:00";
                  clearInterval(timer);
                } else {
                  el.textContent = formatDuration(diff);
                }
              }, 1000);
              Swal.getConfirmButton()?.addEventListener("click", () =>
                clearInterval(timer)
              );
            },
          }).then(() => navigate("/admin/knowledge-list"));
        } else {
          const isMobile = window.matchMedia("(max-width: 639px)").matches;
          Swal.fire({
            title: "Published",
            text: "Material published successfully.",
            icon: "success",
            confirmButtonText: "Go to list",
            ...(isMobile
              ? { width: "92%", padding: "1rem", heightAuto: false }
              : {}),
          }).then(() => {
            navigate("/admin/knowledge-list");
          });
        }
      } else {
        setError(res?.message || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      const serverMessage =
        err?.response?.data?.message || err.message || "Upload error";
      setError(serverMessage);

      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors) {
        if (fieldErrors.title) setTitleError(fieldErrors.title as string);
        if (fieldErrors.description)
          setDescriptionError(fieldErrors.description as string);
        setTimeout(() => {
          if (fieldErrors.title && titleRef.current)
            titleRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          else if (fieldErrors.description && descRef.current)
            descRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        }, 50);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-16">
      {/* HEADER */}
      <header className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/admin/knowledge-list")}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Knowledge Base
        </button>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Upload Material
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Add lecture notes, past papers, or study guides to the student knowledge base.
          </p>
        </div>
      </header>

      {/* FEEDBACK BANNERS */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center gap-2.5 shadow-sm"
          >
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-rose-50 border border-rose-200/80 text-rose-700 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-500"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. RESOURCE DETAILS */}
        <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-prussian">
                Resource Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Title, summary, and category classification
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                  setError(null);
                }}
                placeholder="e.g., Chapter 1 - Introduction to Financial Statements"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 transition-all text-sm font-medium text-brand-prussian placeholder:text-slate-400 ${titleError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                    : "border-slate-200/80 focus:border-brand-cerulean focus:ring-brand-cerulean/20"
                  }`}
              />
              {titleError && (
                <p className="text-xs font-medium text-rose-600">{titleError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Description{" "}
                <span className="text-slate-400 font-normal normal-case">
                  (Optional)
                </span>
              </label>
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError) setDescriptionError(null);
                  setError(null);
                }}
                rows={3}
                placeholder="Brief summary of the topics covered in this material..."
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 resize-none transition-all text-sm text-slate-700 placeholder:text-slate-400 ${descriptionError
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                    : "border-slate-200/80 focus:border-brand-cerulean focus:ring-brand-cerulean/20"
                  }`}
              />
              {descriptionError && (
                <p className="text-xs font-medium text-rose-600">
                  {descriptionError}
                </p>
              )}
            </div>

            <div className="space-y-1.5 max-w-sm">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </label>
              <Dropdown
                value={category}
                onChange={(v) => setCategory(v)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                wrapperClassName="w-full"
                className="px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200/80 text-sm font-medium text-brand-prussian"
              />
            </div>
          </div>
        </section>

        {/* 2. PUBLISHING & SCHEDULE */}
        <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
              <CalendarDaysIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-prussian">
                Availability
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Publish immediately or schedule a future release date
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setIsPublished(true);
                setSchedulePublish(false);
                setPublishAt(null);
              }}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${isPublished
                  ? "bg-brand-prussian text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-prussian"
                }`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Publish Now</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSchedulePublish(true);
                setIsPublished(false);
              }}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${schedulePublish
                  ? "bg-brand-prussian text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-prussian"
                }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>Schedule</span>
            </button>
          </div>

          <AnimatePresence>
            {schedulePublish && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-1.5 max-w-sm">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Publish Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required={schedulePublish}
                    value={publishAt ?? ""}
                    onChange={(e) => setPublishAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 text-sm font-medium text-brand-prussian tabular-nums"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. FILE ATTACHMENT */}
        <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                <PaperClipIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-prussian">
                  File Attachment <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supported formats: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ZIP, CSV
                </p>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 shrink-0">
                <label className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-brand-aliceBlue text-brand-prussian hover:text-brand-cerulean border border-slate-200/80 text-xs font-semibold cursor-pointer transition-colors">
                  Replace
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div ref={fileAreaRef}>
            {!file ? (
              <label
                className={`group relative w-full min-h-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${fileError
                    ? "border-rose-300 bg-rose-50/50"
                    : "border-slate-300 bg-slate-50/70 hover:bg-brand-aliceBlue/25 hover:border-brand-cerulean"
                  }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200/70 flex items-center justify-center text-brand-cerulean group-hover:scale-105 transition-transform mb-3">
                  <ArrowUpTrayIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-brand-prussian">
                  Click to choose a file to upload
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, Word, Excel, PowerPoint, ZIP, or CSV
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {fileError && (
                  <p className="text-xs font-semibold text-rose-600 mt-3">
                    {fileError}
                  </p>
                )}
              </label>
            ) : (
              <div className="space-y-4">
                {filePreviewUrl && (
                  <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50">
                    {file.type === "application/pdf" ? (
                      <iframe
                        src={filePreviewUrl}
                        title="PDF preview"
                        className="w-full h-64 sm:h-72"
                      />
                    ) : (
                      <img
                        src={filePreviewUrl}
                        alt="File preview"
                        className="w-full max-h-72 object-contain mx-auto"
                      />
                    )}
                  </div>
                )}

                <FileDetails
                  file={file}
                  displayName={displayName}
                  category={category}
                  onDisplayNameChange={setDisplayName}
                  formatBytes={formatBytes}
                />
              </div>
            )}
          </div>
        </section>

        {/* ACTION BAR */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex items-center justify-end gap-3 z-40 md:z-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="hidden md:inline-flex px-6 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="w-4 h-4" />
                <span>{schedulePublish ? "Schedule Upload" : "Upload Material"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminKnowledgeBase;