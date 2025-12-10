import mongoose from "mongoose";

const { Schema } = mongoose;

const ContactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    gmail: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reply: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

const Contact = mongoose.model("contactUs", ContactSchema);

export default Contact;
