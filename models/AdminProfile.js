import mongoose from "mongoose";

const AdminProfileSchema = new mongoose.Schema(
  {
    // Singleton: always the same fixed key so there's only ever one document.
    key: { type: String, default: "admin", unique: true },
    name: { type: String, default: "Admin" },
    avatarUrl: { type: String, default: "" }, // empty = show default person icon
  },
  { timestamps: true }
);

export default mongoose.models.AdminProfile || mongoose.model("AdminProfile", AdminProfileSchema);
