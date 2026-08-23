export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Staff from "@/models/Staff";

export async function PATCH(req, { params }) {
  await dbConnect();
  const body = await req.json();
  const staff = await Staff.findByIdAndUpdate(params.id, body, { new: true });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ staff });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  // Soft-delete: past salary expenses may still reference this staff member.
  const staff = await Staff.findByIdAndUpdate(params.id, { active: false }, { new: true });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ staff });
}
