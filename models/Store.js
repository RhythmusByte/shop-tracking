import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true }, // short code e.g. "TVM1"
    storeNumber: { type: String, default: "" },
    managerName: { type: String, default: "" },
    managerContact: { type: String, default: "" },

    // Used to compute the on-time / late / not-logged status on the dashboard.
    // "HH:MM" 24hr. If blank, opening-time status is not evaluated for this store.
    expectedOpeningTime: { type: String, default: "" },
    expectedStockCheckTime: { type: String, default: "" },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
