import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD", one entry per store per date

    // Order COUNTS, not amounts. e.g. "35 online orders today".
    onlineSalesCount: { type: Number, default: 0 },
    offlineSalesCount: { type: Number, default: 0 },

    // Sales amounts, broken down by payment method. totalSales() sums these.
    cashSales: { type: Number, default: 0 },
    upiSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    creditSales: { type: Number, default: 0 },

    // Opening
    openingTime: { type: String, default: "" }, // "HH:MM"
    storeClosedToday: { type: Boolean, default: false },

    // Stock: received, damaged, wasted, and left over, all in KG, plus
    // free-text notes. Merges what used to be three separate sections
    // (stock received / stock left / damages) into one.
    stockInTime: { type: String, default: "" },
    stockReceivedKg: { type: Number, default: 0 },
    damagedKg: { type: Number, default: 0 },
    wastageKg: { type: Number, default: 0 },
    stockLeftForTomorrowKg: { type: Number, default: 0 },
    stockNotes: { type: String, default: "" },

    // Bank / FMO
    fmoAccount: { type: Number, default: 0 }, // amount deposited to the FMO account
    receiptConfirmed: { type: Boolean, default: false }, // receipt received, confirmed
    upiCardCrossChecked: { type: Boolean, default: false }, // UPI/card payments cross-checked

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

EntrySchema.index({ store: 1, date: 1 }, { unique: true });

export default mongoose.models.Entry || mongoose.model("Entry", EntrySchema);
