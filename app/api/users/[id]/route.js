export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(req, { params }) {
  await dbConnect();
  const body = await req.json();
  const update = {};

  if (body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    update.passwordHash = await bcrypt.hash(body.password, 10);
  }
  if (body.role) update.role = body.role === "admin" ? "admin" : "staff";
  if (body.name !== undefined) update.name = body.name;

  const user = await User.findByIdAndUpdate(params.id, update, { new: true }).select("-passwordHash");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function DELETE(req, { params }) {
  await dbConnect();

  // Don't allow deleting the last remaining admin, that would lock everyone out.
  const target = await User.findById(params.id);
  if (target?.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last admin account" }, { status: 400 });
    }
  }

  const deleted = await User.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
