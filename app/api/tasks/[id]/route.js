export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Task from "@/models/Task";

export async function PATCH(req, { params }) {
  await dbConnect();
  const body = await req.json();
  const task = await Task.findByIdAndUpdate(params.id, body, { new: true });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  const deleted = await Task.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
