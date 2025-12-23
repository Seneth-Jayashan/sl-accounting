import { io, Socket } from "socket.io-client";
import api from "./api";
import { type Ticket } from "./TicketService";

export interface ChatMessage {
  _id?: string;
  ticket: string;
  sender: string;
  senderRole: "student" | "admin";
  senderName?: string;
  senderAvatar?: string;
  message: string;
  createdAt: string;
}

class ChatService {
  private socket: Socket | null = null;
  private readonly joinedRooms = new Set<string>();
  // Timeout (ms) to wait for socket ack before falling back to REST
  private readonly SOCKET_ACK_TIMEOUT_MS = 2000;

  // Resolve the socket base URL and strip any /api/* suffix that may be set for REST
  private getSocketUrl() {
    const fallback = typeof window !== "undefined" ? window.location.origin : "";
    const raw =
      (import.meta as any).env?.VITE_SOCKET_URL ||
      (import.meta as any).env?.VITE_SERVER_URL ||
      (import.meta as any).env?.VITE_API_URL ||
      fallback;

    try {
      const url = new URL(raw, fallback || "http://localhost");
      //  Socket.IO handshake hits /socket.io at the root
      url.pathname = url.pathname.replace(/\/api(\/v\d+)?\/?$/i, "");
      return url.toString().replace(/\/$/, "");
    } catch {
      return raw;
    }
  }

  init() {
    if (this.socket) return;
    const baseUrl = this.getSocketUrl();
    this.socket = io(baseUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    // Rejoin any ticket rooms after reconnect so chat continues seamlessly
    this.socket.on("connect", () => {
      this.joinedRooms.forEach((room) => {
        this.socket?.emit("join_ticket", { ticketId: room });
      });
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
    if (!ticketId) return;
    this.joinedRooms.add(ticketId);
    this.socket?.emit("join_ticket", { ticketId });
  }

  onTicketStatusUpdated(cb: (data: any) => void) {
    this.init();
    this.socket?.on("ticket_status_updated", cb);
  }

  offTicketStatusUpdated(cb?: (data: any) => void) {
    if (!this.socket) return;
    if (cb) this.socket.off("ticket_status_updated", cb);
    else this.socket.off("ticket_status_updated");
  }

  onTicketCreated(cb: (ticket: Ticket) => void) {
    this.init();
    this.socket?.on("ticket_created", cb);
  }

  offTicketCreated(cb?: (ticket: Ticket) => void) {
    if (!this.socket) return;
    if (cb) this.socket.off("ticket_created", cb);
    else this.socket.off("ticket_created");
  }

  onReceiveMessage(cb: (msg: ChatMessage) => void) {
    this.socket?.on("receive_message", cb);
  }

  offReceiveMessage(cb?: (msg: ChatMessage) => void) {
    if (!this.socket) return;
    if (cb) this.socket.off("receive_message", cb);
    else this.socket.off("receive_message");
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
    if (!payload.ticket || !payload.sender || !payload.senderRole || !payload.message) {
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
      senderName: payload.senderName,
      senderAvatar: payload.senderAvatar,
    };

    // 1) Try socket with ack
    let socketResult: { ok?: boolean; error?: string } | null = null;
    if (this.socket) {
      socketResult = await new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve({ ok: false, error: "socket_timeout" });
          }
        }, this.SOCKET_ACK_TIMEOUT_MS);

        this.socket?.emit("send_message", envelope, (ack?: { ok?: boolean; error?: string }) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(ack ?? { ok: false, error: "no_ack" });
        });
      });
    }

    if (socketResult?.ok) return { ok: true } as const;

    // 2) Fallback to REST persistence
    try {
      const { data } = await api.post<ChatMessage>("/chats", {
        ticket: payload.ticket,
        sender: payload.sender,
        senderRole: payload.senderRole,
        message: payload.message,
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

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new ChatService();
