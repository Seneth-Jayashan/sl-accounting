import { Server } from "socket.io";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

let ioInstance;

const getTicketRoom = (ticketId) => `ticket_${ticketId}`;

export const initSocket = (server) => {
	const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
	
	ioInstance = new Server(server, {
		cors: {
			origin: CLIENT_ORIGIN,
			credentials: true,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		},
		transports: ["websocket", "polling"],
		allowEIO3: true,
		pingTimeout: 60000,
		pingInterval: 25000,
	});

	ioInstance.on("connection", (socket) => {
		console.log("🟢 Socket connected:", socket.id);
		console.log("   Origin:", socket.handshake.headers.origin);
		console.log("   Transport:", socket.conn.transport.name);

		socket.on("join_ticket", ({ ticketId }) => {
			if (!ticketId) {
				console.warn("⚠️ join_ticket called without ticketId");
				return;
			}

			const room = getTicketRoom(ticketId);
			socket.join(room);
			console.log(`→ ${socket.id} joined room ${room}`);
		});

		// Backward compatibility with legacy event naming
		socket.on("join_event", ({ eventId }) => {
			if (!eventId) return;
			const room = getTicketRoom(eventId);
			socket.join(room);
			console.log(`→ ${socket.id} joined legacy room ${room}`);
		});

		socket.on("send_message", async (payload, ack) => {
			const { ticketId, eventId, senderId, sender_id, senderRole, sender_role, message } = payload || {};

			const resolvedTicketId = ticketId || eventId;
			const resolvedSenderId = senderId || sender_id;
			const resolvedSenderRole = senderRole || sender_role;

			if (!resolvedTicketId || !resolvedSenderId || !resolvedSenderRole || !message) {
				const error = "ticketId/eventId, senderId, senderRole, and message are required";
				if (typeof ack === "function") ack({ ok: false, error });
				return;
			}

			try {
				let senderName;
				let senderAvatar;

				const user = await User.findById(resolvedSenderId).lean();
				if (user) {
					senderName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined;
					senderAvatar = user.profileImage || undefined;
				}

				const chat = await Chat.create({
					ticket: resolvedTicketId,
					sender: resolvedSenderId,
					senderRole: resolvedSenderRole,
					senderName,
					senderAvatar,
					message,
				});

				const room = getTicketRoom(resolvedTicketId);
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

				ioInstance.to(room).emit("receive_message", outbound);
				if (typeof ack === "function") ack({ ok: true, message: outbound });
			} catch (err) {
				console.error("⚠️ Error saving or broadcasting chat message:", err);
				if (typeof ack === "function") ack({ ok: false, error: "internal_error" });
			}
		});

		socket.on("disconnect", (reason) => {
			console.log(`🔴 Socket disconnected: ${socket.id} (reason: ${reason})`);
		});

		socket.on("error", (error) => {
			console.error("❌ Socket error:", socket.id, error);
		});
	});

	return ioInstance;
};

export const getIO = () => {
	if (!ioInstance) {
		throw new Error("Socket.io has not been initialized. Call initSocket(server) first.");
	}
	return ioInstance;
};
