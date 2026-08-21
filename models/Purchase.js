import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    vendor: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

PurchaseSchema.index({ store: 1, date: 1 });

export default mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);
