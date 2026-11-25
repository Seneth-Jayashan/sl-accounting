import express from "express";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import ticketController from "../controllers/TicketController.js";

const router = express.Router();

// Get all tickets
router.get("/", protect, restrictTo("admin", "customer_supporter"), ticketController.getAllTickets);

// Create a ticket
router.post("/", protect, ticketController.addTicket);

// Get ticket by MongoDB _id
router.get("/ticket/:id", protect, ticketController.getTicketByID);

// Get all tickets of a specific user
router.get("/tickets/:user_id", protect, ticketController.getTicketsByUserID);

// Update ticket by _id (auth required)
router.put("/:id", protect, ticketController.updateTicket);

// Delete ticket by _id (admin only)
router.delete("/ticket/:id", protect, restrictTo("admin"), ticketController.deleteTicket);

// Bulk delete tickets (admin only)
router.delete("/bulk", protect, restrictTo("admin"), ticketController.deleteTicketsBulk);

export default router;
