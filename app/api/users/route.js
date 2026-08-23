export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  await dbConnect();
  const users = await User.find({}).select("-passwordHash").sort({ createdAt: 1 }).lean();
  return NextResponse.json({ users });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.username || !body.password) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await User.findOne({ username: body.username });
  if (existing) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await User.create({
    username: body.username.trim(),
    passwordHash,
    role: body.role === "admin" ? "admin" : "staff",
    name: body.name || "",
  });

  const { passwordHash: _omit, ...safe } = user.toObject();
  return NextResponse.json({ user: safe }, { status: 201 });
}
