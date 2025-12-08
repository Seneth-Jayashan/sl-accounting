import contact from "../models/Support.js";
import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// CENTRALIZED EMAIL — change here only once
const ADMIN_EMAIL = "sajanaanupama123@gmail.com";

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ADMIN_EMAIL,
    pass: "melc veit raso vsqm", // App password
  },
});

//   GET ALL CONTACTS
const getAllMs = async (req, res) => {
  try {
    const Ms = await contact.find();
    return res.status(200).json({ Ms });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching messages" });
  }
};

//       ADD MESSAGE
const addMs = async (req, res) => {
  const { name, gmail, phoneNumber, message } = req.body;

  try {
    const Ms = new contact({ name, gmail, phoneNumber, message });
    await Ms.save();

    // EMAIL TO ADMIN
    const mailOptions = {
      from: `"${name}" <${gmail}>`,
      to: ADMIN_EMAIL,
      replyTo: gmail,
      subject: "New Contact Us Form Submission",
      text: `You have received a new message:\n\nName: ${name}\nEmail: ${gmail}\nPhone: ${phoneNumber}\nMessage: ${message}\n`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log("Error sending email to admin:", error);
      else console.log("Email sent to admin: " + info.response);
    });

    // Notify Support Team
    const supporters = await User.find({ role: "customer_supporter" });

    const notifications = supporters.map((support) => ({
      user_id: support.user_id,
      message: `New contact message submitted by ${name}.`,
    }));

    await Notification.insertMany(notifications);

    return res.status(200).json({ Ms });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to add message" });
  }
};

//    GET MESSAGE BY ID
const getByID = async (req, res) => {
  try {
    const Ms = await contact.findById(req.params.id);
    if (!Ms) return res.status(404).json({ message: "Message not found" });

    return res.status(200).json({ Ms });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching message" });
  }
};

//   REPLY & SEND EMAIL
const replyUser = async (req, res) => {
  const id = req.params.id;
  const { name, gmail, phoneNumber, message, reply } = req.body;

  try {
    const Ms = await contact.findByIdAndUpdate(
      id,
      { name, gmail, phoneNumber, message, reply },
      { new: true }
    );

    if (!Ms) return res.status(404).json({ message: "Message not found" });

    // Email to User
    const mailOptions = {
      from: `SL Accounting <${ADMIN_EMAIL}>`,
      to: gmail,
      subject: "Reply to Your Contact Form Submission",
      text: `Dear ${name},\n\nThanks for contacting us.\n\nYour message: "${message}"\nOur reply: "${reply}"\n\nBest regards,\nSl Accounting team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log("Error sending email:", error);
      else console.log("Email sent: " + info.response);
    });

    return res.status(200).json({ Ms });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to reply to message" });
  }
};

//   DELETE CONTACT MESSAGE
const deletecontactM = async (req, res) => {
  try {
    const Ms = await contact.findByIdAndDelete(req.params.id);
    if (!Ms) return res.status(404).json({ message: "Message not found" });

    return res.status(200).json({ Ms });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to delete message" });
  }
};

// FINAL EXPORT (ESM)
export default {
  getAllMs,
  addMs,
  getByID,
  replyUser,
  deletecontactM,
};
