import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

ExpenseSchema.index({ store: 1, date: 1 });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
