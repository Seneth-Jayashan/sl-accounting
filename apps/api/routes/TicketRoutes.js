import express from "express";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import ticketController from "../controllers/TicketController.js";

const router = express.Router();

// Get all tickets
router.get("/", ticketController.getAllTickets);

// Create a ticket
router.post("/", ticketController.addTicket);

// Get ticket by MongoDB _id
router.get("/ticket/:id", ticketController.getTicketByID);

// Get all tickets of a specific user
router.get("/tickets/:user_id", ticketController.getTicketsByUserID);

// Update ticket by _id (auth required)
router.put("/:id", protect, ticketController.updateTicket);

// Delete ticket by _id (admin only)
router.delete("/ticket/:id", protect, restrictTo("admin"), ticketController.deleteTicket);

export default router;
