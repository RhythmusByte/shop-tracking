export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Task from "@/models/Task";
import Store from "@/models/Store";

// GET /api/tasks?date=YYYY-MM-DD              -> tasks for that specific day
// GET /api/tasks?recurring=true                -> the most recent instance of
//   every distinct recurring task title (used to figure out which recurring
//   tasks need a fresh, undone copy created for the current day)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const recurring = searchParams.get("recurring");

  if (recurring === "true") {
    const all = await Task.find({ recurring: true }).populate("store").sort({ date: -1 }).lean();
    const seen = new Set();
    const latestByTitle = [];
    for (const t of all) {
      const key = `${t.title}::${t.store?._id || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latestByTitle.push(t);
    }
    return NextResponse.json({ tasks: latestByTitle });
  }

  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  const tasks = await Task.find({ date }).populate("store").sort({ createdAt: 1 }).lean();
  return NextResponse.json({ tasks });
}

// POST body: { date, title, store?, assignedTo?, recurring? }
export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.date || !body.title) {
    return NextResponse.json({ error: "date and title are required" }, { status: 400 });
  }
  const task = await Task.create({
    date: body.date,
    title: body.title.trim(),
    store: body.store || null,
    assignedTo: body.assignedTo || "",
    recurring: !!body.recurring,
  });
  return NextResponse.json({ task }, { status: 201 });
}
