import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true }, // short code e.g. "TVM1"
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
