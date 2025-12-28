import { io, Socket } from "socket.io-client";
import api, { getAccessToken } from "./api";


export interface ChatMessage {
  _id?: string;
  ticket: string;
  sender: string;
  senderRole: "student" | "admin";
  senderName?: string;
  senderAvatar?: string;
  clientMessageId?: string;
  message: string;
  attachments?: ChatAttachment[];
  createdAt: string;
}

export interface ChatAttachment {
  url: string;
  fileType: "image" | "file";
  originalName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

class ChatService {
  private socket: Socket | null = null;
  // Timeout (ms) to wait for socket ack before falling back to REST
  private readonly SOCKET_ACK_TIMEOUT_MS = 2000;

  // Resolve the socket base URL and strip any /api/* suffix that may be set for REST
  private getSocketUrl() {
    const fallback = typeof window !== "undefined" ? window.location.origin : "";

    // Prefer explicitly set socket URL, else reuse API baseURL to stay on same host/port
    const raw =
      (import.meta as any).env?.VITE_SOCKET_URL ||
      (import.meta as any).env?.VITE_SERVER_URL ||
      api?.defaults?.baseURL ||
      (import.meta as any).env?.VITE_API_URL ||
      fallback;

    try {
      const url = new URL(raw, fallback || "http://localhost");
      // Socket.IO handshake hits /socket.io at the root; strip any /api/v1 suffix
      url.pathname = url.pathname.replace(/\/api(\/v\d+)?\/?$/i, "");
      return url.toString().replace(/\/$/, "");
    } catch {
      return raw;
    }
  }



  init() {
    const token = getAccessToken();
    if (!token) {
      console.warn("ChatService: No access token found. Delaying connection...");
      return;
    }

    if (this.socket) return;
    const baseUrl = this.getSocketUrl();
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    this.socket.on("connect_error", (err) =>
      console.error("ChatService socket connect_error", err?.message || err)
    );
    this.socket.on("reconnect_error", (err) =>
      console.error("ChatService socket reconnect_error", err?.message || err)
    );
  }

  joinTicket(ticketId: string) {
    this.init();
    this.socket?.emit("join_ticket", { ticketId });
  }

  onReceiveMessage(cb: (msg: ChatMessage) => void) {
    this.init();
    this.socket?.on("receive_message", cb);
  }

  offReceiveMessage(cb?: (msg: ChatMessage) => void) {
    this.init();
    if (!this.socket) return;
    if (cb) this.socket.off("receive_message", cb);
    else this.socket.off("receive_message");
  }

  onTicketCreated(cb: (ticket: any) => void) {
    this.init();
    this.socket?.on("ticket_created", cb);
  }

  offTicketCreated(cb?: (ticket: any) => void) {
    this.init();
    if (!this.socket) return;
    if (cb) this.socket.off("ticket_created", cb);
    else this.socket.off("ticket_created");
  }

  onTicketStatusUpdated(cb: (payload: any) => void) {
    this.init();
    this.socket?.on("ticket_status_updated", cb);
  }

  offTicketStatusUpdated(cb?: (payload: any) => void) {
    this.init();
    if (!this.socket) return;
    if (cb) this.socket.off("ticket_status_updated", cb);
    else this.socket.off("ticket_status_updated");
  }

  onTyping(cb: (data: { isTyping: boolean; senderId: string }) => void) {
    this.socket?.on("typing", cb);
  }

  offTyping(cb?: (data: { isTyping: boolean; senderId: string }) => void) {
    if (!this.socket) return;
    if (cb) this.socket.off("typing", cb);
    else this.socket.off("typing");
  }

  /**
   * Start a chat session for a ticket: join room, fetch history, and attach listeners.
   * Returns an unsubscribe function to detach listeners.
   */
  async startTicketSession(
    ticketId: string,
    handlers: {
      onInitialMessages?: (messages: ChatMessage[]) => void;
      onMessage?: (msg: ChatMessage) => void;
      onTyping?: (data: { isTyping: boolean; senderId: string }) => void;
    }
  ): Promise<() => void> {
    this.joinTicket(ticketId);

    // Fetch history
    try {
      const history = await this.fetchMessages(ticketId);
      handlers.onInitialMessages?.(history);
    } catch (err) {
      console.error("ChatService history load failed", err);
    }

    const receiveHandler = (msg: ChatMessage) => handlers.onMessage?.(msg);
    const typingHandler = (data: { isTyping: boolean; senderId: string }) =>
      handlers.onTyping?.(data);

    this.onReceiveMessage(receiveHandler);
    this.onTyping(typingHandler);

    return () => {
      this.offReceiveMessage(receiveHandler);
      this.offTyping(typingHandler);
    };
  }

  async sendMessage(payload: Partial<ChatMessage> & { ticket: string }) {
    const hasMessage = !!payload.message && payload.message.trim().length > 0;
    const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0;

    if (!payload.ticket || !payload.sender || !payload.senderRole || (!hasMessage && !hasAttachments)) {
      console.warn("sendMessage: missing required fields", payload);
      return { ok: false, error: "missing_fields" } as const;
    }

    const envelope = {
      ticket: payload.ticket,
      ticketId: payload.ticket,
      sender: payload.sender,
      senderId: payload.sender,
      senderRole: payload.senderRole,
      message: payload.message,
      attachments: payload.attachments,
      senderName: payload.senderName,
      senderAvatar: payload.senderAvatar,
      clientMessageId: payload.clientMessageId,
    };

    // 1) Try socket with ack
    let socketResult: { ok?: boolean; error?: string; message?: ChatMessage } | null = null;
    if (this.socket) {
      socketResult = await new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve({ ok: false, error: "socket_timeout" });
          }
        }, this.SOCKET_ACK_TIMEOUT_MS);

        this.socket?.emit(
          "send_message",
          envelope,
          (ack?: { ok?: boolean; error?: string; message?: ChatMessage }) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(ack ?? { ok: false, error: "no_ack" });
          }
        );
      });
    }

    if (socketResult?.ok) {
      return { ok: true, message: socketResult.message } as const;
    }

    // 2) Fallback to REST persistence
    try {
      const { data } = await api.post<ChatMessage>("/chats", {
        ticket: payload.ticket,
        sender: payload.sender,
        senderRole: payload.senderRole,
        message: payload.message,
        attachments: payload.attachments,
        clientMessageId: payload.clientMessageId,
      });

      // Optionally append denormalized fields if available
      const saved: ChatMessage = {
        ...data,
        senderName: payload.senderName ?? (data as any).senderName,
        senderAvatar: payload.senderAvatar ?? (data as any).senderAvatar,
      };

      // Return saved message so caller (UI) can append it when socket path isn't available
      return { ok: true, fallback: true, message: saved } as const;
    } catch (err: any) {
      console.error("REST chat fallback failed", err?.response?.data || err);
      return { ok: false, error: "rest_failed" } as const;
    }
  }

  emitTyping(ticketId: string, isTyping: boolean, senderId: string) {
    this.socket?.emit("typing", { ticketId, isTyping, senderId });
  }

  async fetchMessages(ticketId: string) {
    // API route is /chats/:ticketId
    const res = await api.get(`/chats/${ticketId}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  async uploadTicketAttachment(file: File) {
    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/chats/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const attachment = (res.data as any)?.attachment as ChatAttachment | undefined;
    if (!attachment?.url) {
      throw new Error("Upload failed: missing attachment url");
    }
    return attachment;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new ChatService();
