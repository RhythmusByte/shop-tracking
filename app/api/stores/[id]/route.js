import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Store from "@/models/Store";

export async function PATCH(req, { params }) {
  await dbConnect();
  const body = await req.json();
  const store = await Store.findByIdAndUpdate(params.id, body, { new: true });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ store });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  // Soft delete: keep historical entries intact, just hide from active lists.
  const store = await Store.findByIdAndUpdate(params.id, { active: false }, { new: true });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ store });
}
