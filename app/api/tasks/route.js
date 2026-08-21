export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Task from "@/models/Task";

// GET /api/tasks?date=YYYY-MM-DD
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const tasks = await Task.find({ date }).populate("store").sort({ createdAt: 1 }).lean();
  return NextResponse.json({ tasks });
}

// POST body: { date, title, store?, assignedTo? }
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
  });
  return NextResponse.json({ task }, { status: 201 });
}
