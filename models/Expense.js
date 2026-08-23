import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    notes: { type: String, default: "" },
    // "salary" expenses can optionally reference the staff member being paid.
    category: { type: String, enum: ["general", "salary"], default: "general" },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  },
  { timestamps: true }
);

ExpenseSchema.index({ store: 1, date: 1 });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
