import { useEffect, useMemo, useState } from "react";
import SidebarAdmin from "../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../components/bottomNavbar/BottomNavAdmin";
import SupportService, {
  type SupportMessage,
} from "../../services/SupportService";

type Tab = "all" | "unreplied";

export default function SupportReply() {
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<SupportMessage[]>([]);
  const [error, setError] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    SupportService.list()
      .then((items) => {
        if (!mounted) return;
        // Sort newest first
        const sorted = [...items].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        setList(sorted);
        if (sorted.length > 0) {
          setSelected(sorted[0]);
          setReply(sorted[0].reply ?? "");
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load support messages.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "unreplied")
      return list.filter((m) => !m.reply || m.reply.trim() === "");
    return list;
  }, [list, tab]);

  const onSelect = (m: SupportMessage) => {
    setSelected(m);
    setReply(m.reply ?? "");
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const body = reply.trim();
    if (!body) {
      setError("Reply cannot be empty.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await SupportService.reply(selected._id, {
        name: selected.name,
        gmail: selected.gmail,
        phoneNumber: selected.phoneNumber,
        message: selected.message,
        reply: body,
      });

      // Update list and selected
      setList((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      setSelected(updated);
      setReply(updated.reply ?? "");
    } catch (e) {
      console.error(e);
      setError("Failed to send reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#E8EFF7]">
      {/* Sidebar (left) */}
      <div className="flex-shrink-0 sticky top-0 h-screen overflow-hidden z-40 hidden lg:block">
        <SidebarAdmin collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden">
          <div className="max-w-5xl mx-auto xl:mx-0 space-y-6">
            <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Support Messages</h1>
          <div className="inline-flex rounded-lg overflow-hidden border">
            <button
              className={`px-3 py-1.5 text-sm ${
                tab === "all" ? "bg-[#0b2540] text-white" : "bg-white"
              }`}
              onClick={() => setTab("all")}
            >
              All
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${
                tab === "unreplied" ? "bg-[#0b2540] text-white" : "bg-white"
              }`}
              onClick={() => setTab("unreplied")}
            >
              Unreplied
            </button>
          </div>
            </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            Loading messages...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="lg:col-span-1 rounded-lg border bg-white overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">
                  No messages to show.
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((m) => {
                    const isActive = selected?._id === m._id;
                    const hasReply = Boolean(m.reply && m.reply.trim());
                    return (
                      <li
                        key={m._id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          isActive ? "bg-gray-50" : ""
                        }`}
                        onClick={() => onSelect(m)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-gray-500">
                              {m.gmail} • {m.phoneNumber}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              hasReply
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {hasReply ? "Replied" : "Pending"}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {m.message}
                        </div>
                        {m.createdAt && (
                          <div className="mt-1 text-[11px] text-gray-400">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail + Reply */}
            <div className="lg:col-span-2 rounded-lg border bg-white p-4">
              {!selected ? (
                <div className="text-gray-500">
                  Select a message to view and reply.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-lg font-semibold">
                        {selected.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        <a
                          className="hover:underline"
                          href={`mailto:${selected.gmail}`}
                        >
                          {selected.gmail}
                        </a>
                        <span className="mx-2">•</span>
                        <a
                          className="hover:underline"
                          href={`tel:${selected.phoneNumber}`}
                        >
                          {selected.phoneNumber}
                        </a>
                      </div>
                    </div>
                    {selected.createdAt && (
                      <div className="text-xs text-gray-400">
                        {new Date(selected.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      User Message
                    </div>
                    <div className="mt-1 whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-sm text-gray-800">
                      {selected.message}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Your Reply
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-[#0b2540]/40"
                      rows={6}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your response to the user..."
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-md bg-[#0b2540] px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
                      >
                        {submitting
                          ? "Sending..."
                          : selected.reply?.trim()
                          ? "Update Reply & Send"
                          : "Send Reply"}
                      </button>
                      {selected.reply?.trim() && (
                        <span className="text-xs text-gray-500">
                          Last reply saved. Sending will email the user.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </main>
      </div>

      {/* Bottom nav for mobile */}
      <BottomNavAdmin />
    </div>
  );
}
