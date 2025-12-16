import mongoose from "mongoose";
const { Schema } = mongoose;

const ticketSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  Categories: {
    type: String,
    default: "test",
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Open", // Default status is Open
  },
  priority: {
    type: String,
    default: "Low", // Default priority is low
  },
}, { timestamps: true });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
