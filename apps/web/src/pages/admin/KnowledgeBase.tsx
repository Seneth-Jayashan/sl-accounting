import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SidebarAdmin from "../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../components/bottomNavbar/BottomNavAdmin";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../../services/api";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

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
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setMessage(null);
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];

      // Client-side extension whitelist (defensive; file dialog may still show "All files")
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
          "Unsupported file type. Please select PDF, Word, Excel, PowerPoint, ZIP, or CSV."
        );
        // clear any previously set preview/url
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
          setFilePreviewUrl(null);
        }
        return;
      }
      setFile(f);
      setDisplayName(f.name);
      // create preview for PDFs and images
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

    if (!title.trim()) return setError("Title is required");
    if (!file)
      return setError(
        "Please attach a file (pdf/doc/docx/xls/xlsx/ppt/pptx/zip/csv)"
      );

    setLoading(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      if (description) form.append("description", description.trim());
      // NOTE: backend expects the misspelled field name `catageory`
      form.append("catageory", category);
      // If scheduled, send publishAt and ensure isPublished=false
      if (schedulePublish && publishAt) {
        form.append("publishAt", publishAt);
        form.append("isPublished", String(false));
      } else {
        form.append("isPublished", String(isPublished));
      }
      // include optional display name
      if (displayName) form.append("fileName", displayName);

      // ensure uploaded file includes filename (preserve/override extension)
      if (file) {
        const originalName = file.name || "";
        const ext = originalName.includes(".")
          ? originalName.substring(originalName.lastIndexOf("."))
          : "";
        let sendName = displayName || originalName;
        if (displayName && !displayName.includes("."))
          sendName = displayName + ext;
        form.delete("file");
        form.append("file", file as Blob, sendName);
      }

      // Do not set Content-Type header manually; let Axios set boundary
      const res = await api.post("/knowledge", form);

      if (res.data?.success) {
        // clear local form state
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
          // show countdown modal
          Swal.fire({
            title: "Scheduled",
            html: `<div class="text-sm">You have successfully scheduled this material.</div><div class="mt-3 text-lg font-mono"><span id="kb-countdown">--:--:--</span></div>`,
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
              // clear on confirm
              Swal.getConfirmButton()?.addEventListener("click", () =>
                clearInterval(timer)
              );
            },
          }).then(() => {
            navigate("/admin/knowledge-list");
          });
        } else {
          Swal.fire({
            title: "Published",
            text: "Material published",
            icon: "success",
            confirmButtonText: "Go to list",
          }).then(() => {
            navigate("/admin/knowledge-list");
          });
        }
      } else {
        setError(res.data?.message || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} showHeader={false}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base — Upload</h1>
          <p className="text-sm text-gray-500">
            Upload PDFs and materials for registered students.
          </p>
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-lg"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 - Introduction"
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0b2540]/20 shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0b2540]/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0b2540]/20 cursor-pointer shadow-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Publish
              </label>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublished(true);
                    setSchedulePublish(false);
                    setPublishAt(null);
                  }}
                  className={`w-40 py-2 rounded-xl w- text-base font-semibold ${
                    isPublished
                      ? "bg-[#0b2540] text-white"
                      : "bg-gray-100 text-gray-700"
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
                  className={`w-40 py-2 rounded-lg text-base font-semibold ${
                    schedulePublish
                      ? "bg-[#0b2540] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>

          {schedulePublish && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Publish At
              </label>
              <input
                type="datetime-local"
                value={publishAt ?? ""}
                onChange={(e) => setPublishAt(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0b2540]/20"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">
              File (pdf/doc/docx/ppt/pptx/xls/xlsx/zip/csv)
            </label>
            {!file ? (
              <div className="mt-2 relative w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex flex-col items-center justify-center hover:bg-gray-100 transition-colors group cursor-pointer">
                <div className="text-center p-4">
                  <ArrowUpTrayIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">
                    Drag & drop files here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    or click to browse — PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, CSV
                  </p>
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-sm text-gray-700 cursor-pointer">
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      Choose file
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="mt-2 w-full">
                <div className="mb-2 flex justify-end">
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
                    {file && file.type === "application/pdf" ? (
                      <iframe
                        src={filePreviewUrl}
                        title="PDF preview"
                        className="w-full h-64 border rounded shadow-sm"
                      />
                    ) : (
                      <img
                        src={filePreviewUrl}
                        alt="preview"
                        className="max-h-64 rounded shadow-sm"
                      />
                    )}

                    {/* Show file info + editable filename even when previewing (PDF/Image) */}
                    <div className="mt-3 p-4 border rounded-lg bg-gray-50 flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                        FILE
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {displayName || file?.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {file?.type ? file.type : ""}{" "}
                          {file ? `• ${formatBytes(file.size)}` : ""}
                        </div>
                        <div className="mt-2">
                          <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 rounded border bg-white text-sm"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Edit file name before upload
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-block px-3 py-1 text-xs bg-gray-100 rounded-full">
                          {category}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                      FILE
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {displayName || file?.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {file?.type ? file.type : ""}{" "}
                        {file ? `• ${formatBytes(file.size)}` : ""}
                      </div>
                      <div className="mt-2">
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3 py-2 rounded border bg-white text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Edit file name before upload
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-3 py-1 text-xs bg-gray-100 rounded-full">
                        {category}
                      </div>
                    </div>
                  </div>
                )}
                {filePreviewUrl && (
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <div className="text-sm font-medium">{file?.name}</div>
                      <div className="text-xs text-gray-400">
                        {file?.type ? file.type : ""}{" "}
                        {file ? `• ${formatBytes(file.size)}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-3 py-1 text-xs bg-gray-100 rounded-full">
                        {category}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0b2540] text-white font-medium disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AdminKnowledgeBase;
