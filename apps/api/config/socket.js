import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Class from "../models/Class.js";
import ClassChat from "../models/ClassChat.js";

let ioInstance;

const parseOrigins = (raw) =>
  (raw || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const getTicketRoom = (ticketId) => `ticket_${ticketId}`;
const getClassRoom = (classId) => `class_${classId}`;

// --- MIDDLEWARE: Socket Authentication ---
const authenticateSocket = async (socket, next) => {
  try {
    // 1. Extract Token
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // 2. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!decoded || !decoded.id) {
        return next(new Error("Authentication error: Invalid token structure"));
    }

    // 3. Fetch User (Lean for performance)
    // We explicitly select 'batch' here because it's needed for class chat security
    const user = await User.findById(decoded.id)
      .select("_id role firstName lastName avatar batch")
      .lean();

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // 4. Attach to Socket Object
    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket Auth Failed:", err.message);
    next(new Error("Authentication error: Invalid token"));
  }
};

export const initSocket = (server) => {
  const origins =
    parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN) || [
      "http://localhost:5173",
    ];

  ioInstance = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply Authentication Middleware
  ioInstance.use(authenticateSocket);

  ioInstance.on("connection", (socket) => {
    console.log(
      `🟢 User connected: ${socket.user.firstName} (${socket.user.role}) - ID: ${socket.id}`
    );

    // =================================================================
    //  SECTION 1: TICKET SUPPORT CHAT (1-on-1)
    // =================================================================

    socket.on("join_ticket", async ({ ticketId }) => {
      if (!ticketId) return;

      try {
        // SECURITY: Admins can join any ticket. Students can only join their own.
        if (socket.user.role !== "admin") {
          const ticket = await Ticket.findById(ticketId).select("user_id");
          if (
            !ticket ||
            ticket.user_id.toString() !== socket.user._id.toString()
          ) {
            console.warn(
              `⚠️ Security Alert: User ${socket.user._id} tried to join unauthorized ticket ${ticketId}`
            );
            socket.emit("error", { message: "Unauthorized access to this ticket" });
            return;
          }
        }

        const room = getTicketRoom(ticketId);
        socket.join(room);
        console.log(`→ ${socket.user.firstName} joined ticket room ${room}`);
      } catch (err) {
        console.error("Join Ticket Error:", err);
      }
    });

    socket.on("send_message", async (payload, ack) => {
      const { ticketId, message } = payload;

      if (!ticketId || !message) {
        if (typeof ack === "function")
          ack({ ok: false, error: "Missing required fields" });
        return;
      }

      try {
        const chat = await Chat.create({
          ticket: ticketId,
          sender: socket.user._id,
          senderRole: socket.user.role,
          senderName: `${socket.user.firstName} ${socket.user.lastName}`,
          senderAvatar: socket.user.avatar,
          message: message,
        });

        const outbound = {
          _id: chat._id,
          ticket: chat.ticket,
          sender: chat.sender,
          senderRole: chat.senderRole,
          senderName: chat.senderName,
          senderAvatar: chat.senderAvatar,
          message: chat.message,
          createdAt: chat.createdAt,
        };

        const room = getTicketRoom(ticketId);
        ioInstance.to(room).emit("receive_message", outbound);

        if (typeof ack === "function") ack({ ok: true, message: outbound });
      } catch (err) {
        console.error("⚠️ Message Error:", err);
        if (typeof ack === "function")
          ack({ ok: false, error: "Internal Server Error" });
      }
    });

    socket.on("typing", ({ ticketId, isTyping }) => {
      if (!ticketId) return;
      const room = getTicketRoom(ticketId);
      socket.to(room).emit("typing", {
        isTyping,
        senderId: socket.user._id,
        senderName: socket.user.firstName,
      });
    });

    // =================================================================
    //  SECTION 2: CLASSROOM CHAT (Group)
    // =================================================================

    socket.on("join_class", async ({ classId }) => {
      if (!classId) return;

      try {
        // SECURITY CHECK: Verify Student Enrollment
        if (socket.user.role === "student") {
          const targetClass = await Class.findById(classId).select("batch");

          if (!targetClass) {
            socket.emit("error", { message: "Class not found." });
            return;
          }

          // Handle cases where socket.user.batch is populated vs string ID
          const studentBatchId = socket.user.batch?._id?.toString() || socket.user.batch?.toString();
          const classBatchId = targetClass.batch?.toString();

          if (studentBatchId !== classBatchId) {
            console.warn(`Unauthorized: Student ${socket.user._id} tried to join Class ${classId}`);
            socket.emit("error", { message: "You are not enrolled in this class." });
            return;
          }
        }

        const room = getClassRoom(classId);
        socket.join(room);
        console.log(`→ ${socket.user.firstName} joined class room ${room}`);
      } catch (err) {
        console.error("Join Class Error:", err);
      }
    });

    socket.on("send_class_message", async (payload, ack) => {
      const { classId, message, attachments } = payload; 

      if (!classId || (!message && (!attachments || attachments.length === 0))) return;
      const room = getClassRoom(classId);

      // Verify user is actually in the room (prevents bypassing join_class security)
      if (!socket.rooms.has(room)) {
        if (ack) ack({ ok: false, error: "Not joined in room" });
        return;
      }

      try {
        const newChat = await ClassChat.create({
          classId: classId,
          sender: socket.user._id,
          senderRole: socket.user.role,
          senderName: `${socket.user.firstName} ${socket.user.lastName}`,
          senderAvatar: socket.user.avatar,
          message: message || "",
          attachments: attachments || [] // Save attachments
        });

        const outbound = {
          ...newChat.toObject(),
          ticket: newChat.classId, // Map for potential frontend compatibility
        };

        ioInstance.to(room).emit("receive_class_message", outbound);
        if (ack) ack({ ok: true, message: outbound });
      } catch (err) {
        console.error("Class Message Error:", err);
      }
    });

    socket.on("typing_class", ({ classId, isTyping }) => {
      if (!classId) return;
      const room = getClassRoom(classId);
      socket.to(room).emit("typing_class", {
        isTyping,
        senderId: socket.user._id,
      });
    });

    // =================================================================
    //  DISCONNECT
    // =================================================================
    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${socket.user.firstName}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error(
      "Socket.io has not been initialized. Call initSocket(server) first."
    );
  }
  return ioInstance;
};