import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import KnowledgeBaseAdminService from "../../../services/KnowledgeBaseAdminService";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import Dropdown from "../../../components/Dropdown";

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
}) => (
  <div className={`p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}>
    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
      FILE
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium">{displayName || file.name}</div>
      <div className="text-xs text-gray-400">
        {file.type || ""} {file.size ? `• ${formatBytes(file.size)}` : ""}
      </div>
      <div className="mt-2">
        <input
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          className="w-full px-3 py-2 rounded border bg-white text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Edit file name before upload</p>
      </div>
    </div>
    <div className="text-left sm:text-right">
      <div className="inline-block px-3 py-1 text-xs bg-gray-100 rounded-full">{category}</div>
    </div>
  </div>
);

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
          const isMobile = window.matchMedia("(max-width: 639px)").matches;
          const scheduledHtml = isMobile
            ? `<div class="text-sm">You have successfully scheduled this material.</div><div class="mt-3 text-base font-mono"><span id="kb-countdown">--:--:--</span></div>`
            : `<div class="text-sm">You have successfully scheduled this material.</div><div class="mt-3 text-lg font-mono"><span id="kb-countdown">--:--:--</span></div>`;
          // show countdown modal
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
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
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

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-lg"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
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
              <Dropdown
                value={category}
                onChange={(v) => setCategory(v)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                wrapperClassName="w-full"
                className="px-4 py-2 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Availability
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublished(true);
                    setSchedulePublish(false);
                    setPublishAt(null);
                  }}
                  className={`w-full sm:w-40 py-2 rounded-xl text-base font-semibold ${
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
                  className={`w-full sm:w-40 py-2 rounded-lg text-base font-semibold ${
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
                className={`mt-2 relative w-full aspect-[4/3] sm:aspect-video bg-gray-50 rounded-xl overflow-hidden flex flex-col items-center justify-center hover:bg-gray-100 transition-colors group cursor-pointer border-2 border-dashed ${
                  fileError ? "border-red-400 bg-red-50" : "border-gray-300"
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
              <div ref={fileAreaRef} className="mt-2 w-full">
                <div className="mb-2 flex justify-start sm:justify-end">
                  <label className="px-3 py-1 rounded-xl border border-gray-200 text-sm cursor-pointer bg-white">
                    Update file
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {filePreviewUrl ? (
                  <div>
                    {file?.type === "application/pdf" ? (
                      <iframe
                        src={filePreviewUrl}
                        title="PDF preview"
                        className="w-full h-56 sm:h-64 border rounded shadow-sm"
                      />
                    ) : (
                      <img
                        src={filePreviewUrl}
                        alt="preview"
                        className="w-full max-h-64 object-contain rounded shadow-sm"
                      />
                    )}
                    <FileDetails
                      file={file as File}
                      displayName={displayName}
                      category={category}
                      onDisplayNameChange={setDisplayName}
                      formatBytes={formatBytes}
                      className="mt-3"
                    />
                  </div>
                ) : (
                  <FileDetails
                    file={file as File}
                    displayName={displayName}
                    category={category}
                    onDisplayNameChange={setDisplayName}
                    formatBytes={formatBytes}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-5 py-2 rounded-xl border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#0b2540] text-white font-medium disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>

        </form>
      </div>
  );
};

export default AdminKnowledgeBase;