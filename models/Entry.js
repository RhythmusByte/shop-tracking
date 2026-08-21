import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD", one entry per store per date

    // Sales, broken down by payment method. Total is computed (not stored) from these.
    onlineSales: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    upiSales: { type: Number, default: 0 },
    cardSales: { type: Number, default: 0 },
    creditSales: { type: Number, default: 0 },

    // Expenses for the day (cash spent on-site: petty cash, local purchases, etc.)
    totalExpense: { type: Number, default: 0 },

    // Ads (must start at 6 AM). adConversions is a COUNT of orders attributed to the
    // ad, not a currency amount.
    adStartTime: { type: String, default: "" }, // "HH:MM"
    adStartedOnTime: { type: Boolean, default: false },
    adConversions: { type: Number, default: 0 },

    // Opening
    openingTime: { type: String, default: "" }, // "HH:MM"

    // Stock in
    stockInTime: { type: String, default: "" },
    stockInNotes: { type: String, default: "" },

    // Stock left (checked the following morning)
    stockLeftChecked: { type: Boolean, default: false },
    stockLeftNotes: { type: String, default: "" },

    // Bank statement / deposit
    bankStatementChecked: { type: Boolean, default: false },
    bankCreditedBy12PM: { type: Boolean, default: false },

    // Damages
    damagesChecked: { type: Boolean, default: false },
    damagesFound: { type: Boolean, default: false },
    damagesNotes: { type: String, default: "" },

    // Store call confirmation
    storeCalled: { type: Boolean, default: false },
    moneyDeposited: { type: Boolean, default: false },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

EntrySchema.index({ store: 1, date: 1 }, { unique: true });

export default mongoose.models.Entry || mongoose.model("Entry", EntrySchema);
