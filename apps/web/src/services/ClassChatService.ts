import { io, Socket } from "socket.io-client";
import api, { getAccessToken } from "./api";

// Matches backend route: /api/chats
const BASE_URL = "/class-chats";

export interface Attachment {
  url: string;
  fileType: 'image' | 'video' | 'file';
  originalName: string;
}

export interface ClassChatMessage {
  _id?: string;
  classId: string;
  sender: string;
  senderRole: "student" | "admin" | "instructor";
  senderName?: string;
  senderAvatar?: string;
  message: string;
  attachments?: Attachment[]; // New Field
  createdAt: string;
}

class ClassChatService {
  private socket: Socket | null = null;
  private readonly SOCKET_ACK_TIMEOUT = 2000;

  private getSocketUrl() {
    // Prioritize dedicated socket URL, else derive from API URL
    const raw = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";
    try {
      const url = new URL(raw);
      return url.origin;
    } catch {
      return raw;
    }
  }

  // --- CONNECTION ---

  init() {
    const token = getAccessToken();
    if (!token || this.socket) return;

    this.socket = io(this.getSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // --- ACTIONS ---

  joinClassRoom(classId: string) {
    this.init();
    if (this.socket && this.socket.connected) {
        this.socket.emit("join_class", { classId });
    } else {
        // Retry once connected
        this.socket?.once("connect", () => {
            this.socket?.emit("join_class", { classId });
        });
    }
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post<{ success: boolean; attachment: Attachment }>(
        `${BASE_URL}/upload`, 
        formData, 
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.success ? data.attachment : null;
    } catch (error) {
      console.error("Upload failed", error);
      return null;
    }
  }

  async fetchHistory(classId: string) {
    try {
      // Route: GET /api/chats/class/:classId
      const { data } = await api.get<{ success: boolean; messages: ClassChatMessage[] }>(
        `${BASE_URL}/class/${classId}`
      );
      return data.success ? data.messages : [];
    } catch (error) {
      console.error("Fetch History Error:", error);
      return [];
    }
  }

  async sendMessage(payload: { classId: string; message: string; sender: string; senderRole: string, attachments?: Attachment[] }) {
    // 1. Try Socket with Acknowledgment
    if (this.socket && this.socket.connected) {
      try {
        const ack = await Promise.race([
          new Promise<any>((resolve) => {
            this.socket?.emit("send_class_message", payload, resolve);
          }),
          new Promise((_, reject) => setTimeout(() => reject("timeout"), this.SOCKET_ACK_TIMEOUT))
        ]);

        if (ack?.ok) return { success: true, message: ack.message };
      } catch (e) {
        console.warn("Socket send failed/timeout, trying REST fallback...");
      }
    }

    // 2. Fallback to REST API
    try {
      const { data } = await api.post(`${BASE_URL}/class`, payload);
      return { success: true, message: data.message };
    } catch (error) {
      console.error("REST send failed:", error);
      return { success: false, error };
    }
  }

  // --- LISTENERS ---

  onMessage(callback: (msg: ClassChatMessage) => void) {
    this.socket?.on("receive_class_message", callback);
  }

  offMessage(callback?: (msg: ClassChatMessage) => void) {
    if (callback) this.socket?.off("receive_class_message", callback);
    else this.socket?.off("receive_class_message");
  }

  emitTyping(classId: string, isTyping: boolean) {
    this.socket?.emit("typing_class", { classId, isTyping });
  }

  onTyping(callback: (data: { isTyping: boolean; senderId: string }) => void) {
    this.socket?.on("typing_class", callback);
  }

  offTyping() {
    this.socket?.off("typing_class");
  }
}

export default new ClassChatService();