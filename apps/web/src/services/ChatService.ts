import { io, Socket } from "socket.io-client";
import api from "./api";

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

  init() {
    if (this.socket) return;
    this.socket = io(import.meta.env.VITE_SERVER_URL as string, {
      transports: ["websocket"],
    });
  }

  joinTicket(ticketId: string) {
    this.init();
    this.socket?.emit("join_ticket", { ticketId });
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
        }, 2000);

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
