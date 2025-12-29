import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import KnowledgeBaseAdminService from "../../../services/KnowledgeBaseAdminService";
import { ArrowUpTrayIcon, XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";

const CATEGORIES = [
  "Lecture Notes",
  "Reading Materials",
  "Past Papers",
  "Assignments",
  "Other",
];

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
      const allowedExt = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".csv"];
      const name = (f.name || "").toLowerCase();
      const hasAllowedExt = allowedExt.some((ext) => name.endsWith(ext));
      
      if (!hasAllowedExt) {
        setError("Unsupported file type. Please select PDF, Office docs, ZIP, or CSV.");
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
      setTimeout(() => titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }

    if (!file) {
      setFileError("Please attach a file.");
      setTimeout(() => fileAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      if (description) form.append("description", description.trim());
      form.append("category", category);
      
      if (schedulePublish && publishAt) {
        form.append("publishAt", publishAt);
        form.append("isPublished", String(false));
      } else {
        form.append("isPublished", String(isPublished));
      }
      
      if (displayName) form.append("fileName", displayName);

      const originalName = file!.name || "";
      const ext = originalName.includes(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";
      let sendName = displayName || originalName;
      if (displayName && !displayName.includes(".")) sendName = displayName + ext;
      
      form.set("file", file as Blob, sendName);

      const res = await KnowledgeBaseAdminService.create(form);

      if (res?.success) {
        // Reset form
        setTitle("");
        setDescription("");
        setCategory(CATEGORIES[0]);
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
          setFilePreviewUrl(null);
        }
        setFile(null);
        setDisplayName("");

        const scheduled = schedulePublish && publishAt && new Date(publishAt).getTime() > Date.now();

        if (scheduled && publishAt) {
          Swal.fire({
            title: "Scheduled",
            html: `<div class="text-sm">Material scheduled successfully.</div><div class="mt-3 text-lg font-mono"><span id="kb-countdown">--:--:--</span></div>`,
            icon: "success",
            confirmButtonText: "Go to list",
            allowOutsideClick: false,
            didOpen: () => {
              const el = document.getElementById("kb-countdown");
              const target = new Date(publishAt as string).getTime();
              let timer = setInterval(() => {
                const diff = target - Date.now();
                if (!el) return;
                if (diff <= 0) {
                  el.textContent = "00:00:00";
                  clearInterval(timer);
                } else {
                  el.textContent = formatDuration(diff);
                }
              }, 1000);
              Swal.getConfirmButton()?.addEventListener("click", () => clearInterval(timer));
            },
          }).then(() => navigate("/admin/knowledge-list"));
        } else {
          Swal.fire({
            title: "Published",
            text: "Material published successfully.",
            icon: "success",
            confirmButtonText: "Go to list",
          }).then(() => navigate("/admin/knowledge-list"));
        }
      } else {
        setError(res?.message || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      const serverMessage = err?.response?.data?.message || err.message || "Upload error";
      setError(serverMessage);
      
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors) {
        if (fieldErrors.title) setTitleError(fieldErrors.title as string);
        if (fieldErrors.description) setDescriptionError(fieldErrors.description as string);
        setTimeout(() => {
          if (fieldErrors.title && titleRef.current) titleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          else if (fieldErrors.description && descRef.current) descRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-12">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-prussian">Upload Material</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Add resources to the student knowledge base.
          </p>
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium flex items-start gap-2">
             <span className="mt-0.5">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          
          {/* TITLE INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
                setError(null);
              }}
              placeholder="e.g. Chapter 1 - Introduction"
              className={`w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cerulean/20 transition-all text-sm font-medium ${
                titleError ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-brand-cerulean"
              }`}
            />
            {titleError && <p className="text-xs text-red-600 ml-1">{titleError}</p>}
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Description
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
              placeholder="Brief summary of the content..."
              className={`w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cerulean/20 resize-none transition-all text-sm font-medium ${
                descriptionError ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-brand-cerulean"
              }`}
            />
            {descriptionError && <p className="text-xs text-red-600 ml-1">{descriptionError}</p>}
          </div>

          {/* CATEGORY & PUBLISH OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-cerulean/20 cursor-pointer text-sm font-medium appearance-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Availability
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublished(true);
                    setSchedulePublish(false);
                    setPublishAt(null);
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    isPublished
                      ? "bg-brand-prussian text-white shadow-md"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSchedulePublish(true);
                    setIsPublished(false);
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    schedulePublish
                      ? "bg-brand-prussian text-white shadow-md"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>

          {/* SCHEDULE INPUT */}
          {schedulePublish && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Publish Date & Time
              </label>
              <input
                type="datetime-local"
                value={publishAt ?? ""}
                onChange={(e) => setPublishAt(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-cerulean/20 text-sm font-medium"
              />
            </div>
          )}

          {/* FILE UPLOAD AREA */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Attachment <span className="text-red-500">*</span>
            </label>
            
            {!file ? (
              <div
                ref={fileAreaRef}
                className={`relative w-full h-40 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center hover:bg-blue-50/50 hover:border-brand-cerulean/50 transition-all cursor-pointer group ${
                  fileError ? "border-red-300 bg-red-50/50" : "border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <ArrowUpTrayIcon className="w-6 h-6 text-brand-cerulean" />
                    </div>
                    <p className="text-sm font-bold text-gray-600">Tap to upload file</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">PDF, DOC, PPT, ZIP</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {fileError && (
                  <p className="text-xs text-red-600 font-bold mt-2 absolute bottom-2">{fileError}</p>
                )}
              </div>
            ) : (
              <div ref={fileAreaRef} className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-cerulean/10 rounded-lg flex items-center justify-center text-brand-cerulean">
                            <DocumentIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 line-clamp-1 break-all">{file.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{formatBytes(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                            setFile(null);
                            setFilePreviewUrl(null);
                        }}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name (Optional)</label>
                    <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-cerulean outline-none transition-all"
                        placeholder="Rename file for students..."
                    />
                </div>

                {filePreviewUrl && file.type.startsWith("image/") && (
                    <div className="mt-4">
                        <img src={filePreviewUrl} alt="preview" className="h-32 rounded-lg object-cover border border-gray-200" />
                    </div>
                )}
              </div>
            )}
          </div>

          {/* STICKY ACTION BAR (Mobile) / STATIC (Desktop) */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-none md:p-0 z-20">
             <div className="flex gap-3 max-w-3xl mx-auto">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3.5 rounded-xl bg-brand-prussian text-white font-bold text-sm hover:bg-brand-cerulean transition-colors shadow-lg shadow-brand-cerulean/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Uploading..." : "Upload Material"}
                </button>
             </div>
          </div>

        </form>
      </div>
  );
};

export default AdminKnowledgeBase;