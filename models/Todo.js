import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
    calledStores: { type: Boolean, default: false },
    checkedSales: { type: Boolean, default: false },
    confirmedDeposit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Todo || mongoose.model("Todo", TodoSchema);
