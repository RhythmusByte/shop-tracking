import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    title: { type: String, required: true, trim: true },
    // Optional: ties this task to a specific store (e.g. "Called Technopark Store 1").
    // Null means a general/global task for the day.
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    // Free-text assignee. There's a single admin user, so this isn't a user reference,
    // just a label (e.g. a staff member's name) for tasks delegated verbally/by phone.
    assignedTo: { type: String, default: "" },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TaskSchema.index({ date: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
