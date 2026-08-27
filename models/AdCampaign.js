import mongoose from "mongoose";

const AdCampaignSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD", the day this campaign entry is for

    // "Got the rates for tomorrow's ad campaign?"
    ratesReady: { type: Boolean, default: null }, // null = not yet answered
    sharedWithTeam: { type: Boolean, default: false }, // if ratesReady: shared with the team
    scheduledFor6AM: { type: Boolean, default: false }, // if ratesReady: scheduled for 6 AM
    noAdStatus: { type: String, enum: ["", "yet-to-do", "no-ad"], default: "" }, // if !ratesReady

    // "Got the numbers for the telecalling campaign?"
    telecallingDataAvailable: { type: Boolean, default: null }, // null = not yet answered
    contactsReceived: { type: Number, default: 0 },
    contactsAccepted: { type: Number, default: 0 },
    contactsLeftToCall: { type: Number, default: 0 },
    contactsConverted: { type: Number, default: 0 },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

AdCampaignSchema.index({ store: 1, date: 1 }, { unique: true });

export default mongoose.models.AdCampaign || mongoose.model("AdCampaign", AdCampaignSchema);
