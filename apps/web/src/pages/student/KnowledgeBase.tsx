import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SidebarStudent from "../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../components/bottomNavbar/BottomNavStudent";
import { api } from "../../services/api";

type KBItem = {
  _id: string;
  title: string;
  description?: string;
  fileName?: string;
  fileMime?: string;
  uploadedBy?: any;
  createdAt?: string;
  catageory?: string;
};

const StudentKnowledgeBase: React.FC = () => {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/knowledge${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      if (res.data?.success) {
        setItems(res.data.items || []);
      } else {
        setError(res.data?.message || "Failed to load materials");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id: string, fileName?: string) => {
    // Use browser download via protected endpoint
    const url = `/api/v1/knowledge/${id}/download`;
    // open in new tab to allow auth cookies + token via axios interceptor; use full origin
    const full = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "") + `/knowledge/${id}/download`;
    // create an anchor to download
    const a = document.createElement('a');
    a.href = full;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // let browser determine filename; some servers will set Content-Disposition
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-gray-500">Browse and download materials uploaded by admins.</p>
        </div>

        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials" className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          <button onClick={() => fetchItems(search)} className="px-4 py-2 rounded-xl bg-[#0b2540] text-white">Search</button>
        </div>

        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && items.length === 0 && <div className="text-center text-gray-500">No materials available.</div>}

        <div className="grid gap-4">
          {items.map((it) => (
            <div key={it._id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-semibold">{it.title}</div>
                {it.description && <div className="text-sm text-gray-500">{it.description}</div>}
                <div className="text-xs text-gray-400 mt-1">{it.catageory}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-gray-400">{it.createdAt ? new Date(it.createdAt).toLocaleString() : ''}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(it._id, it.fileName)} className="px-3 py-1 rounded-xl border border-gray-200 text-sm">Download</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentKnowledgeBase;
