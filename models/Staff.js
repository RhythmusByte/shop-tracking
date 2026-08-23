import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true, trim: true },
    monthlySalary: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StaffSchema.index({ store: 1 });

export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
